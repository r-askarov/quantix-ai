
import * as React from "react";
import { Link } from "react-router-dom";
const Products = () => (
  <main className="min-h-screen bg-background px-8 py-8">
    <div className="mb-6">
      <h1 className="text-3xl font-black text-primary mb-2">מוצרים</h1>
      <p className="text-muted-foreground">רשימת מוצרים לניהול מלאי, צפייה והוספה.</p>
      <div className="mt-4">
        <Link to="/" className="text-blue-700 underline text-base">חזרה לדשבורד</Link>
      </div>
    </div>
    {/* כאן תוכל להוסיף רכיב טבלה/רשימת מוצרים בעתיד */}
    <div className="rounded-xl bg-card shadow border p-6 mt-8 text-center text-muted-foreground">
      <span>עדיין לא נוספו מוצרים.</span>
    </div>
  </main>
);

export default Products;
