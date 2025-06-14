
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScanText, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";
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
    
    // נחפש דפוסים של פריטים עם כמויות
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
            // נבדוק אם זה לא מספר או תאריך
            if (!/^\d+$/.test(name) && !/\d{2}\/\d{2}\/\d{4}/.test(name)) {
              items.push({
                name: name,
                quantity: quantity,
                status: 'match' // נקבע בהמשך בהשוואה
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
      const inventoryItem = inventory.find(inv => 
        inv.name.toLowerCase().includes(item.name.toLowerCase()) ||
        item.name.toLowerCase().includes(inv.name.toLowerCase())
      );

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
          description: "לא הצלחנו לזהות פריטים בתעודת המשלוח. נסה תמונה בהירה יותר.",
          variant: "destructive",
        });
        return;
      }

      const comparedItems = compareWithInventory(parsedItems);
      onOCRResult(comparedItems);

      toast({
        title: "הסריקה הושלמה בהצלחה!",
        description: `זוהו ${parsedItems.length} פריטים בתעודת המשלוח`,
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
            <p>טיפים לסריקה טובה יותר:</p>
            <ul className="list-disc pr-5 mt-1">
              <li>ודא שהתמונה חדה ובהירה</li>
              <li>הטקסט צריך להיות ברור וקריא</li>
              <li>נסה לצלם ישר מעל המסמך</li>
              <li>הימנע מצללים או בהירות יתר</li>
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
