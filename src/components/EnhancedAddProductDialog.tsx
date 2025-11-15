import * as React from "react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CalendarIcon } from "lucide-react";
import { Product } from "@/pages/Products";

// טעינה של DatePicker עדין - ניתן לעטוף ב-Input במידת הצורך
function DateInput({ value, onChange }: { value: string | null; onChange: (val: string | null) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        className="border rounded px-2 py-1"
        value={value ? value.slice(0, 10) : ""}
        onChange={e => onChange(e.target.value ? e.target.value : null)}
        min={new Date().toISOString().slice(0, 10)}
      />
      <CalendarIcon className="w-4 h-4 text-gray-500" />
    </div>
  );
}

const EnhancedAddProductDialog = ({
  onAdd,
  barcodeDatabase,
  open = false,
  onOpenChange,
  initialBarcode = ""
}: {
  onAdd: (product: Product) => void;
  barcodeDatabase: any;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialBarcode?: string;
}) => {
  const [product, setProduct] = useState<Partial<Product>>({
    barcode: initialBarcode,
    name: "",
    supplier: "",
    minStock: 1,
    price: 0,
    quantity: 0,
    expiryDate: null,
  });
  const [dialogOpen, setDialogOpen] = useState(open);

  React.useEffect(() => {
    setDialogOpen(open);
    if (initialBarcode) {
      setProduct((prev) => ({ ...prev, barcode: initialBarcode }));
    }
  }, [open, initialBarcode]);

  // השלמה אוטומטית ממאגר הברקודים
  const handleBarcodeChangeAndAutoFill = (barcodeValue: string) => {
    let autoFields = {};
    if (barcodeDatabase && barcodeDatabase[barcodeValue]) {
      const dbProd = barcodeDatabase[barcodeValue];
      autoFields = {
        name: dbProd.name ?? "",
        supplier: dbProd.supplier ?? "",
        minStock: dbProd.minStock ?? 1,
      };
      if (dbProd.name) {
        toast({ title: "נמצא במאגר: " + dbProd.name });
      }
    }
    setProduct((prev) => ({
      ...prev,
      barcode: barcodeValue,
      ...autoFields,
    }));
  };

  // שינוי שדה קלט רגיל
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (name === "barcode") {
      handleBarcodeChangeAndAutoFill(value);
    } else {
      setProduct((prev) => ({
        ...prev,
        [name]: type === "number" ? Number(value) : value,
      }));
    }
  };

  // ביצוע שליחה
  const handleSubmit = () => {
    if (!product.barcode || !product.name || !product.supplier || !product.quantity || !product.price) {
      toast({ title: "נא למלא את כל השדות החובה!", variant: "destructive" });
      return;
    }
    const toAdd: Product = {
      barcode: product.barcode!,
      name: product.name!,
      supplier: product.supplier!,
      minStock: Number(product.minStock) || 1,
      price: Number(product.price) || 0,
      quantity: Number(product.quantity) || 0,
      expiryDate: product.expiryDate ?? null,
    };
    onAdd(toAdd);
    setDialogOpen(false);
    if (onOpenChange) onOpenChange(false);
    setProduct({
      barcode: "",
      name: "",
      supplier: "",
      minStock: 1,
      price: 0,
      quantity: 0,
      expiryDate: null,
    });
  };

  const handleExpiryDateChange = (val: string | null) => {
    setProduct(prev => ({
      ...prev,
      expiryDate: val,
    }));
  };

  // Add effect to load temp product data
  React.useEffect(() => {
    if (dialogOpen) {
      const tempData = localStorage.getItem('tempProductData');
      if (tempData) {
        const parsedData = JSON.parse(tempData);
        setProduct(prev => ({
          ...prev,
          ...parsedData,
          minStock: parsedData.minStock || 1,
          price: parsedData.price || 0,
          quantity: parsedData.quantity || 0,
        }));
      }
    } else {
      // Clean up temp data when dialog closes
      localStorage.removeItem('tempProductData');
    }
  }, [dialogOpen]);

  return (
    <Dialog open={dialogOpen} onOpenChange={val => {
      setDialogOpen(val);
      if (onOpenChange) onOpenChange(val);
    }}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>הוספת מוצר חדש</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="block text-right text-xs mb-1">ברקוד</label>
            <Input
              name="barcode"
              value={product.barcode || ""}
              onChange={handleChange}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="block text-right text-xs mb-1">שם מוצר</label>
            <Input name="name" value={product.name || ""} onChange={handleChange} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="block text-right text-xs mb-1">ספק</label>
            <Input name="supplier" value={product.supplier || ""} onChange={handleChange} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="block text-right text-xs mb-1">כמות התחלתית</label>
            <Input type="number" min={0} name="quantity" value={product.quantity || ""} onChange={handleChange} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="block text-right text-xs mb-1">מלאי מינימום (התראה)</label>
            <Input type="number" min={1} name="minStock" value={product.minStock || ""} onChange={handleChange} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="block text-right text-xs mb-1">מחיר ליחידה</label>
            <Input type="number" min={0} name="price" value={product.price || ""} onChange={handleChange} />
          </div>
          {/* שדה תאריך תפוגה אופציונלי */}
          <div className="flex flex-col gap-1">
            <label className="block text-right text-xs mb-1">תאריך תפוגה (רשות)</label>
            <DateInput value={product.expiryDate || null} onChange={handleExpiryDateChange} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>הוסף</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedAddProductDialog;
