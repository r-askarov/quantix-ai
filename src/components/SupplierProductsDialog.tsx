import * as React from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { Package, X, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BarcodeProduct {
  barcode: string;
  name: string;
  supplier: string;
  unitPrice?: number;
  category?: string;
}

interface SupplierProductsDialogProps {
  open: boolean;
  onClose: () => void;
  supplierName: string | null;
  barcodeDatabase: Record<string, BarcodeProduct>;
}

const SupplierProductsDialog: React.FC<SupplierProductsDialogProps> = ({
  open,
  onClose,
  supplierName,
  barcodeDatabase,
}) => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [open]);

  const supplierProducts = React.useMemo(() => {
    if (!supplierName) return [];
    return Object.entries(barcodeDatabase)
      .filter(([_, product]) => product.supplier === supplierName)
      .map(([barcode, product]) => ({ ...product, barcode }));
  }, [barcodeDatabase, supplierName]);

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    supplierProducts.forEach(p => { if (p.category) set.add(p.category.trim()); });
    return Array.from(set).sort();
  }, [supplierProducts]);

  const filtered = React.useMemo(() => {
    let out = supplierProducts;
    if (selectedCategory) out = out.filter(p => p.category === selectedCategory);
    if (searchTerm.trim()) {
      out = out.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode.includes(searchTerm));
    }
    return out;
  }, [supplierProducts, selectedCategory, searchTerm]);

  const modal = open ? createPortal(
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 99999 }}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col mx-4" dir="rtl" role="dialog" aria-modal="true">
        <div className="border-b p-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Package className="w-5 h-5" /> מוצרים של {supplierName}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 overflow-hidden">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חיפוש מוצר לפי שם או ברקוד..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              {filtered.length} מוצרים
            </div>
          </div>

          {categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                className={`px-3 py-1 rounded ${selectedCategory === null ? 'bg-gray-100' : 'bg-white border'}`}
                onClick={() => setSelectedCategory(null)}
              >
                הכל ({supplierProducts.length})
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`px-3 py-1 rounded ${selectedCategory === cat ? 'bg-gray-100' : 'bg-white border'}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat} ({supplierProducts.filter(p => p.category === cat).length})
                </button>
              ))}
            </div>
          )}

          <div className="border rounded-lg overflow-auto max-h-[50vh]">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="text-lg font-medium mb-2">{supplierProducts.length === 0 ? 'אין מוצרים עבור ספק זה' : 'לא נמצאו מוצרים'}</div>
                <div className="text-sm">{searchTerm || selectedCategory ? 'נסה לשנות את קריטריוני החיפוש או הסינון' : 'הוסף מוצרים למאגר הברקודים עבור ספק זה'}</div>
              </div>
            ) : (
              <div className="divide-y">
                {filtered.map(p => (
                  <div key={p.barcode} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-sm text-muted-foreground flex gap-3 mt-1 items-center">
                        <span className="font-mono">ברקוד: {p.barcode}</span>
                        {p.unitPrice && <span className="text-green-600">₪{p.unitPrice}</span>}
                        {p.category && <Badge className="text-xs">{p.category}</Badge>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return modal;
};

export default SupplierProductsDialog;
