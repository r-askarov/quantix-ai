
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
    
    console.log("=== SEARCHING BARCODE ===");
    console.log("Searching barcode:", barcode);
    console.log("Barcode type:", typeof barcode);
    console.log("Database keys count:", Object.keys(barcodeDatabase).length);
    console.log("First 5 database keys:", Object.keys(barcodeDatabase).slice(0, 5));
    
    // נסיון חיפוש ישיר
    let productInfo = barcodeDatabase[barcode];
    console.log("Direct search result:", productInfo);
    
    // אם לא נמצא, ננסה להמיר למחרוזת
    if (!productInfo) {
      const barcodeStr = String(barcode).trim();
      productInfo = barcodeDatabase[barcodeStr];
      console.log("String search result:", productInfo);
    }
    
    // אם עדיין לא נמצא, ננסה לחפש בכל המפתחות
    if (!productInfo) {
      console.log("Trying to find exact match in all keys...");
      const foundKey = Object.keys(barcodeDatabase).find(key => {
        const keyMatch = key === barcode || key === String(barcode).trim();
        if (keyMatch) {
          console.log(`Found exact match: "${key}" matches "${barcode}"`);
        }
        return keyMatch;
      });
      
      if (foundKey) {
        productInfo = barcodeDatabase[foundKey];
        console.log("Found via key search:", productInfo);
      }
    }
    
    if (productInfo) {
      console.log("=== PRODUCT FOUND ===");
      console.log("Product data:", productInfo);
      console.log("Product name:", productInfo.name);
      console.log("Product supplier:", productInfo.supplier);
      console.log("Product minStock:", productInfo.minStock);
      
      setFormData(prev => ({
        ...prev,
        name: productInfo.name || "",
        supplier: productInfo.supplier || "",
        minStock: productInfo.minStock || prev.minStock,
      }));
      
      toast({
        title: "מוצר זוהה במאגר!",
        description: `נמצא מוצר: ${productInfo.name}`,
      });
    } else {
      console.log("=== PRODUCT NOT FOUND ===");
      console.log("No product found for barcode:", barcode);
      
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
    console.log("Barcode detected from scanner:", detectedBarcode);
    
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
