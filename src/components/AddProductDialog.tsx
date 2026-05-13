
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import BarcodeScannerDialog from "./BarcodeScannerDialog";
import ExpiryDatePicker from "./ExpiryDatePicker";
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
  expiryDate?: string | null;
}

const AddProductDialog: React.FC<AddProductDialogProps> = ({ onAdd }) => {
  const [open, setOpen] = React.useState(false);
  const [scannerOpen, setScannerOpen] = React.useState(false);

  const initialProduct: Omit<Product, "quantity"> & { quantity: string } = {
    barcode: "",
    name: "",
    supplier: "",
    minStock: 1,
    quantity: "",
    price: 0,
    expiryDate: "",
  };

  const [product, setProduct] = React.useState(initialProduct);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProduct(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const lookupInProgressRef = React.useRef(false);
  const lookupTimeoutRef = React.useRef<number | null>(null);

  const fetchAndFill = async (code: string) => {
    if (!code) return;
    if (lookupInProgressRef.current) return;
    lookupInProgressRef.current = true;

    try {
      // 1) Local cache
      const cached = BarcodeCache.getProduct(code);
      if (cached) {
        setProduct(prev => ({
          ...prev,
          barcode: code,
          name: cached.name || prev.name,
          supplier: cached.supplier || prev.supplier,
          price: cached.price ?? prev.price,
        }));
        toast({ title: "ברקוד זוהה מהמאגר המקומי!", description: `נמצא: ${cached.name}` });
        return;
      }

      // 2) Revalto API
      try {
        const url = `https://revalto-api-u90k.onrender.com/product/${encodeURIComponent(code)}`;
        console.log("Looking up Revalto with URL:", url);
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json && (json.name || json.product)) {
            const name = json.name || json.product?.name || json.product?.product_name;
            const supplier = json.supplier || json.manufacturer || "";
            const price = json.price ?? 0;
            setProduct(prev => ({ ...prev, barcode: code, name: name || prev.name, supplier: supplier || prev.supplier, price: price || prev.price }));
            toast({ title: "נמצא מוצר ב-Revalto", description: name });
            return;
          }
        }
      } catch (err) {
        console.warn("Revalto lookup failed", err);
      }

      // 3) OpenFoodFacts
      try {
        const offUrl = `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(code)}.json`;
        const offRes = await fetch(offUrl);
        if (offRes.ok) {
          const offJson = await offRes.json();
          if (offJson && offJson.status === 1 && offJson.product) {
            const p = offJson.product;
            const name = p.product_name || p.generic_name || "";
            const supplier = p.brands || p.manufacturing_places || "";
            setProduct(prev => ({ ...prev, barcode: code, name: name || prev.name, supplier: supplier || prev.supplier }));
            toast({ title: "נמצא מוצר ב-OpenFoodFacts", description: name });
            return;
          }
        }
      } catch (err) {
        console.warn("OpenFoodFacts lookup failed", err);
      }

      // If nothing found, just keep barcode
      setProduct(prev => ({ ...prev, barcode: code }));
    } finally {
      lookupInProgressRef.current = false;
    }
  };

  React.useEffect(() => {
    const code = product.barcode?.toString().trim();
    if (!code) return;

    // Debounce lookup to avoid firing on every keystroke
    if (lookupTimeoutRef.current) {
      window.clearTimeout(lookupTimeoutRef.current as unknown as number);
    }
    lookupTimeoutRef.current = window.setTimeout(() => {
      fetchAndFill(code);
    }, 600);

    return () => {
      if (lookupTimeoutRef.current) {
        window.clearTimeout(lookupTimeoutRef.current as unknown as number);
      }
    };
  }, [product.barcode]);

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
      expiryDate: product.expiryDate || null,
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
    setProduct({ barcode: "", name: "", supplier: "", minStock: 1, quantity: "", price: 0, expiryDate: "" });
    toast({ title: "המוצר נוסף בהצלחה!" });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) {
          setProduct(initialProduct);
          setScannerOpen(false);
        }
      }}
    >
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
          <Input type="number" min={0} placeholder="כמות" name="quantity" value={product.quantity} onChange={handleChange} />
          <Input type="number" min={0} step="0.01" placeholder="מחיר ליחידה" name="price" value={product.price} onChange={handleChange} />
          <Input type="number" min={1} placeholder="מלאי מינימום (התראה)" name="minStock" value={product.minStock} onChange={handleChange} />
          
          <ExpiryDatePicker
            value={product.expiryDate || ""}
            onChange={(value) => setProduct(prev => ({ ...prev, expiryDate: value }))}
            label="תאריך תפוגה"
            required={false}
          />
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
