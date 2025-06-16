
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import BarcodeScannerDialog from "./BarcodeScannerDialog";
import { BarcodeCache } from "@/utils/barcodeCache";
import { ScanBarcode } from "lucide-react";

interface AddProductDialogProps {
  onAdd: (product: Product) => void;
}

export interface Product {
  barcode: string;
  name: string;
  quantity: number;
  supplier: string;
  minStock: number;
  price: number;
}

const AddProductDialog: React.FC<AddProductDialogProps> = ({ onAdd }) => {
  const [open, setOpen] = React.useState(false);
  const [scannerOpen, setScannerOpen] = React.useState(false);
  const [product, setProduct] = React.useState<Omit<Product, "quantity"> & { quantity: string }>({
    barcode: "",
    name: "",
    supplier: "",
    minStock: 1,
    quantity: "",
    price: 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProduct(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleBarcodeScan = (code: string) => {
    console.log("Barcode scanned:", code);
    
    // First, check local cache
    const cachedProduct = BarcodeCache.getProduct(code);
    
    if (cachedProduct) {
      console.log("Found product in cache:", cachedProduct);
      setProduct(prev => ({
        ...prev,
        barcode: code,
        name: cachedProduct.name,
        supplier: cachedProduct.supplier || "",
        price: cachedProduct.price || 0,
      }));
      toast({ 
        title: "ברקוד זוהה מהמאגר המקומי!", 
        description: `נמצא: ${cachedProduct.name}` 
      });
      return;
    }
    
    // If not in cache, try fuzzy search
    const fuzzyMatches = BarcodeCache.fuzzySearch(code);
    
    if (fuzzyMatches.length > 0) {
      const bestMatch = fuzzyMatches[0];
      console.log("Found fuzzy match:", bestMatch);
      
      setProduct(prev => ({
        ...prev,
        barcode: code,
        name: bestMatch.name,
        supplier: bestMatch.supplier || "",
        price: bestMatch.price || 0,
      }));
      
      toast({ 
        title: "נמצאה התאמה דומה!", 
        description: `האם התכוונת ל: ${bestMatch.name}?`,
        variant: "default"
      });
      return;
    }
    
    // If no match found, just set the barcode
    setProduct(prev => ({
      ...prev,
      barcode: code,
    }));
    
    toast({ 
      title: "ברקוד נסרק בהצלחה!", 
      description: "נא למלא את פרטי המוצר" 
    });
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
      price: Number(product.price),
    };
    
    // Add to cache for future use
    BarcodeCache.setProduct({
      barcode: toAdd.barcode,
      name: toAdd.name,
      supplier: toAdd.supplier,
      price: toAdd.price,
      lastUsed: Date.now()
    });
    
    onAdd(toAdd);
    setOpen(false);
    setProduct({ barcode: "", name: "", supplier: "", minStock: 1, quantity: "", price: 0 });
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
          <div className="flex gap-2">
            <Input
              placeholder="ברקוד"
              name="barcode"
              value={product.barcode}
              onChange={handleChange}
            />
            <Button
              variant="outline"
              type="button"
              className="whitespace-nowrap flex gap-1 items-center"
              onClick={() => setScannerOpen(true)}
            >
              <ScanBarcode className="w-5 h-5" />
              סרוק ברקוד
            </Button>
          </div>
          <Input placeholder="שם מוצר" name="name" value={product.name} onChange={handleChange} />
          <Input placeholder="ספק" name="supplier" value={product.supplier} onChange={handleChange} />
          <Input type="number" min={0} placeholder="כמות התחלתית" name="quantity" value={product.quantity} onChange={handleChange} />
          <Input type="number" min={0} step="0.01" placeholder="מחיר ליחידה" name="price" value={product.price} onChange={handleChange} />
          <Input type="number" min={1} placeholder="מלאי מינימום (התראה)" name="minStock" value={product.minStock} onChange={handleChange} />
        </div>
        <DialogFooter>
          <Button onClick={handleAdd}>הוסף</Button>
        </DialogFooter>
        
        <BarcodeScannerDialog
          open={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onDetected={handleBarcodeScan}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddProductDialog;
