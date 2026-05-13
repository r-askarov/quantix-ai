
import * as React from "react";
import { AlertCircle } from "lucide-react";

const colorByLevel = {
  error: "bg-red-50 border-red-400 text-red-800",
  info: "bg-blue-50 border-blue-400 text-blue-900",
};

type ProductSummary = {
  barcode: string;
  name: string;
  quantity: number;
  minStock: number;
};

const NotificationsPanel = ({ products }: { products?: ProductSummary[] }) => {
  const prods = React.useMemo(() => {
    if (products && Array.isArray(products)) return products as ProductSummary[];
    try {
      const stored = localStorage.getItem('products');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, [products]);

  // Only show alerts for products that exist in the products "table" (i.e., our products array)
  const lowStock = prods.filter((p) => p && typeof p.quantity === 'number' && typeof p.minStock === 'number' && p.quantity <= p.minStock);

  return (
    <div className="flex flex-col gap-3 sm:w-[90%] md:w-[50%]" aria-live="polite">
      <h3 className="text-lg font-bold mb-1 flex items-center gap-2"><AlertCircle size={18} className="text-primary" /> התראות אחרונות</h3>
      {lowStock.length === 0 ? (
        <div className={`rounded-lg border-l-4 px-4 py-3 mb-1 shadow-sm transition ${colorByLevel.info}`}>
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-blue-500" />
            <span className="font-semibold">אין התראות כרגע</span>
          </div>
          <div className="text-sm mt-1">כל המוצרים במלאי תקין.</div>
        </div>
      ) : (
        lowStock.slice(0, 6).map((p, idx) => (
          <div key={p.barcode || idx} className={`rounded-lg border-l-4 px-4 py-3 mb-1 shadow-sm transition ${colorByLevel.error}`}>
            <div className="flex flex-row items-center gap-2">
              <AlertCircle size={16} className="text-red-500" />
              <span className="font-semibold">התראה: מלאי נמוך - {p.name}</span>
            </div>
            <div className="text-sm mt-1">כמות נוכחית: <span className="font-bold">{p.quantity}</span> &nbsp;מלאי מינימום: {p.minStock}</div>
          </div>
        ))
      )}
    </div>
  );
};

export default NotificationsPanel;
