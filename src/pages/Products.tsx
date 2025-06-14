
import * as React from "react";
import { Link } from "react-router-dom";
import ProductsTable from "@/components/ProductsTable";
import AddProductDialog, { Product } from "@/components/AddProductDialog";
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

  // בדיקה בזמן טעינה האם יש מוצרים שמגיעים למינימום - שליחת התראה
  React.useEffect(() => {
    products.forEach((p) => {
      if (p.quantity <= p.minStock) {
        toast({
          title: `המוצר '${p.name}' הגיע או עבר את מלאי המינימום!`,
          variant: "destructive",
        });
      }
    });
  }, [products]);

  const handleAddProduct = (product: Product) => {
    setProducts((prev) => [...prev, product]);
  };

  return (
    <main className="min-h-screen bg-background px-8 py-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary mb-2">מוצרים</h1>
          <p className="text-muted-foreground">רשימת מוצרים לניהול מלאי, צפייה והוספה.</p>
        </div>
        <AddProductDialog onAdd={handleAddProduct} />
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
