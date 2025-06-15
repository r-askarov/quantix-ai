
import * as React from "react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CalendarIcon, Barcode as BarcodeIcon } from "lucide-react";
import { format } from "date-fns";
import BarcodeScannerDialog from "./BarcodeScannerDialog";

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

// props: תומך ב-onAdd (עם expiryDate) ו-barcodeDatabase
const EnhancedAddProductDialog = ({ onAdd, barcodeDatabase }: { onAdd: (product: Product) => void, barcodeDatabase: any }) => {
  const [open, setOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [product, setProduct] = useState<Partial<Product>>({
    barcode: "",
    name: "",
    supplier: "",
    minStock: 1,
    price: 0,
    quantity: 0,
    expiryDate: null,
  });

  // עבור קלט expiryDate
  const handleExpiryDateChange = (val: string | null) => {
    setProduct(prev => ({
      ...prev,
      expiryDate: val,
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProduct(prev => ({
      ...prev,
      [e.target.name]:
        e.target.type === "number" ? Number(e.target.value) : e.target.value,
    }));
  };

  const handleBarcodeScan = (code: string) => {
    setProduct(prev => ({
      ...prev,
      barcode: code,
    }));
    toast({ title: "ברקוד נסרק בהצלחה!" });
    setScannerOpen(false);
  };

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
    setOpen(false);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">הוסף מוצר חדש</Button>
      </DialogTrigger>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>הוספת מוצר חדש</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Input
              placeholder="ברקוד"
              name="barcode"
              value={product.barcode || ""}
              onChange={handleChange}
            />
            <Button
              variant="outline"
              type="button"
              className="whitespace-nowrap flex gap-1 items-center"
              onClick={() => setScannerOpen(true)}
            >
              <BarcodeIcon className="w-5 h-5" />
              סרוק ברקוד
            </Button>
            <BarcodeScannerDialog
              open={scannerOpen}
              onClose={() => setScannerOpen(false)}
              onDetected={handleBarcodeScan}
            />
          </div>
          <Input placeholder="שם מוצר" name="name" value={product.name || ""} onChange={handleChange} />
          <Input placeholder="ספק" name="supplier" value={product.supplier || ""} onChange={handleChange} />
          <Input type="number" min={0} placeholder="כמות התחלתית" name="quantity" value={product.quantity || ""} onChange={handleChange} />
          <Input type="number" min={1} placeholder="מלאי מינימום (התראה)" name="minStock" value={product.minStock || ""} onChange={handleChange} />
          <Input type="number" min={0} placeholder="מחיר ליחידה" name="price" value={product.price || ""} onChange={handleChange} />
          {/* שדה תאריך תפוגה אופציונלי */}
          <div>
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

