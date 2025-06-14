
import * as React from "react";
import { Link } from "react-router-dom";
import ProductsTable from "@/components/ProductsTable";
import EnhancedAddProductDialog, { Product } from "@/components/EnhancedAddProductDialog";
import ExcelImportDialog, { BarcodeDatabase } from "@/components/ExcelImportDialog";
import { toast } from "@/hooks/use-toast";

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
      // חיפוש מוצר קיים לפי שם
      const existingProductIndex = prev.findIndex((p) => p.name === product.name);
      
      if (existingProductIndex !== -1) {
        // אם המוצר קיים, נעדכן את הכמות
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
        // אם המוצר לא קיים, נוסיף אותו כמוצר חדש
        toast({ title: "המוצר נוסף בהצלחה!" });
        return [...prev, product];
      }
    });
  };

  const handleBarcodeImport = (database: BarcodeDatabase) => {
    setBarcodeDatabase(database);
    // שמירת המאגר ב-localStorage
    localStorage.setItem('barcodeDatabase', JSON.stringify(database));
    console.log("Barcode database imported:", database);
  };

  return (
    <main className="min-h-screen bg-background px-8 py-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary mb-2">מוצרים</h1>
          <p className="text-muted-foreground">רשימת מוצרים לניהול מלאי, צפייה והוספה.</p>
        </div>
        <div className="flex gap-2">
          <ExcelImportDialog onImport={handleBarcodeImport} />
          <EnhancedAddProductDialog onAdd={handleAddProduct} barcodeDatabase={barcodeDatabase} />
        </div>
      </div>
      <div className="mt-4">
        <ProductsTable products={products} />
      </div>
      <div className="mt-8">
        <Link to="/" className="text-blue-700 underline text-base">חזרה לדשבורד</Link>
      </div>
    </main>
  );
};

export default Products;
