
import * as React from "react";
import { Link } from "react-router-dom";
const Suppliers = () => (
  <main className="min-h-screen bg-background px-8 py-8">
    <div className="mb-6">
      <h1 className="text-3xl font-black text-primary mb-2">ספקים</h1>
      <p className="text-muted-foreground">ניהול הספקים שמספקים לך את הסחורה.</p>
      <div className="mt-4">
        <Link to="/" className="text-blue-700 underline text-base">חזרה לדשבורד</Link>
      </div>
    </div>
    {/* כאן בהמשך תוכל להוסיף טבלה/רשימת ספקים */}
    <div className="rounded-xl bg-card shadow border p-6 mt-8 text-center text-muted-foreground">
      <span>טרם נוספו ספקים למערכת.</span>
    </div>
  </main>
);

export default Suppliers;
