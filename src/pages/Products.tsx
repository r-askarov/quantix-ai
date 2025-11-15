import * as React from "react";
import { Link } from "react-router-dom";
import ProductsTable from "@/components/ProductsTable";
import EnhancedAddProductDialog from "@/components/EnhancedAddProductDialog";
import ExcelImportDialog, { BarcodeDatabase } from "@/components/ExcelImportDialog";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { ChevronDown, RotateCcw, ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import InventoryTable from "@/components/InventoryTable";

const RTL_LANGS = ["he", "ar", "fa", "ur"];

// ---- Product type definition updated here ----
export interface Product {
  barcode: string;
  name: string;
  quantity: number;
  supplier: string;
  minStock: number;
  price: number;
  expiryDate?: string | null;
}

type SortOrder = "asc" | "desc";

import { useInventoryBatches } from "@/hooks/useInventoryBatches";
import AddInventoryBatchDialog from "@/components/AddInventoryBatchDialog";
import { InventoryBatch } from "@/types/inventory";

const Products = () => {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [barcodeDatabase, setBarcodeDatabase] = React.useState<BarcodeDatabase>({});

  // Load products from localStorage on initial render
  React.useEffect(() => {
    const storedProducts = JSON.parse(localStorage.getItem("products") || "[]");
    setProducts(storedProducts);
  }, []);

  // Listen for changes to localStorage and update products dynamically
  React.useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "products") {
        const updatedProducts = JSON.parse(event.newValue || "[]");
        setProducts(updatedProducts);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // פילטרים
  const [supplierFilter, setSupplierFilter] = React.useState<string | null>(null);
  const [lowStockOnly, setLowStockOnly] = React.useState(false);
  const [quantitySort, setQuantitySort] = React.useState<SortOrder | null>(null);

  // ספקים ייחודיים
  const uniqueSuppliers = React.useMemo(() => {
    return Array.from(new Set(products.map((p) => p.supplier).filter(Boolean)));
  }, [products]);

  // נטען מה-hook
  const { batches, loading, reload } = useInventoryBatches();

  /**
   * מוצרים מאוחדים - כעת נשמור על המוצרים הקיימים ונוסיף מידע מהאצוות בלבד
   */
  const mergedProducts = React.useMemo(() => {
    // מיפוי אצוות לפי ברקוד
    const batchesByBarcode = batches.reduce<Record<string, InventoryBatch[]>>((acc, batch) => {
      if (!acc[batch.barcode]) acc[batch.barcode] = [];
      acc[batch.barcode].push(batch);
      return acc;
    }, {});

    // מתחילים עם כל המוצרים הקיימים (manual + initial)
    const allProducts = [...products];

    // עוברים על כל מוצר ומעדכנים אותו עם מידע מהאצוות אם קיים
    const updatedProducts = allProducts.map(product => {
      const productBatches = batchesByBarcode[product.barcode];
      
      if (productBatches && productBatches.length > 0) {
        // אם יש אצוות למוצר הזה, נחשב את הכמות הכוללת
        const totalBatchQuantity = productBatches.reduce((sum, b) => sum + b.quantity, 0);
        
        // נבנה מידע על תפוגות
        const expiryCount: Record<string, number> = {};
        productBatches.forEach(b => {
          const key = b.expiry_date ? b.expiry_date.slice(0, 10) : "ללא תפוגה";
          expiryCount[key] = (expiryCount[key] || 0) + b.quantity;
        });
        
        const remarks = Object.entries(expiryCount)
          .map(([dt, qty]) =>
            dt === "ללא תפוגה"
              ? `${qty} מוצרים ללא תפוגה`
              : `${qty} מוצרים עם תפוגה ${new Date(dt).toLocaleDateString('he-IL')}`
          )
          .join(' | ');

        // נחזיר את המוצר עם כמות מעודכנת ומידע על תפוגות
        return {
          ...product,
          quantity: product.quantity + totalBatchQuantity, // נוסיף את כמות האצוות לכמות הקיימת
          remarks
        };
      }
      
      // אם אין אצוות, נחזיר את המוצר כמו שהוא
      return {
        ...product,
        remarks: undefined
      };
    });

    // נוסיף מוצרים חדשים מהאצוות שאין להם מוצר קיים
    const existingBarcodes = new Set(allProducts.map(p => p.barcode));
    const newProductsFromBatches = Object.entries(batchesByBarcode)
      .filter(([barcode]) => !existingBarcodes.has(barcode))
      .map(([barcode, batchArr]) => {
        const totalQty = batchArr.reduce((sum, b) => sum + b.quantity, 0);
        
        const expiryCount: Record<string, number> = {};
        batchArr.forEach(b => {
          const key = b.expiry_date ? b.expiry_date.slice(0, 10) : "ללא תפוגה";
          expiryCount[key] = (expiryCount[key] || 0) + b.quantity;
        });
        
        const remarks = Object.entries(expiryCount)
          .map(([dt, qty]) =>
            dt === "ללא תפוגה"
              ? `${qty} מוצרים ללא תפוגה`
              : `${qty} מוצרים עם תפוגה ${new Date(dt).toLocaleDateString('he-IL')}`
          )
          .join(' | ');

        const b = batchArr[0];
        return {
          barcode,
          name: b.product_name,
          quantity: totalQty,
          supplier: b.supplier ?? "",
          minStock: 0,
          price: Number(b.unit_price) || 0,
          expiryDate: null,
          remarks,
        };
      });

    const merged = [...updatedProducts, ...newProductsFromBatches];
    
    // מיון לפי שם
    merged.sort((a, b) => a.name.localeCompare(b.name, "he"));
    return merged;
  }, [batches, products]);

  // חלת סינונים ומיון
  const filteredProducts = React.useMemo(() => {
    let filtered = [...mergedProducts];
    if (supplierFilter) filtered = filtered.filter(p => p.supplier === supplierFilter);
    if (lowStockOnly) filtered = filtered.filter(p => p.quantity <= p.minStock);
    if (quantitySort) {
      filtered.sort((a, b) =>
        quantitySort === "asc"
          ? a.quantity - b.quantity
          : b.quantity - a.quantity
      );
    }
    return filtered;
  }, [mergedProducts, supplierFilter, lowStockOnly, quantitySort]);

  React.useEffect(() => {
    const savedDatabase = localStorage.getItem('barcodeDatabase');
    if (savedDatabase) {
      try {
        const parsedDatabase = JSON.parse(savedDatabase);
        setBarcodeDatabase(parsedDatabase);
        console.log("Loaded barcode database from localStorage:", parsedDatabase);
      } catch (error) {
        console.error('Error loading barcode database from localStorage:', error);
      }
    }
  }, []);

  React.useEffect(() => {
    const lowStockProducts = products.filter((p) => p.quantity <= p.minStock);
    if (lowStockProducts.length > 0) {
      toast({
        title: "התראת מלאי נמוך",
        description: (
          <ul className="list-disc pr-5">
            {lowStockProducts.map((p) => (
              <li key={p.barcode} className="mt-1">
                {p.name} (כמות: <span className="font-bold">{p.quantity}</span>)
              </li>
            ))}
          </ul>
        ),
        variant: "destructive",
      });
    }
  }, [products]);

  // פונקציה להוספת מוצר (לא משתנה)
  const handleAddProduct = (product: Product) => {
    setProducts((prev) => {
      const existingProductIndex = prev.findIndex((p) => p.name === product.name);
      if (existingProductIndex !== -1) {
        const updatedProducts = [...prev];
        updatedProducts[existingProductIndex] = {
          ...updatedProducts[existingProductIndex],
          quantity: updatedProducts[existingProductIndex].quantity + product.quantity,
          price: product.price,
        };
        toast({
          title: "המוצר עודכן בהצלחה!",
          description: `הכמות של "${product.name}" עודכנה ל-${updatedProducts[existingProductIndex].quantity}`,
        });
        return updatedProducts;
      } else {
        toast({ title: "המוצר נוסף בהצלחה!" });
        return [...prev, product];
      }
    });
  };

  // Remove the clearing effect
  /*
  React.useEffect(() => {
    localStorage.removeItem("products");
    localStorage.removeItem("barcodeDatabase");
    setProducts([]);
    setBarcodeDatabase({});
  }, []);
  */

  const handleBarcodeImport = (database: BarcodeDatabase) => {
    setBarcodeDatabase(prevDatabase => {
      // Merge new database with existing one
      const mergedDatabase = { ...prevDatabase, ...database };
      localStorage.setItem('barcodeDatabase', JSON.stringify(mergedDatabase));
      
      // Dispatch storage event for other components
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'barcodeDatabase',
        newValue: JSON.stringify(mergedDatabase)
      }));

      toast({
        title: "מאגר ברקודים יובא בהצלחה!",
        description: `יובאו ${Object.keys(database).length} מוצרים. סה"כ: ${Object.keys(mergedDatabase).length} מוצרים במאגר`,
      });

      return mergedDatabase;
    });
  };

  const handleResetFilters = () => {
    setSupplierFilter(null);
    setLowStockOnly(false);
    setQuantitySort(null);
  };

  // שינוי סדר
  const toggleQuantitySort = () => {
    setQuantitySort(order =>
      order === "desc" ? "asc" : order === "asc" ? null : "desc"
    );
  };

  // מחשבים סכום כולל
  const totalStockValue = React.useMemo(() => {
    return filteredProducts.reduce((sum, p) => sum + (typeof p.price === "number" ? p.price * p.quantity : 0), 0);
  }, [filteredProducts]);

  // מחשבים סכום כולל לכל האצוות
  const totalStockValue2 = React.useMemo(() =>
    batches.reduce((sum, b) =>
      sum + (typeof b.unit_price === "number" ? b.unit_price * b.quantity : 0)
    , 0), [batches]);

  const { i18n } = useTranslation();
  const dir = RTL_LANGS.includes(i18n.language) ? "rtl" : "ltr";

  React.useEffect(() => {
    const stored = localStorage.getItem('products');
    if (stored) {
      setProducts(JSON.parse(stored));
    }
  }, []);

  const downloadCSV = () => {
    const headers = ["ברקוד", "שם", "כמות", "ספק", "מלאי מינימלי", "מחיר", "תאריך תפוגה"];
    const rows = filteredProducts.map((product) => [
      product.barcode,
      product.name,
      product.quantity,
      product.supplier,
      product.minStock,
      product.price,
      product.expiryDate || "ללא",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "products.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearAllProducts = () => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את כל המוצרים?')) {
      localStorage.removeItem('products');
      setProducts([]);
      toast({
        title: "המוצרים נמחקו",
        description: "רשימת המוצרים רוקנה בהצלחה",
      });
    }
  };

  return (
    <main className="min-h-screen bg-background px-8 py-8" dir={dir}>
      {/* טולבר וסינונים */}
      <div className="sticky top-0 z-20 bg-background pb-4 mb-6 flex flex-col-reverse items-stretch gap-2 sm:gap-0 sm:flex-row sm:items-end sm:justify-between border-b">
        <div className="flex flex-wrap gap-2 items-center">

          {/* פילטר לפי ספק */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="min-w-[120px] flex items-center gap-1">
                ספק: {supplierFilter ? <span>{supplierFilter}</span> : <span className="text-muted-foreground">הכל</span>}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>בחר ספק</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => setSupplierFilter(null)}
                disabled={supplierFilter === null}
              >
                <span className="text-muted-foreground">הצג הכל</span>
              </DropdownMenuItem>
              {uniqueSuppliers.map(sup => (
                <DropdownMenuItem
                  key={sup}
                  onClick={() => setSupplierFilter(sup)}
                  disabled={supplierFilter === sup}
                >
                  {sup}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* פילטר מלאי נמוך */}
          <Toggle
            pressed={lowStockOnly}
            size="sm"
            aria-label="הצג רק מלאי נמוך"
            onPressedChange={setLowStockOnly}
            className="min-w-[90px]"
          >
            מלאי נמוך
          </Toggle>

          {/* מיון לפי כמות */}
          <Button
            onClick={toggleQuantitySort}
            variant={quantitySort ? "outline" : "ghost"}
            size="sm"
            className="min-w-[110px] flex items-center gap-1"
            title="מיון לפי כמות"
          >
            כמות
            {quantitySort === "desc" && <ArrowDown className="w-4 h-4" />}
            {quantitySort === "asc" && <ArrowUp className="w-4 h-4" />}
            {!quantitySort && (
              <span className="text-muted-foreground">(ללא)</span>
            )}
          </Button>

          {/* איפוס סינון */}
          <Button
            onClick={handleResetFilters}
            variant="ghost"
            size="sm"
            className="text-xs"
            title="איפוס סינון"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            איפוס סינון
          </Button>
        </div>
        <div className="flex gap-2 justify-end mb-2 sm:mb-0">
          <ExcelImportDialog onImport={handleBarcodeImport} />
          <EnhancedAddProductDialog onAdd={handleAddProduct} barcodeDatabase={barcodeDatabase} />
          <Button onClick={downloadCSV} variant="outline" size="sm">
            הורד כ-CSV
          </Button>
          <Button 
            onClick={handleClearAllProducts} 
            variant="outline" 
            size="sm"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            נקה מוצרים
          </Button>
        </div>
      </div>

      {/* הסר את כפתור הוספת אצווה */}
      {/* <div className="flex-1 flex gap-2">
          <AddInventoryBatchDialog onAdded={reload} />
      </div> */}
      {/* במקום זאת השאר ריק או השאר את ה-div בלי תוכן */}
      <div className="flex flex-col sm:flex-row items-end justify-between mb-5 gap-2" />

      {/* טבלה מאוחדת בלבד */}
      <div className="my-6">
        {/* שולח את products עם remarks ל-ProductsTable */}
        <ProductsTable products={filteredProducts} />
      </div>

      {/* סכום כולל */}
      <div className="mt-4 flex items-center justify-end">
        <div className="bg-muted/60 text-lg font-bold px-4 py-2 rounded shadow border">
          סך שווי מלאי מוצג: <span className="font-mono">{totalStockValue.toLocaleString("he-IL")}</span> <span className="text-base font-normal text-muted-foreground">₪</span>
        </div>
      </div>
    </main>
  );
};

export default Products;
