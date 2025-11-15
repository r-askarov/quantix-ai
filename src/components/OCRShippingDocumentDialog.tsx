import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScanText, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Tesseract from "tesseract.js";
import { ShippingItem } from "@/pages/Orders";

interface OCRShippingDocumentDialogProps {
  onOCRResult: (items: ShippingItem[]) => void;
}

const OCRShippingDocumentDialog: React.FC<OCRShippingDocumentDialogProps> = ({ onOCRResult }) => {
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [preview, setPreview] = React.useState<string>("");
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type.startsWith('image/')) {
        setFile(selectedFile);
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        toast({
          title: "שגיאה",
          description: "אנא בחר קובץ תמונה (JPG, PNG, etc.)",
          variant: "destructive",
        });
      }
    }
  };

  const parseShippingDocument = (text: string): ShippingItem[] => {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const items: ShippingItem[] = [];
    
    console.log('OCR Text Lines:', lines);
    
    // חיפוש כותרות עמודות לזיהוי המבנה
    const headerPatterns = {
      itemName: /שם\s*פריט|פריט|מוצר/i,
      barcode: /בר\s*קוד|ברקוד|קוד|sku/i,
      quantity: /בודדים|כמות|יח|qty/i
    };

    let headerLine = -1;
    let itemNameCol = -1;
    let barcodeCol = -1;
    let quantityCol = -1;

    // זיהוי שורת הכותרות
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      console.log(`Checking header line ${i}:`, line);
      
      if (headerPatterns.itemName.test(line) && 
          (headerPatterns.barcode.test(line) || headerPatterns.quantity.test(line))) {
        headerLine = i;
        
        // זיהוי מיקום העמודות לפי המיקום בשורה
        const words = line.split(/\s+/);
        console.log('Header words:', words);
        
        words.forEach((word, index) => {
          if (headerPatterns.itemName.test(word)) {
            itemNameCol = index;
            console.log('Found item name column at:', index);
          }
          if (headerPatterns.barcode.test(word)) {
            barcodeCol = index;
            console.log('Found barcode column at:', index);
          }
          if (headerPatterns.quantity.test(word)) {
            quantityCol = index;
            console.log('Found quantity column at:', index);
          }
        });
        break;
      }
    }

    console.log(`Header found at line ${headerLine}, columns: name=${itemNameCol}, barcode=${barcodeCol}, quantity=${quantityCol}`);

    // אם מצאנו כותרות, נעבד את השורות שאחריהן כטבלה
    if (headerLine >= 0 && itemNameCol >= 0 && quantityCol >= 0) {
      for (let i = headerLine + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.length < 5) continue;
        
        console.log(`Processing data line ${i}:`, line);
        
        // פיצול השורה לעמודות
        const columns = line.split(/\s+/);
        console.log('Data columns:', columns);
        
        if (columns.length >= Math.max(itemNameCol, quantityCol) + 1) {
          let name = '';
          let barcode = '';
          let quantity = 0;
          
          // חילוץ שם הפריט
          if (itemNameCol < columns.length) {
            // נסה לחבר מספר מילים לשם הפריט אם יש
            const nameWords = [];
            for (let j = itemNameCol; j < columns.length; j++) {
              const col = columns[j];
              // אם זה לא נראה כמו מספר או ברקוד, נוסיף לשם
              if (!/^\d+$/.test(col) && !/^[0-9]{8,13}$/.test(col)) {
                nameWords.push(col);
              } else {
                break;
              }
            }
            name = nameWords.join(' ');
          }
          
          // חילוץ ברקוד
          if (barcodeCol >= 0 && barcodeCol < columns.length) {
            barcode = columns[barcodeCol];
          } else {
            // חיפוש ברקוד בשורה (מספר של 8-13 ספרות)
            const barcodeMatch = line.match(/\b[0-9]{8,13}\b/);
            if (barcodeMatch) {
              barcode = barcodeMatch[0];
            }
          }
          
          // חילוץ כמות
          if (quantityCol < columns.length) {
            const quantityStr = columns[quantityCol];
            const quantityNum = parseInt(quantityStr);
            if (!isNaN(quantityNum) && quantityNum > 0) {
              quantity = quantityNum;
            }
          }
          
          // אם לא מצאנו כמות בעמודה הצפויה, נחפש מספר בשורה
          if (quantity === 0) {
            const numbers = line.match(/\b(\d+)\b/g);
            if (numbers) {
              for (const num of numbers) {
                const n = parseInt(num);
                if (n > 0 && n < 10000 && num !== barcode) { // סביר שזו כמות
                  quantity = n;
                  break;
                }
              }
            }
          }
          
          console.log(`Extracted: name="${name}", barcode="${barcode}", quantity=${quantity}`);
          
          // הוספת הפריט אם יש לו שם וכמות
          if (name.length > 2 && quantity > 0) {
            items.push({
              name: name.trim(),
              quantity: quantity,
              status: 'match',
              barcode: barcode || undefined
            });
            console.log(`Added item: ${name}, Barcode: ${barcode}, Quantity: ${quantity}`);
          }
        }
      }
    }

    // אם לא מצאנו פריטים עם השיטה המובנית, ננסה שיטות גיבוי
    if (items.length === 0) {
      console.log('No structured table found, trying alternative parsing methods');
      return parseAlternativeFormats(lines);
    }

    console.log(`Found ${items.length} items using table structure parsing`);
    return items;
  };

  const parseAlternativeFormats = (lines: string[]): ShippingItem[] => {
    const items: ShippingItem[] = [];
    
    // תבניות חלופיות לזיהוי פריטים
    const patterns = [
      // תבנית: שם פריט [ברקוד] כמות
      /(.+?)\s+([0-9]{8,13})\s+(\d+)\s*(?:בודדים|יח)?/i,
      // תבנית: מספר שם פריט ברקוד כמות
      /^\d+\s+(.+?)\s+([0-9]{8,13})\s+(\d+)/i,
      // תבנית: שם פריט כמות (ללא ברקוד)
      /(.+?)\s+(\d+)\s*(?:בודדים|יח)/i,
      // תבנית: שם פריט [מספרים שונים] כמות בסוף
      /(.+?)\s+.*?(\d+)\s*$/
    ];

    lines.forEach((line, index) => {
      console.log(`Trying alternative parsing for line ${index}: ${line}`);
      
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          let name = '';
          let barcode = '';
          let quantity = 0;
          
          if (pattern.source.includes('([0-9]{8,13})')) {
            // תבנית עם ברקוד
            name = match[1].trim();
            barcode = match[2];
            quantity = parseInt(match[3]);
          } else {
            // תבנית ללא ברקוד
            name = match[1].trim();
            quantity = parseInt(match[2]);
            
            // נסה למצוא ברקוד בשורה
            const barcodeMatch = line.match(/\b[0-9]{8,13}\b/);
            if (barcodeMatch) {
              barcode = barcodeMatch[0];
            }
          }
          
          if (name.length > 2 && quantity > 0 && quantity < 10000) {
            // נקה את השם ממספרים מיותרים
            name = name.replace(/^\d+\s*/, '').trim();
            
            items.push({
              name: name,
              quantity: quantity,
              status: 'match',
              barcode: barcode || undefined
            });
            console.log(`Added alternative item: ${name}, Barcode: ${barcode}, Quantity: ${quantity}`);
            break;
          }
        }
      }
    });

    return items;
  };

  const compareWithInventory = (scannedItems: ShippingItem[]): ShippingItem[] => {
    // נשתמש בנתוני המלאי מהלוקל סטורג' או מהחנות
    const inventoryData = localStorage.getItem('products');
    let inventory: any[] = [];
    
    if (inventoryData) {
      try {
        inventory = JSON.parse(inventoryData);
      } catch (error) {
        console.error('Error parsing inventory data:', error);
      }
    }

    return scannedItems.map(item => {
      // נחפש התאמה לפי ברקוד קודם
      let inventoryItem = null;
      if (item.barcode) {
        inventoryItem = inventory.find(inv => 
          inv.barcode === item.barcode || 
          inv.sku === item.barcode
        );
      }
      
      // אם לא מצאנו לפי ברקוד, נחפש לפי שם
      if (!inventoryItem) {
        inventoryItem = inventory.find(inv => 
          inv.name.toLowerCase().includes(item.name.toLowerCase()) ||
          item.name.toLowerCase().includes(inv.name.toLowerCase())
        );
      }

      if (inventoryItem) {
        return {
          ...item,
          status: inventoryItem.quantity >= item.quantity ? 'match' : 'missing'
        };
      } else {
        return {
          ...item,
          status: 'extra'
        };
      }
    });
  };

  const handleOCR = async () => {
    if (!file) {
      toast({
        title: "שגיאה",
        description: "אנא בחר קובץ תמונה לסריקה",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await Tesseract.recognize(file, 'heb+eng', {
        logger: m => console.log(m)
      });

      const extractedText = result.data.text;
      console.log('Extracted text:', extractedText);

      const parsedItems = ((): ShippingItem[] => {
        // call existing parseShippingDocument and fallbacks
        // keep the same logic as before by copying/paraphrasing here
        const lines = extractedText.split('\n').filter(line => line.trim().length > 0);
        // reuse parsing functions declared above
        let items = parseShippingDocument(extractedText);
        if (items.length === 0) items = parseAlternativeFormats(lines);
        return items;
      })();

      if (parsedItems.length === 0) {
        toast({
          title: "לא נמצאו פריטים",
          description: "לא הצלחנו לזהות פריטים בתעודת המשלוח. ודא שהתמונה מכילה טבלה עם עמודות: שם פריט, בר קוד, בודדים",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const comparedItems = compareWithInventory(parsedItems);
      onOCRResult(comparedItems);

      toast({
        title: "הסריקה הושלמה בהצלחה!",
        description: `זוהו ${parsedItems.length} פריטים מהעמודות: שם פריט, בר קוד, בודדים`,
      });

      setOpen(false);
      setFile(null);
      setPreview("");
    } catch (error) {
      console.error("OCR error:", error);
      toast({
        title: "שגיאה בסריקה",
        description: "אירעה שגיאה בעת סריקת התמונה. נסה שוב עם תמונה אחרת.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Modal portal
  const modal = open
    ? createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 99999 }}
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            className="relative bg-white p-6 rounded shadow w-full max-w-2xl mx-4"
            dir="rtl"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">סריקת תעודת משלוח עם OCR</h2>
              <button
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="shipping-document">בחר תמונה של תעודת המשלוח</Label>
                <Input
                  id="shipping-document"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) {
                      if (selectedFile.type.startsWith('image/')) {
                        setFile(selectedFile);
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setPreview(ev.target?.result as string);
                        };
                        reader.readAsDataURL(selectedFile);
                      } else {
                        toast({
                          title: "שגיאה",
                          description: "אנא בחר קובץ תמונה (JPG, PNG, etc.)",
                          variant: "destructive",
                        });
                      }
                    }
                  }}
                  className="mt-1"
                />
              </div>

              {preview && (
                <div className="mt-4">
                  <Label>תצוגה מקדימה:</Label>
                  <img
                    src={preview}
                    alt="Document preview"
                    className="mt-2 max-w-full h-auto max-h-64 object-contain border rounded"
                  />
                </div>
              )}

              <div className="text-xs text-gray-500">
                <p>המערכת מזהה טבלאות עם העמודות הבאות:</p>
                <ul className="list-disc pr-5 mt-1">
                  <li><strong>שם פריט</strong> - יועבר לעמודת "שם מוצר"</li>
                  <li><strong>בר קוד</strong> - יועבר לעמודת "ברקוד/SKU"</li>
                  <li><strong>בודדים</strong> - יועבר לעמודת "כמות"</li>
                  <li>ודא שהטקסט בתמונה חד וברור</li>
                  <li>העמודות צריכות להיות מסודרות בטבלה</li>
                </ul>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setOpen(false); setFile(null); setPreview(""); }}>
                  ביטול
                </Button>
                <Button onClick={async () => {
                  // reuse existing handleOCR logic
                  if (!file) {
                    toast({
                      title: "שגיאה",
                      description: "אנא בחר קובץ תמונה לסריקה",
                      variant: "destructive",
                    });
                    return;
                  }
                  setLoading(true);
                  try {
                    const result = await Tesseract.recognize(file, 'heb+eng', {
                      logger: m => console.log(m)
                    });

                    const extractedText = result.data.text;
                    const parsedItems = ((): ShippingItem[] => {
                      // call existing parseShippingDocument and fallbacks
                      // keep the same logic as before by copying/paraphrasing here
                      const lines = extractedText.split('\n').filter(line => line.trim().length > 0);
                      // reuse parsing functions declared above
                      let items = parseShippingDocument(extractedText);
                      if (items.length === 0) items = parseAlternativeFormats(lines);
                      return items;
                    })();

                    if (parsedItems.length === 0) {
                      toast({
                        title: "לא נמצאו פריטים",
                        description: "לא הצלחנו לזהות פריטים בתעודת המשלוח. ודא שהתמונה מכילה טבלה עם עמודות: שם פריט, בר קוד, בודדים",
                        variant: "destructive",
                      });
                      setLoading(false);
                      return;
                    }

                    const comparedItems = compareWithInventory(parsedItems);
                    onOCRResult(comparedItems);

                    toast({
                      title: "הסריקה הושלמה בהצלחה!",
                      description: `זוהו ${parsedItems.length} פריטים מהעמודות: שם פריט, בר קוד, בודדים`,
                    });

                    setOpen(false);
                    setFile(null);
                    setPreview("");
                  } catch (error) {
                    console.error("OCR error:", error);
                    toast({
                      title: "שגיאה בסריקה",
                      description: "אירעה שגיאה בעת סריקת התמונה. נסה שוב עם תמונה אחרת.",
                      variant: "destructive",
                    });
                  } finally {
                    setLoading(false);
                  }
                }} disabled={!file || loading}>
                  {loading ? "סורק..." : "סרוק מסמך"}
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  // Render trigger button + modal portal
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <ScanText className="h-4 w-4 mr-2" />
        סריקת תעודת משלוח
      </Button>
      {modal}
    </>
  );
};

export default OCRShippingDocumentDialog;
