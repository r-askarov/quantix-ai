
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, ScanLine } from "lucide-react";
import BarcodeScannerDialog from "./BarcodeScannerDialog";
import { BarcodeDatabase } from "./ExcelImportDialog";
import { toast } from "@/hooks/use-toast";

export interface Product {
  barcode: string;
  name: string;
  quantity: number;
  supplier: string;
  minStock: number;
}

interface EnhancedAddProductDialogProps {
  onAdd: (product: Product) => void;
  barcodeDatabase: BarcodeDatabase;
}

const EnhancedAddProductDialog: React.FC<EnhancedAddProductDialogProps> = ({ onAdd, barcodeDatabase }) => {
  const [open, setOpen] = React.useState(false);
  const [scannerOpen, setScannerOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    barcode: "",
    name: "",
    quantity: 1,
    supplier: "",
    minStock: 5,
  });

  // חיפוש במאגר הברקודים
  const searchBarcode = (barcode: string) => {
    if (!barcode.trim()) return;
    
    console.log("Searching barcode:", barcode);
    console.log("Barcode database keys:", Object.keys(barcodeDatabase));
    console.log("Barcode database full:", barcodeDatabase);
    console.log("Looking for barcode:", barcode, "Type:", typeof barcode);
    
    // נסיון חיפוש עם הברקוד כמו שהוא
    let productInfo = barcodeDatabase[barcode];
    console.log("Direct search result:", productInfo);
    
    // אם לא נמצא, ננסה להמיר למחרוזת
    if (!productInfo) {
      const barcodeStr = String(barcode);
      productInfo = barcodeDatabase[barcodeStr];
      console.log("String search result:", productInfo);
    }
    
    // אם לא נמצא, ננסה לחפש בכל המפתחות
    if (!productInfo) {
      console.log("Trying to find barcode in all keys...");
      Object.keys(barcodeDatabase).forEach(key => {
        console.log(`Key: "${key}" (type: ${typeof key}), equals barcode: ${key === barcode}, equals string: ${key === String(barcode)}`);
        if (key === barcode || key === String(barcode)) {
          productInfo = barcodeDatabase[key];
          console.log("Found match with key:", key);
        }
      });
    }
    
    if (productInfo) {
      console.log("Product found:", productInfo);
      setFormData(prev => ({
        ...prev,
        name: productInfo.name,
        supplier: productInfo.supplier || prev.supplier,
        minStock: productInfo.minStock || prev.minStock,
      }));
      
      toast({
        title: "מוצר זוהה במאגר!",
        description: `נמצא מוצר: ${productInfo.name}`,
      });
    } else {
      console.log("Product not found for barcode:", barcode);
      // איפוס שדות אם לא נמצא מוצר
      setFormData(prev => ({
        ...prev,
        name: "",
        supplier: "",
        minStock: 5,
      }));
    }
  };

  const handleBarcodeDetected = (detectedBarcode: string) => {
    console.log("Barcode detected:", detectedBarcode);
    
    setFormData(prev => ({
      ...prev,
      barcode: detectedBarcode,
    }));
    
    searchBarcode(detectedBarcode);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.barcode || !formData.name) {
      toast({
        title: "שגיאה",
        description: "אנא מלא את כל השדות הנדרשים",
        variant: "destructive",
      });
      return;
    }

    const product: Product = {
      barcode: formData.barcode,
      name: formData.name,
      quantity: formData.quantity,
      supplier: formData.supplier,
      minStock: formData.minStock,
    };

    onAdd(product);
    setFormData({
      barcode: "",
      name: "",
      quantity: 1,
      supplier: "",
      minStock: 5,
    });
    setOpen(false);
  };

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // אם השדה הוא ברקוד, חפש במאגר
    if (field === "barcode" && typeof value === "string") {
      console.log("Input change triggered search for:", value);
      searchBarcode(value);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            הוסף מוצר
          </Button>
        </DialogTrigger>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>הוספת מוצר חדש</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="barcode">ברקוד *</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => handleInputChange("barcode", e.target.value)}
                  placeholder="הכנס ברקוד או סרוק"
                  required
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setScannerOpen(true)}
                  className="h-10"
                >
                  <ScanLine className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="name">שם המוצר *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="הכנס שם מוצר"
                required
              />
            </div>

            <div>
              <Label htmlFor="quantity">כמות</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleInputChange("quantity", parseInt(e.target.value) || 1)}
                required
              />
            </div>

            <div>
              <Label htmlFor="supplier">ספק</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => handleInputChange("supplier", e.target.value)}
                placeholder="הכנס שם ספק"
              />
            </div>

            <div>
              <Label htmlFor="minStock">מלאי מינימום</Label>
              <Input
                id="minStock"
                type="number"
                min="0"
                value={formData.minStock}
                onChange={(e) => handleInputChange("minStock", parseInt(e.target.value) || 0)}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                ביטול
              </Button>
              <Button type="submit">
                הוסף מוצר
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <BarcodeScannerDialog
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={handleBarcodeDetected}
      />
    </>
  );
};

export default EnhancedAddProductDialog;
