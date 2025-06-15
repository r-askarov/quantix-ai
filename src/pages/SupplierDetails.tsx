
import * as React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Phone, Building2 } from "lucide-react";

const weekdayLabels: Record<string, string> = {
  sunday: "ראשון",
  monday: "שני",
  tuesday: "שלישי",
  wednesday: "רביעי",
  thursday: "חמישי",
  friday: "שישי",
  saturday: "שבת"
};
const weekdays = Object.keys(weekdayLabels);

function useSupplierData(supplierId?: string) {
  const [supplier, setSupplier] = React.useState<any>(null);
  const [products, setProducts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!supplierId) return;
    setLoading(true);

    supabase
      .from("suppliers")
      .select("*")
      .eq("id", supplierId)
      .single()
      .then(({ data }) => {
        setSupplier(data);
        setLoading(false);
      });

    // שליפת מוצרים גם לפי supplier_id וגם לפי שם הספק (אם קיים)
    const barcodeDb = localStorage.getItem("barcodeDatabase");
    let arr: any[] = [];
    if (barcodeDb) {
      try {
        const parsed = JSON.parse(barcodeDb);
        // נאסוף תחילה לפי supplier_id (UUID)
        arr = Object.values(parsed).filter(
          (prod: any) => prod.supplier_id === supplierId
        );
        // אם אין תוצאות כלל, ננסה גם לפי שם הספק
        if (arr.length === 0 && supplierId) {
          // נמצא את שם הספק על פי ה-UUID מהטבלה (אם קיים ב-localStorage)
          let supplierName = undefined;
          if (parsed && Object.values(parsed).length > 0) {
            // נחפש שם מוצר שיש לו supplier_id === supplierId ומשם ניקח את השם
            // אך מכיוון שאין כנראה כזה, נסתמך על מה שמסופק ב-localStorage (תא ודוק)
          }
          // אם המידע של Name קיים, בינתיים ניקח מאותו ספק טבלאי (כלומר, רק אחרי השליפה)
          // נעשה זאת בהוק הראשי (ראה למטה)
        }
      } catch {}
    }
    setProducts(arr);
  }, [supplierId]);

  // אחרי שנטען הספק מה-db, נטען מוצרים לפי שם אם לא נמצא לפי id
  React.useEffect(() => {
    if (!supplier || products.length > 0) return;
    // לנסות שוב לפי שם
    const barcodeDb = localStorage.getItem("barcodeDatabase");
    if (barcodeDb && supplier?.name) {
      try {
        const parsed = JSON.parse(barcodeDb);
        const arrByName = Object.values(parsed).filter(
          (prod: any) =>
            prod.supplier === supplier.name ||
            prod.supplier_name === supplier.name
        );
        if (arrByName.length > 0) setProducts(arrByName);
      } catch {}
    }
  }, [supplier, products.length]);

  return { supplier, setSupplier, products, loading };
}

const SupplierDetails: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const supplierId = params.id;
  const { supplier, setSupplier, products, loading } = useSupplierData(supplierId);

  const [form, setForm] = React.useState<any>(null);
  const [saving, setSaving] = React.useState(false);
  const [editMode, setEditMode] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (supplier) {
      setForm({
        name: supplier.name || "",
        contact_phone: supplier.contact_phone || "",
        contact_email: supplier.contact_email || "",
        delivery_days: supplier.delivery_days || [],
        deadline_hour: supplier.deadline_hour || "",
        notes: supplier.notes || "",
      });
    }
  }, [supplier]);

  if (loading || !form) return <div className="p-8 text-center">טוען...</div>;
  if (!supplier) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-6 bg-card rounded-xl border shadow">
        <div className="font-bold text-xl mb-2">ספק לא נמצא</div>
        <Link className="underline text-blue-700" to="/suppliers">חזור לרשימת הספקים</Link>
      </div>
    );
  }

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleCheckbox = (day: string) => {
    setForm(f => ({
      ...f,
      delivery_days: f.delivery_days.includes(day)
        ? f.delivery_days.filter((d: string) => d !== day)
        : [...f.delivery_days, day]
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const { error } = await supabase
      .from("suppliers")
      .update({
        name: form.name,
        contact_phone: form.contact_phone,
        contact_email: form.contact_email,
        delivery_days: form.delivery_days,
        deadline_hour: form.deadline_hour,
        notes: form.notes
      })
      .eq("id", supplier.id);

    if (error) {
      setMessage("שגיאה בשמירה: " + error.message);
    } else {
      setMessage("הפרטים נשמרו בהצלחה");
      setEditMode(false);
      setSupplier({ ...supplier, ...form }); // רפרש לוקאלי
    }
    setSaving(false);
  };

  return (
    <main className="container mx-auto py-8 px-4 max-w-3xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            {form.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 font-semibold">שם ספק: 
                <Input name="name" value={form.name} onChange={handleInput} disabled={!editMode} required />
              </label>
              <label className="flex items-center gap-2"><Phone className="w-4 h-4" />
                <Input name="contact_phone" value={form.contact_phone} onChange={handleInput} disabled={!editMode} placeholder="טלפון" />
              </label>
              <label className="flex items-center gap-2"><Mail className="w-4 h-4" />
                <Input name="contact_email" value={form.contact_email} onChange={handleInput} disabled={!editMode} placeholder="אימייל" />
              </label>
              <div className="flex gap-2 flex-wrap items-center">
                <span className="font-semibold">ימי אספקה:</span>
                {weekdays.map(day => (
                  <label key={day} className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={form.delivery_days.includes(day)}
                      disabled={!editMode}
                      onChange={() => handleCheckbox(day)}
                    />
                    {weekdayLabels[day]}
                  </label>
                ))}
              </div>
              <label className="font-semibold flex items-center gap-2">
                דדליין:
                <Input type="time" name="deadline_hour" value={form.deadline_hour?.slice(0,5)} onChange={handleInput} disabled={!editMode} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-semibold">הערות:</span>
                <textarea name="notes" className="border rounded-md p-2" rows={2} value={form.notes} onChange={handleInput} disabled={!editMode} />
              </label>
            </div>
            <div className="flex gap-4 mt-2">
              {editMode ? (
                <>
                  <Button type="submit" disabled={saving}>{saving ? "שומר..." : "שמור שינויים"}</Button>
                  <Button type="button" variant="secondary" onClick={() => { setEditMode(false); setForm({ ...supplier }); setMessage(null); }}>ביטול</Button>
                </>
              ) : (
                <Button type="button" onClick={() => setEditMode(true)}>ערוך</Button>
              )}
            </div>
            {message && (
              <div className={`text-sm mt-2 ${message.startsWith("שגיאה") ? "text-destructive" : "text-green-700"}`}>
                {message}
              </div>
            )}
          </form>
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

