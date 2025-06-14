
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface AddProductDialogProps {
  onAdd: (product: Product) => void;
}

export interface Product {
  barcode: string;
  name: string;
  quantity: number;
  supplier: string;
  minStock: number;
}

const AddProductDialog: React.FC<AddProductDialogProps> = ({ onAdd }) => {
  const [open, setOpen] = React.useState(false);
  const [product, setProduct] = React.useState<Omit<Product, "quantity"> & { quantity: string }>({
    barcode: "",
    name: "",
    supplier: "",
    minStock: 1,
    quantity: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProduct(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAdd = () => {
    if (!product.barcode || !product.name || !product.supplier || !product.quantity) {
      toast({ title: "נא למלא את כל השדות!", variant: "destructive" });
      return;
    }
    const toAdd = {
      ...product,
      quantity: Number(product.quantity),
      minStock: Number(product.minStock),
    };
    onAdd(toAdd);
    setOpen(false);
    setProduct({ barcode: "", name: "", supplier: "", minStock: 1, quantity: "" });
    toast({ title: "המוצר נוסף בהצלחה!" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="w-full md:w-auto flex gap-2 items-center">
          הוסף מוצר חדש
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>הוספת מוצר חדש</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input placeholder="ברקוד" name="barcode" value={product.barcode} onChange={handleChange} />
          <Input placeholder="שם מוצר" name="name" value={product.name} onChange={handleChange} />
          <Input placeholder="ספק" name="supplier" value={product.supplier} onChange={handleChange} />
          <Input type="number" min={0} placeholder="כמות התחלתית" name="quantity" value={product.quantity} onChange={handleChange} />
          <Input type="number" min={1} placeholder="מלאי מינימום (התראה)" name="minStock" value={product.minStock} onChange={handleChange} />
        </div>
        <DialogFooter>
          <Button onClick={handleAdd}>הוסף</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductDialog;
