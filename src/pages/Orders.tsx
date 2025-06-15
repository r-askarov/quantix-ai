
import * as React from "react";
import { Link } from "react-router-dom";
import OCRShippingDocumentDialog from "@/components/OCRShippingDocumentDialog";
import ShippingComparisonTable from "@/components/ShippingComparisonTable";
import CreateOrderDialog from "@/components/CreateOrderDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export interface ShippingItem {
  name: string;
  quantity: number;
  status: 'match' | 'missing' | 'extra';
  barcode?: string; // ברקוד אופציונלי
}

const Orders = () => {
  const [shippingItems, setShippingItems] = React.useState<ShippingItem[]>([]);
  const [showComparison, setShowComparison] = React.useState(false);
  const [showCreateOrder, setShowCreateOrder] = React.useState(false);

  const handleOCRResult = (items: ShippingItem[]) => {
    setShippingItems(items);
    setShowComparison(true);
  };

  return (
    <main className="min-h-screen bg-background px-8 py-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary mb-2">הזמנות</h1>
          <p className="text-muted-foreground">ניהול הזמנות רכש ומכירה בצורה מרוכזת.</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowCreateOrder(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-4 h-4 ml-1" />
            הזמנה חדשה לספק
          </Button>
          <OCRShippingDocumentDialog onOCRResult={handleOCRResult} />
        </div>
      </div>

      {showComparison && shippingItems.length > 0 && (
        <div className="mb-8">
          <ShippingComparisonTable items={shippingItems} />
        </div>
      )}

      {!showComparison && (
        <div className="rounded-xl bg-card shadow border p-6 mt-8 text-center text-muted-foreground">
          <span>אין הזמנות להצגה כרגע. השתמש בכלי OCR כדי לסרוק תעודת משלוח או צור הזמנה חדשה לספק.</span>
        </div>
      )}

      <div className="mt-8">
        <Link to="/" className="text-blue-700 underline text-base">חזרה לדשבורד</Link>
      </div>

      {/* Create Order Dialog */}
      <CreateOrderDialog
        open={showCreateOrder}
        onClose={() => setShowCreateOrder(false)}
      />
    </main>
  );
};

export default Orders;
