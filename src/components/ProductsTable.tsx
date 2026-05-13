
import * as React from "react";
import { useState } from "react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import type { Product } from "../pages/Products";
import { format } from "date-fns";
import { Edit, X } from "lucide-react";

// נוסיף טיפוס שגם שדה הערות אפשרי:
interface ProductsTableProps {
  products: (Product & { remarks?: string })[];
  onEdit?: (product: Product) => void;
}

// Parse date strings like "YYYY-MM-DD" into a local Date (avoid UTC shift)
function parseToLocalDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === "string") {
    const isoDate = /^\d{4}-\d{2}-\d{2}/.exec(value);
    if (isoDate) {
      const [y, m, d] = value.slice(0, 10).split("-").map(Number);
      return new Date(y, m - 1, d);
    }
    const dt = new Date(value);
    return isNaN(dt.getTime()) ? null : dt;
  }
  return null;
}

const ProductsTable: React.FC<ProductsTableProps> = ({ products, onEdit }) => {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<Partial<Product>>({});

  function openEditor(p: Product) {
    setEditingProduct(p);
    setForm({ ...p });
  }

  function closeEditor() {
    setEditingProduct(null);
    setForm({});
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
  }

  function saveEdit() {
    if (!editingProduct) return;
    const updated: Product = {
      barcode: String(form.barcode ?? editingProduct.barcode),
      name: String(form.name ?? editingProduct.name),
      supplier: String(form.supplier ?? editingProduct.supplier),
      quantity: Number(form.quantity ?? editingProduct.quantity),
      minStock: Number(form.minStock ?? editingProduct.minStock),
      price: Number(form.price ?? editingProduct.price),
      expiryDate: (form.expiryDate ?? editingProduct.expiryDate) ?? null,
    };
    onEdit && onEdit(updated);
    closeEditor();
  }
  return (
    <div className="overflow-x-auto rounded-md border bg-card shadow">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">ברקוד</TableHead>
            <TableHead className="text-right">שם מוצר</TableHead>
            <TableHead className="text-right">כמות כוללת</TableHead>
            <TableHead className="text-right">ספק</TableHead>
            <TableHead className="text-right">מלאי מינימום</TableHead>
            <TableHead className="text-right">מחיר</TableHead>
            <TableHead className="text-right">תאריך תפוגה</TableHead>
            <TableHead className="text-right">עריכה</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                לא נמצאו מוצרים.
              </TableCell>
            </TableRow>
          ) : (
            products.map((p) => {
              const isLow = p.quantity <= p.minStock;
              return (
                <TableRow key={p.barcode} className={isLow ? "bg-red-100/60" : ""}>
                  <TableCell className="font-mono">{p.barcode}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell className={isLow ? "text-red-700 font-bold" : ""}>
                    {p.quantity}
                  </TableCell>
                  <TableCell>{p.supplier}</TableCell>
                  <TableCell>{p.minStock}</TableCell>
                  <TableCell>{typeof p.price === "number" ? p.price + " ₪" : "-"}</TableCell>
                  <TableCell>
                    {p.remarks ? (
                      p.remarks
                    ) : p.expiryDate ? (
                      (() => {
                        try {
                          const d = parseToLocalDate(p.expiryDate as any);
                          return d ? format(d, "dd/MM/yyyy") : "שגוי";
                        } catch {
                          return "שגוי";
                        }
                      })()
                    ) : (
                      "אין"
                    )}
                  </TableCell>
                  <TableCell className="w-20">
                    <button
                      onClick={() => openEditor(p)}
                      className="p-2 rounded hover:bg-gray-100"
                      title="ערוך"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      {/* Simple edit modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeEditor} />
          <div className="relative bg-white p-4 rounded shadow w-full max-w-md mx-4" dir="rtl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg">עריכת מוצר</h3>
              <button onClick={closeEditor} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-right">ברקוד</label>
              <input name="barcode" value={String(form.barcode ?? '')} onChange={handleChange} className="border rounded px-2 py-1" />
              <label className="text-xs text-right">שם</label>
              <input name="name" value={String(form.name ?? '')} onChange={handleChange} className="border rounded px-2 py-1" />
              <label className="text-xs text-right">ספק</label>
              <input name="supplier" value={String(form.supplier ?? '')} onChange={handleChange} className="border rounded px-2 py-1" />
              <label className="text-xs text-right">כמות</label>
              <input name="quantity" type="number" value={Number(form.quantity ?? 0)} onChange={handleChange} className="border rounded px-2 py-1" />
              <label className="text-xs text-right">מלאי מינימום</label>
              <input name="minStock" type="number" value={Number(form.minStock ?? 0)} onChange={handleChange} className="border rounded px-2 py-1" />
              <label className="text-xs text-right">מחיר</label>
              <input name="price" type="number" value={Number(form.price ?? 0)} onChange={handleChange} className="border rounded px-2 py-1" />
              <label className="text-xs text-right">תאריך תפוגה</label>
              <input name="expiryDate" type="date" value={form.expiryDate ? String(form.expiryDate).slice(0,10) : ''} onChange={handleChange} className="border rounded px-2 py-1" />
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={closeEditor} className="px-3 py-1 border rounded">ביטול</button>
              <button onClick={saveEdit} className="px-3 py-1 bg-blue-600 text-white rounded">שמור</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsTable;
