
import * as React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ProductsTable from "@/components/ProductsTable";
import { Plus } from "lucide-react";

const Products = () => (
  <main className="min-h-screen bg-background px-8 py-8">
    <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-black text-primary mb-2">מוצרים</h1>
        <p className="text-muted-foreground">רשימת מוצרים לניהול מלאי, צפייה והוספה.</p>
      </div>
      <Button variant="default" className="w-full md:w-auto flex gap-2 items-center">
        <Plus /> הוסף מוצר חדש
      </Button>
    </div>
    <div className="mt-4">
      <ProductsTable />
    </div>
    <div className="mt-8">
      <Link to="/" className="text-blue-700 underline text-base">חזרה לדשבורד</Link>
    </div>
  </main>
);

export default Products;
