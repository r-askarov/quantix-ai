import * as React from "react";
import { Link } from "react-router-dom";
import SupplierCard from "@/components/SupplierCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import i18n from '../i18n'; // import your i18n config
import { useTranslation } from "react-i18next";

const RTL_LANGS = ["he", "ar", "fa", "ur"];

interface BarcodeProduct {
  barcode: string;
  name: string;
  supplier: string;
  unitPrice?: number;
  category?: string;
}

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

function getSupplierData(supplierName: string) {
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
  const [syncing, setSyncing] = React.useState(false);
  const { i18n } = useTranslation();
  const dir = RTL_LANGS.includes(i18n.language) ? "rtl" : "ltr";

  const suppliers = React.useMemo(() => {
    const set = new Set<string>();
    Object.values(barcodeDatabase).forEach(prod => prod.supplier && set.add(prod.supplier.trim()));
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b, "he"));
  }, [barcodeDatabase]);

  const filteredSuppliers = React.useMemo(() => {
    if (!search.trim()) return suppliers;
    return suppliers.filter(s => s.toLowerCase().includes(search.toLowerCase()));
  }, [suppliers, search]);

  const handleNewOrder = (supplierName: string) => {
    alert("פתח הזמנה חדשה ל: " + supplierName);
  };

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

  // ---- כפתור סנכרון ספקים ----
  const handleSyncSuppliers = async () => {
    setSyncing(true);
    // 1. שלוף ספקים קיימים מטבלת suppliers
    const { data: existingSuppliers, error } = await supabase
      .from("suppliers")
      .select("name");
    if (error) {
      toast({
        title: "שגיאה בסנכרון",
        description: error.message,
        variant: "destructive"
      });
      setSyncing(false);
      return;
    }
    const existingNames = (existingSuppliers || []).map(s => (s.name || "").toLowerCase().trim());
    // 2. מתוך הברקוד־DB – כל הספקים הייחודיים שלא קיימים
    const barcodeSuppliers = Array.from(
      new Set(
        Object.values(barcodeDatabase)
          .map(p => (p.supplier || "").trim())
          .filter(Boolean)
      )
    );
    const missingSuppliers = barcodeSuppliers.filter(
      name => !existingNames.includes(name.toLowerCase())
    );
    if (missingSuppliers.length === 0) {
      toast({ title: "כל הספקים במאגר כבר קיימים", description: "לא נוספו ספקים חדשים" });
      setSyncing(false);
      return;
    }
    // 3. נסנף את כל החסרים (חובה שם, יתר השדות ריקים)
    const { error: insertErr } = await supabase.from("suppliers").insert(
      missingSuppliers.map(name => ({ name }))
    );
    setSyncing(false);
    if (insertErr) {
      toast({
        title: "שגיאה בהוספת ספקים",
        description: insertErr.message,
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "הספקים נוספו",
      description: `נוספו ${missingSuppliers.length} ספקים חדשים ממאגר הברקודים.`
    });
    // אין רענון אוטומטי של דף הספקים כי מאגר הברקודים נטען רק פעם אחת (אפשר לרענן את הדף)
  };

  return (
    <main className="min-h-screen bg-background px-8 py-8" dir={dir}>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-primary mb-2">ספקים</h1>
        <p className="text-muted-foreground">ניהול הספקים שמספקים לך את הסחורה.</p>
        {/* כפתור סנכרון ספקים */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleSyncSuppliers} disabled={syncing}>
            {syncing ? "מסנכרן..." : "סנכרן ספקים מהמאגר"}
          </Button>
        </div>
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
