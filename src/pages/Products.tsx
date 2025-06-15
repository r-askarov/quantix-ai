
import * as React from "react";
import { Link } from "react-router-dom";
import ProductsTable from "@/components/ProductsTable";
import EnhancedAddProductDialog, { Product } from "@/components/EnhancedAddProductDialog";
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
import { ChevronDown, RotateCcw } from "lucide-react"; // use RotateCcw instead of Reset

const initialProducts: Product[] = [
  { barcode: "7290001234567", name: "מברגה בוש", quantity: 13, supplier: "חשמל יצחק", minStock: 5 },
  { barcode: "7290009876541", name: "סרט מדידה 5 מטר", quantity: 34, supplier: "י.א. בניה", minStock: 10 },
  { barcode: "7290001122445", name: "פלייר מקצועי", quantity: 28, supplier: "כלי-ברזל בע\"מ", minStock: 10 },
  { barcode: "7290009988776", name: "מברשת צבע", quantity: 56, supplier: "ספק מבנים", minStock: 15 },
  { barcode: "7290008765432", name: "מסור ידני", quantity: 2, supplier: "כלי-ברזל בע\"מ", minStock: 2 },
];

const Products = () => {
  const [products, setProducts] = React.useState<Product[]>(initialProducts);
  const [barcodeDatabase, setBarcodeDatabase] = React.useState<BarcodeDatabase>({});

  // --- פילטרים ---
  const [supplierFilter, setSupplierFilter] = React.useState<string | null>(null);
  const [lowStockOnly, setLowStockOnly] = React.useState(false);

  // הפקת רשימת ספקים ייחודיים
  const uniqueSuppliers = React.useMemo(() => {
    return Array.from(new Set(products.map((p) => p.supplier).filter(Boolean)));
  }, [products]);

  // החלת סינון על הרשימה
  const filteredProducts = React.useMemo(() => {
    let filtered = [...products];
    if (supplierFilter) filtered = filtered.filter(p => p.supplier === supplierFilter);
    if (lowStockOnly) filtered = filtered.filter(p => p.quantity <= p.minStock);
    return filtered;
  }, [products, supplierFilter, lowStockOnly]);

  // טעינת מאגר ברקודים מ-localStorage בעת הטעינה הראשונה
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

  // בעת טעינה: לייצר התראה אחת עם רשימת מוצרים נמוכים מהמינימום
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

  const handleAddProduct = (product: Product) => {
    setProducts((prev) => {
      const existingProductIndex = prev.findIndex((p) => p.name === product.name);
      if (existingProductIndex !== -1) {
        const updatedProducts = [...prev];
        updatedProducts[existingProductIndex] = {
          ...updatedProducts[existingProductIndex],
          quantity: updatedProducts[existingProductIndex].quantity + product.quantity,
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

  const handleBarcodeImport = (database: BarcodeDatabase) => {
    setBarcodeDatabase(database);
    localStorage.setItem('barcodeDatabase', JSON.stringify(database));
    console.log("Barcode database imported and saved:", database);
    toast({
      title: "מאגר ברקודים יובא בהצלחה!",
      description: `יובאו ${Object.keys(database).length} מוצרים למאגר`,
    });
  };

  // איפוס כל הסינונים
  const handleResetFilters = () => {
    setSupplierFilter(null);
    setLowStockOnly(false);
  };

  return (
    <main className="min-h-screen bg-background px-2 sm:px-8 py-8">
      {/* טולבר עם סינונים */}
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

          {/* פילטר מלאי נמוך (טוגל) */}
          <Toggle
            pressed={lowStockOnly}
            size="sm"
            aria-label="הצג רק מלאי נמוך"
            onPressedChange={setLowStockOnly}
            className="min-w-[90px]"
          >
            מלאי נמוך
          </Toggle>

          {/* איפוס סינון */}
          <Button
            onClick={handleResetFilters}
            variant="ghost"
            size="sm"
            className="text-xs" 
            title="איפוס סינון"
          >
            <RotateCcw className="w-4 h-4 mr-1" /> {/* Changed from Reset to RotateCcw */}
            איפוס סינון
          </Button>
        </div>
        <div className="flex gap-2 justify-end mb-2 sm:mb-0">
          <ExcelImportDialog onImport={handleBarcodeImport} />
          <EnhancedAddProductDialog onAdd={handleAddProduct} barcodeDatabase={barcodeDatabase} />
        </div>
      </div>

      <div className="mt-4">
        <ProductsTable products={filteredProducts} />
      </div>
      <div className="mt-8">
        <Link to="/" className="text-blue-700 underline text-base">חזרה לדשבורד</Link>
      </div>
    </main>
  );
};

export default Products;

