
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

  const handleBarcodeDetected = (detectedBarcode: string) => {
    console.log("Barcode detected:", detectedBarcode);
    
    // חיפוש במאגר הברקודים
    const productInfo = barcodeDatabase[detectedBarcode];
    
    if (productInfo) {
      setFormData(prev => ({
        ...prev,
        barcode: detectedBarcode,
        name: productInfo.name,
        supplier: productInfo.supplier || prev.supplier,
        minStock: productInfo.minStock || prev.minStock,
      }));
      
      toast({
        title: "מוצר זוהה במאגר!",
        description: `נמצא מוצר: ${productInfo.name}`,
      });
    } else {
      setFormData(prev => ({
        ...prev,
        barcode: detectedBarcode,
      }));
      
      toast({
        title: "ברקוד נסרק",
        description: "לא נמצא מוצר במאגר. אנא השלם את הפרטים ידנית.",
        variant: "destructive",
      });
    }
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
