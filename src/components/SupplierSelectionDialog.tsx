import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface BarcodeProduct {
  barcode: string;
  name: string;
  supplier: string;
  unitPrice?: number;
  category?: string;
}

interface SupplierSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSupplierSelected: (supplierName: string) => void;
  barcodeDatabase: Record<string, BarcodeProduct>;
}

const SupplierSelectionDialog: React.FC<SupplierSelectionDialogProps> = ({
  open,
  onClose,
  onSupplierSelected,
  barcodeDatabase,
}) => {
  const [searchTerm, setSearchTerm] = React.useState("");

  // Extract unique suppliers from barcode database
  const suppliers = React.useMemo(() => {
    const uniqueSuppliers = new Set<string>();
    Object.values(barcodeDatabase).forEach((product: any) => {
      if (product.supplier) {
        uniqueSuppliers.add(product.supplier);
      }
    });
    return Array.from(uniqueSuppliers).sort();
  }, [barcodeDatabase]);

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const modal = open
    ? createPortal(
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 99999 }}>
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
            aria-hidden
          />
          <div className="relative bg-white p-6 rounded shadow w-full max-w-md mx-4" dir="rtl" role="dialog" aria-modal="true">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">בחר ספק</h2>
              <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <Input
                placeholder="חפש ספק..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-4"
              />

              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredSuppliers.length > 0 ? (
                  filteredSuppliers.map((supplier) => (
                    <Button
                      key={supplier}
                      onClick={() => {
                        onSupplierSelected(supplier);
                        setSearchTerm("");
                      }}
                      variant="outline"
                      className="w-full text-right"
                    >
                      {supplier}
                    </Button>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    לא נמצאו ספקים
                  </p>
                )}
              </div>

              <Button variant="outline" onClick={onClose} className="w-full">
                ביטול
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return modal;
};

export default SupplierSelectionDialog;
