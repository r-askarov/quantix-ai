
import * as React from "react";
import { Link } from "react-router-dom";
const Orders = () => (
  <main className="min-h-screen bg-background px-8 py-8">
    <div className="mb-6">
      <h1 className="text-3xl font-black text-primary mb-2">הזמנות</h1>
      <p className="text-muted-foreground">ניהול הזמנות רכש ומכירה בצורה מרוכזת.</p>
      <div className="mt-4">
        <Link to="/" className="text-blue-700 underline text-base">חזרה לדשבורד</Link>
      </div>
    </div>
    {/* כאן תוכל להציג רשימת הזמנות בעתיד */}
    <div className="rounded-xl bg-card shadow border p-6 mt-8 text-center text-muted-foreground">
      <span>אין הזמנות להצגה כרגע.</span>
    </div>
  </main>
);

export default Orders;
