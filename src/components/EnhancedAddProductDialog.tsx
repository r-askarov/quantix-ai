import * as React from "react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarIcon, X } from "lucide-react";
import { Product } from "@/pages/Products";
import { BarcodeCache } from "@/utils/barcodeCache";
import { supabase } from '../services/supabase'


// טעינה של DatePicker עדין - ניתן לעטוף ב-Input במידת הצורך
function DateInput({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (val: string | null) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        className="border rounded px-2 py-1"
        value={value ? value.slice(0, 10) : ""}
        onChange={(e) => onChange(e.target.value ? e.target.value : null)}
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
  initialBarcode = "",
}: {
  onAdd: (product: Product) => void;
  barcodeDatabase: any;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialBarcode?: string;
}) => {
  const initialProduct: Partial<Product> = {
    barcode: initialBarcode,
    name: "",
    supplier: "",
    minStock: 1,
    price: 0,
    quantity: 0,
    expiryDate: null,
  };

  const [product, setProduct] = useState<Partial<Product>>(initialProduct);
  const [dialogOpen, setDialogOpen] = useState(open);

  // Effect to handle initialBarcode and auto-fill when dialog opens
  React.useEffect(() => {
    setDialogOpen(open);
    if (open && initialBarcode) {
      console.log("Dialog opened with barcode:", initialBarcode);
      console.log("BarcodeDatabase:", barcodeDatabase);

      // First check tempProductData from localStorage (from Index.tsx)
      const tempData = localStorage.getItem("tempProductData");
      if (tempData) {
        try {
          const parsed = JSON.parse(tempData);
          console.log("Found tempProductData:", parsed);
          setProduct((prev) => ({
            ...prev,
            ...parsed,
          }));
          return;
        } catch (e) {
          console.error("Error parsing tempProductData:", e);
        }
      }

      // Otherwise try auto-filling from barcodeDatabase
      if (barcodeDatabase && barcodeDatabase[initialBarcode]) {
        const dbProd = barcodeDatabase[initialBarcode];
        console.log("Found in barcodeDatabase:", dbProd);
        setProduct((prev) => ({
          ...prev,
          barcode: initialBarcode,
          name: dbProd.name || "",
          supplier: dbProd.supplier || "",
          minStock: dbProd.minStock || 1,
          price: dbProd.unitPrice || dbProd.price || 0,
        }));
      } else {
        // Just set the barcode
        setProduct((prev) => ({ ...prev, barcode: initialBarcode }));
      }
    }
  }, [open, initialBarcode, barcodeDatabase]);

  // השלמה אוטומטית ממאגר הברקודים
  const handleBarcodeChangeAndAutoFill = (barcodeValue: string) => {
    console.log("Auto-filling for barcode:", barcodeValue);

    let autoFields: any = {};
    if (barcodeDatabase && barcodeDatabase[barcodeValue]) {
      const dbProd = barcodeDatabase[barcodeValue];
      console.log("Found product in database:", dbProd);

      autoFields = {
        name: dbProd.name || "",
        supplier: dbProd.supplier || "",
        minStock: dbProd.minStock || 1,
        price: dbProd.unitPrice || dbProd.price || 0,
      };
    }

    setProduct((prev) => ({
      ...prev,
      barcode: barcodeValue,
      ...autoFields,
    }));
    // Start async lookup (debounced) to enrich with external sources
    startLookupDebounced(barcodeValue);
  };

  const lookupInProgressRef = React.useRef(false);
  const lookupTimeoutRef = React.useRef<number | null>(null);

  const startLookupDebounced = (code: string) => {
    if (lookupTimeoutRef.current) {
      window.clearTimeout(lookupTimeoutRef.current as unknown as number);
    }
    lookupTimeoutRef.current = window.setTimeout(() => {
      fetchAndFill(code);
    }, 600);
  };

  const fetchAndFill = async (code: string) => {
    if (!code) return;
    if (lookupInProgressRef.current) return;
    lookupInProgressRef.current = true;
    try {
      // 1) Local cache
      const cached = BarcodeCache.getProduct(code);
      if (cached) {
        setProduct((prev) => ({
          ...prev,
          barcode: code,
          name: cached.name || prev.name,
          supplier: cached.supplier || prev.supplier,
          price: cached.price ?? prev.price,
        }));
        toast({
          title: "ברקוד זוהה מהמאגר המקומי!",
          description: `נמצא: ${cached.name}`,
        });
        return;
      }

      // 2) Revalto API
      try {
        const url = `https://revalto-api-u90k.onrender.com/product/${encodeURIComponent(code)}`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json && (json.name || json.product)) {
            const name =
              json.name || json.product?.name || json.product?.product_name;
            const supplier = json.supplier || json.manufacturer || "";
            const price = json.price ?? 0;
            setProduct((prev) => ({
              ...prev,
              barcode: code,
              name: name || prev.name,
              supplier: supplier || prev.supplier,
              price: price || prev.price,
            }));
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
            setProduct((prev) => ({
              ...prev,
              barcode: code,
              name: name || prev.name,
              supplier: supplier || prev.supplier,
            }));
            toast({ title: "נמצא מוצר ב-OpenFoodFacts", description: name });
            return;
          }
        }
      } catch (err) {
        console.warn("OpenFoodFacts lookup failed", err);
      }

      // If nothing found, just keep barcode
      setProduct((prev) => ({ ...prev, barcode: code }));
    } finally {
      lookupInProgressRef.current = false;
    }
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
  const handleSubmit = async () => {
    if (
      !product.barcode ||
      !product.name ||
      !product.supplier ||
      !product.quantity ||
      !product.price
    ) {
      toast({ title: "נא למלא את כל שדות החובה!", variant: "destructive" });
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

    const { error } = await supabase.from("products").insert([
      {
        barcode: product.barcode,
        name: product.name,
        supplier: product.supplier,
        quantity: product.quantity,
        minimum_quantity: product.minStock || 0,
        price: product.price,
        expiration_date: product.expiryDate || null,
      },
    ]);

    if (error) {
      console.error(error);
    } else {
      console.log("Product added to Supabase:", toAdd);
    }

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
    setProduct((prev) => ({
      ...prev,
      expiryDate: val,
    }));
  };

  // Cleanup effect - remove temp data when dialog closes
  React.useEffect(() => {
    if (!dialogOpen) {
      localStorage.removeItem("tempProductData");
      // Reset product fields when dialog closes
      setProduct({
        barcode: "",
        name: "",
        supplier: "",
        minStock: 1,
        price: 0,
        quantity: 0,
        expiryDate: null,
      });
      // clear any pending lookup
      if (lookupTimeoutRef.current) {
        window.clearTimeout(lookupTimeoutRef.current as unknown as number);
        lookupTimeoutRef.current = null;
      }
      lookupInProgressRef.current = false;
    }
  }, [dialogOpen]);

  // Lock body scroll when dialog is open
  React.useEffect(() => {
    if (dialogOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [dialogOpen]);

  // Portal modal
  const modal = dialogOpen
    ? createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 99999 }}
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setDialogOpen(false);
              if (onOpenChange) onOpenChange(false);
            }}
            aria-hidden
          />
          <div
            className="relative bg-white p-6 rounded shadow w-full max-w-md mx-4"
            dir="rtl"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">הוספת מוצר חדש</h2>
              <button
                onClick={() => {
                  setDialogOpen(false);
                  if (onOpenChange) onOpenChange(false);
                }}
                className="p-1 rounded hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

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
                <Input
                  name="name"
                  value={product.name || ""}
                  onChange={handleChange}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="block text-right text-xs mb-1">ספק</label>
                <Input
                  name="supplier"
                  value={product.supplier || ""}
                  onChange={handleChange}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="block text-right text-xs mb-1">כמות</label>
                <Input
                  type="number"
                  min={0}
                  name="quantity"
                  value={product.quantity || ""}
                  onChange={handleChange}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="block text-right text-xs mb-1">
                  מלאי מינימום (התראה)
                </label>
                <Input
                  type="number"
                  min={1}
                  name="minStock"
                  value={product.minStock || ""}
                  onChange={handleChange}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="block text-right text-xs mb-1">
                  מחיר ליחידה
                </label>
                <Input
                  type="number"
                  min={0}
                  name="price"
                  value={product.price || ""}
                  onChange={handleChange}
                />
              </div>
              {/* שדה תאריך תפוגה אופציונלי */}
              <div className="flex flex-col gap-1">
                <label className="block text-right text-xs mb-1">
                  תאריך תפוגה (רשות)
                </label>
                <DateInput
                  value={product.expiryDate || null}
                  onChange={handleExpiryDateChange}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  if (onOpenChange) onOpenChange(false);
                }}
              >
                ביטול
              </Button>
              <Button onClick={handleSubmit}>הוסף</Button>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  return modal;
};

export default EnhancedAddProductDialog;
