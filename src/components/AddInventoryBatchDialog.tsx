
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  onAdded: () => void;
}

export default function AddInventoryBatchDialog({ onAdded }: Props) {
  const [open, setOpen] = React.useState(false);

  const [form, setForm] = React.useState({
    barcode: "",
    product_name: "",
    quantity: 1,
    supplier: "",
    unit_price: "",
    expiry_date: "",
  });

  const [loading, setLoading] = React.useState(false);

  const handleChange = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // חפש אם כבר קיים batch זהה ברקוד + expiry_date
    const { data: existing, error } = await supabase
      .from<any>("inventory_batches")
      .select("*")
      .eq("barcode", form.barcode)
      .eq("expiry_date", form.expiry_date || null)
      .maybeSingle();

    if (existing && existing.id) {
      // עדכן כמות קיימת
      await supabase
        .from<any>("inventory_batches")
        .update({
          quantity: Number(existing.quantity) + Number(form.quantity),
          supplier: form.supplier || existing.supplier,
          unit_price: form.unit_price ? Number(form.unit_price) : existing.unit_price,
        })
        .eq("id", existing.id);

      setLoading(false);
      setOpen(false);
      onAdded?.();
      toast({ title: "עודכן בהצלחה", description: "הכמות עודכנה לאצווה קיימת" });
      return;
    }

    // יצירת batch חדש
    await supabase.from<any>("inventory_batches").insert([
      {
        barcode: form.barcode,
        product_name: form.product_name,
        expiry_date: form.expiry_date || null,
        quantity: Number(form.quantity),
        supplier: form.supplier,
        unit_price: form.unit_price ? Number(form.unit_price) : 0,
      }
    ]);
    setLoading(false);
    setOpen(false);
    onAdded?.();
    toast({ title: "בוצעה קליטה", description: "התווספה אצווה חדשה" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>הוספת אצווה חדשה</Button>
      </DialogTrigger>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>קליטת אצווה/סדרה חדשה</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>ברקוד *</Label>
            <Input value={form.barcode} onChange={e => handleChange("barcode", e.target.value)} required autoFocus />
          </div>
          <div>
            <Label>שם מוצר *</Label>
            <Input value={form.product_name} onChange={e => handleChange("product_name", e.target.value)} required />
          </div>
          <div>
            <Label>כמות *</Label>
            <Input type="number" value={form.quantity} min={1} onChange={e => handleChange("quantity", e.target.value)} required />
          </div>
          <div>
            <Label>תוקף (לא חובה)</Label>
            <Input
              type="date"
              value={form.expiry_date}
              onChange={e => handleChange("expiry_date", e.target.value)}
            />
          </div>
          <div>
            <Label>ספק</Label>
            <Input value={form.supplier} onChange={e => handleChange("supplier", e.target.value)} />
          </div>
          <div>
            <Label>מחיר יחידה</Label>
            <Input type="number" value={form.unit_price} min={0} onChange={e => handleChange("unit_price", e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>{loading ? "שומר..." : "שמור"}</Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>ביטול</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
