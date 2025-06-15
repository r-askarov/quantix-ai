import * as React from "react";
import { Link } from "react-router-dom";
import SupplierCard from "@/components/SupplierCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface BarcodeProduct {
  barcode: string;
  name: string;
  supplier: string;
  unitPrice?: number;
  category?: string;
}

// נביא את כל הברקודים מ-localStorage (כמו ב-Orders).
function useBarcodeDatabase(): Record<string, BarcodeProduct> {
  const [barcodeDatabase, setBarcodeDatabase] = React.useState<Record<string, BarcodeProduct>>({});
  React.useEffect(() => {
    const saved = localStorage.getItem('barcodeDatabase');
    if (saved) {
      try {
        setBarcodeDatabase(JSON.parse(saved));
      } catch {
        setBarcodeDatabase({});
      }
    }
  }, []);
  return barcodeDatabase;
}

// פונקציית דמה למציאת הזמנה קרובה וכו'
function getSupplierData(supplierName: string) {
  // כאן אפשר להרחיב בעתיד לשלוף בפועל מנתוני ההזמנות
  return {
    deliveryDays: [],
    deadlineHour: undefined,
    orderStatus: undefined,
    nextDeliveryDate: undefined
  };
}

const Suppliers = () => {
  const barcodeDatabase = useBarcodeDatabase();
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // שליפת ספקים ייחודיים ממאגר הברקודים בלבד (שם ספק לא ריק)
  const suppliers = React.useMemo(() => {
    const set = new Set<string>();
    Object.values(barcodeDatabase).forEach(prod => prod.supplier && set.add(prod.supplier.trim()));
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b, "he"));
  }, [barcodeDatabase]);

  // אפשרות להרחיב בעתיד לפי קטגוריה, יום אספקה וכו'
  const filteredSuppliers = React.useMemo(() => {
    if (!search.trim()) return suppliers;
    return suppliers.filter(s => s.toLowerCase().includes(search.toLowerCase()));
  }, [suppliers, search]);

  // במקום API: דמה - future: שלוף הזמנות מסופאבייס
  const handleNewOrder = (supplierName: string) => {
    // TODO: שליחת הזמנה חדשה כפתור (ניווט או מודל)
    alert("פתח הזמנה חדשה ל: " + supplierName);
  };

  // פונקציה חדשה: קח שם ספק, שלוף את ה-id מ-supabase ונווט לכתובת עם id
  const handleViewSupplier = async (supplierName: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("suppliers")
      .select("id")
      .ilike("name", supplierName.trim())
      .maybeSingle();

    setLoading(false);

    if (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את פרטי הספק (" + error.message + ")",
        variant: "destructive"
      });
      return;
    }
    if (!data?.id) {
      toast({
        title: "לא נמצא",
        description: "לא נמצא ספק בשם " + supplierName,
        variant: "destructive"
      });
      return;
    }
    window.location.href = `/suppliers/${data.id}`;
  };

  return (
    <main className="min-h-screen bg-background px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-primary mb-2">ספקים</h1>
        <p className="text-muted-foreground">ניהול הספקים שמספקים לך את הסחורה.</p>
        <div className="mt-6 max-w-md flex items-center gap-2">
          <div className="relative w-full">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש ספק..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>
        <div className="mt-4">
          <Link to="/" className="text-blue-700 underline text-base">חזרה לדשבורד</Link>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 mt-8">
        {filteredSuppliers.length === 0 ? (
          <div className="rounded-xl bg-card shadow border p-6 col-span-2 md:col-span-3 text-center text-muted-foreground">
            <span>לא נמצאו ספקים.</span>
          </div>
        ) : (
          filteredSuppliers.map(supplierName => {
            const { deliveryDays, deadlineHour, orderStatus, nextDeliveryDate } = getSupplierData(supplierName);
            return (
              <SupplierCard
                key={supplierName}
                supplierName={supplierName}
                deliveryDays={deliveryDays}
                deadlineHour={deadlineHour}
                onNewOrder={handleNewOrder}
                onViewSupplier={handleViewSupplier}
                orderStatus={orderStatus}
                nextDeliveryDate={nextDeliveryDate}
              />
            );
          })
        )}
      </div>
      {loading && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg px-8 py-4 shadow text-center">
            טוען...
          </div>
        </div>
      )}
    </main>
  );
};

export default Suppliers;
