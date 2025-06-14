import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScanText, Upload } from "lucide-react";
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
    
    // תבניות מסודרות לזיהוי ברקודים ושמות מוצרים
    const structuredPatterns = [
      // תבנית 1: ברקוד בשורה נפרדת ואחריו שם המוצר וכמות
      {
        barcodePattern: /^[0-9]{8,13}$/, // ברקוד סטנדרטי
        nameQuantityPattern: /(.+?)\s+(?:כמות|qty|x)\s*:?\s*(\d+)/i
      },
      // תבנית 2: שם מוצר ברקוד וכמות באותה שורה
      {
        combinedPattern: /(.+?)\s+([0-9]{8,13})\s+(?:כמות|qty|x)\s*:?\s*(\d+)/i
      },
      // תבנית 3: שורות עם פורמט טבלה - שם | ברקוד | כמות
      {
        tablePattern: /(.+?)\s*\|\s*([0-9]{8,13})\s*\|\s*(\d+)/
      },
      // תבנית 4: ברקוד מתחיל ב-SKU או דומה
      {
        skuPattern: /(?:SKU|sku|קוד)\s*:?\s*([0-9A-Za-z-_]{6,})\s+(.+?)\s+(?:כמות|qty|x)\s*:?\s*(\d+)/i
      }
    ];

    // נעבור על השורות ונחפש תבניות מסודרות
    for (let i = 0; i < lines.length; i++) {
      const currentLine = lines[i].trim();
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
      
      // בדיקה אם השורה הנוכחית היא ברקוד
      if (structuredPatterns[0].barcodePattern.test(currentLine)) {
        const barcode = currentLine;
        
        // נחפש בשורה הבאה שם מוצר וכמות
        const nameQuantityMatch = nextLine.match(structuredPatterns[0].nameQuantityPattern);
        if (nameQuantityMatch) {
          const name = nameQuantityMatch[1].trim();
          const quantity = parseInt(nameQuantityMatch[2]);
          
          if (name.length > 2 && quantity > 0) {
            items.push({
              name: name,
              quantity: quantity,
              status: 'match',
              barcode: barcode
            });
            console.log(`Found structured item: ${name}, Barcode: ${barcode}, Quantity: ${quantity}`);
            i++; // דלג על השורה הבאה כי כבר עיבדנו אותה
            continue;
          }
        }
      }
      
      // בדיקה לתבנית משולבת (שם + ברקוד + כמות באותה שורה)
      const combinedMatch = currentLine.match(structuredPatterns[1].combinedPattern);
      if (combinedMatch) {
        const name = combinedMatch[1].trim();
        const barcode = combinedMatch[2];
        const quantity = parseInt(combinedMatch[3]);
        
        if (name.length > 2 && quantity > 0) {
          items.push({
            name: name,
            quantity: quantity,
            status: 'match',
            barcode: barcode
          });
          console.log(`Found combined item: ${name}, Barcode: ${barcode}, Quantity: ${quantity}`);
          continue;
        }
      }
      
      // בדיקה לתבנית טבלה
      const tableMatch = currentLine.match(structuredPatterns[2].tablePattern);
      if (tableMatch) {
        const name = tableMatch[1].trim();
        const barcode = tableMatch[2];
        const quantity = parseInt(tableMatch[3]);
        
        if (name.length > 2 && quantity > 0) {
          items.push({
            name: name,
            quantity: quantity,
            status: 'match',
            barcode: barcode
          });
          console.log(`Found table item: ${name}, Barcode: ${barcode}, Quantity: ${quantity}`);
          continue;
        }
      }
      
      // בדיקה לתבנית SKU
      const skuMatch = currentLine.match(structuredPatterns[3].skuPattern);
      if (skuMatch) {
        const sku = skuMatch[1];
        const name = skuMatch[2].trim();
        const quantity = parseInt(skuMatch[3]);
        
        if (name.length > 2 && quantity > 0) {
          items.push({
            name: name,
            quantity: quantity,
            status: 'match',
            barcode: sku
          });
          console.log(`Found SKU item: ${name}, SKU: ${sku}, Quantity: ${quantity}`);
          continue;
        }
      }
    }

    // אם לא מצאנו פריטים עם התבניות המסודרות, ננסה את השיטה הישנה כגיבוי
    if (items.length === 0) {
      console.log('No structured patterns found, falling back to legacy parsing');
      return parseLegacyFormat(lines);
    }

    console.log(`Found ${items.length} structured items`);
    return items;
  };

  const parseLegacyFormat = (lines: string[]): ShippingItem[] => {
    const items: ShippingItem[] = [];
    
    // השיטה הישנה לגיבוי
    const itemPatterns = [
      /(.+?)\s+(\d+)\s*יח[׳']?/g,
      /(.+?)\s+כמות[:\s]*(\d+)/g,
      /(.+?)\s+x\s*(\d+)/g,
      /(\d+)\s+(.+)/g
    ];

    for (const line of lines) {
      for (const pattern of itemPatterns) {
        const matches = [...line.matchAll(pattern)];
        for (const match of matches) {
          let name = '';
          let quantity = 0;
          
          if (pattern.source.includes('(\\d+)\\s+(.+)')) {
            quantity = parseInt(match[1]);
            name = match[2].trim();
          } else {
            name = match[1].trim();
            quantity = parseInt(match[2]);
          }

          if (name && quantity > 0 && name.length > 2) {
            if (!/^\d+$/.test(name) && !/\d{2}\/\d{2}\/\d{4}/.test(name)) {
              items.push({
                name: name,
                quantity: quantity,
                status: 'match'
              });
            }
          }
        }
      }
    }

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

      const parsedItems = parseShippingDocument(extractedText);
      console.log('Parsed items:', parsedItems);

      if (parsedItems.length === 0) {
        toast({
          title: "לא נמצאו פריטים",
          description: "לא הצלחנו לזהות פריטים בתעודת המשלוח. נסה תמונה בהירה יותר או ודא שהמסמך מכיל תבנית מסודרת.",
          variant: "destructive",
        });
        return;
      }

      const comparedItems = compareWithInventory(parsedItems);
      onOCRResult(comparedItems);

      toast({
        title: "הסריקה הושלמה בהצלחה!",
        description: `זוהו ${parsedItems.length} פריטים בתעודת המשלוח בתבנית מסודרת`,
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <ScanText className="h-4 w-4 mr-2" />
          סריקת תעודת משלוח
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl" className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>סריקת תעודת משלוח עם OCR</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="shipping-document">בחר תמונה של תעודת המשלוח</Label>
            <Input
              id="shipping-document"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
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
            <p>טיפים לסריקה מסודרת יותר:</p>
            <ul className="list-disc pr-5 mt-1">
              <li>ודא שהתמונה חדה ובהירה</li>
              <li>הטקסט צריך להיות ברור וקריא</li>
              <li>נסה לצלם ישר מעל המסמך</li>
              <li>התבנית המועדפת: ברקוד בשורה נפרדת ואחריו שם המוצר וכמות</li>
              <li>תבניות נתמכות: "שם מוצר כמות: X" או "שם | ברקוד | כמות"</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleOCR} disabled={!file || loading}>
              {loading ? "סורק..." : "סרוק מסמך"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OCRShippingDocumentDialog;
