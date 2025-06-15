
import * as React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Phone, Mail } from "lucide-react";

const weekdayLabels: Record<string, string> = {
  sunday: "ראשון",
  monday: "שני",
  tuesday: "שלישי",
  wednesday: "רביעי",
  thursday: "חמישי",
  friday: "שישי",
  saturday: "שבת"
};

function useSupplierData(supplierId?: string) {
  const [supplier, setSupplier] = React.useState<any>(null);
  const [products, setProducts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (!supplierId) return;
    setLoading(true);

    // שליפת פרטי ספק ממסד הנתונים:
    supabase
      .from("suppliers")
      .select("*")
      .eq("id", supplierId)
      .single()
      .then(({ data }) => {
        setSupplier(data);
      });

    // שליפת מוצרים (מlocalStorage לפי שם הספק)
    const barcodeDb = localStorage.getItem("barcodeDatabase");
    let arr: any[] = [];
    if (barcodeDb) {
      try {
        const parsed = JSON.parse(barcodeDb);
        arr = Object.values(parsed).filter(
          (prod: any) => prod.supplier_id === supplierId || prod.supplier === supplierId // Fallback - במידה וה-ID הוא השם
        );
      } catch {
        // ignore
      }
    }
    setProducts(arr);
    setLoading(false);
  }, [supplierId]);

  return { supplier, products, loading };
}

const SupplierDetails: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const supplierId = params.id;
  const { supplier, products, loading } = useSupplierData(supplierId);

  if (loading) return <div className="p-8 text-center">טוען...</div>;
  if (!supplier) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-6 bg-card rounded-xl border shadow">
        <div className="font-bold text-xl mb-2">ספק לא נמצא</div>
        <Link className="underline text-blue-700" to="/suppliers">חזור לרשימת הספקים</Link>
      </div>
    );
  }

  return (
    <main className="container mx-auto py-8 px-4 max-w-3xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            {supplier.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {supplier.contact_phone && (
              <div className="flex gap-2 items-center text-sm">
                <Phone className="w-4 h-4" /> {supplier.contact_phone}
              </div>
            )}
            {supplier.contact_email && (
              <div className="flex gap-2 items-center text-sm">
                <Mail className="w-4 h-4" /> {supplier.contact_email}
              </div>
            )}
            <div>ימי אספקה: {supplier.delivery_days?.map((d: string) => weekdayLabels[d] || d).join(", ") || "לא הוזן"}</div>
            <div>דדליין: {supplier.deadline_hour?.replace(/:00$/, "") || "לא צויין"}</div>
            {supplier.notes && <div className="mt-2 text-muted-foreground">{supplier.notes}</div>}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>מוצרים שמסופקים על ידי הספק</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-muted-foreground py-4">לא נמצאו מוצרים עבור הספק.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border text-right text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="py-2 px-3 border">שם מוצר</th>
                    <th className="py-2 px-3 border">ברקוד</th>
                    <th className="py-2 px-3 border">מחיר</th>
                    <th className="py-2 px-3 border">קטגוריה</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(prod => (
                    <tr key={prod.barcode}>
                      <td className="py-1 px-3 border">{prod.name}</td>
                      <td className="py-1 px-3 border font-mono">{prod.barcode}</td>
                      <td className="py-1 px-3 border">{prod.unitPrice ?? "—"}</td>
                      <td className="py-1 px-3 border">{prod.category ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => navigate(-1)}>
          חזור
        </Button>
        <Button variant="default" onClick={() => alert("הזמנה מהירה תיתמך בעתיד")}>
          הזמנה מהירה
        </Button>
      </div>
    </main>
  );
};

export default SupplierDetails;
