
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Building2 } from "lucide-react";

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

  // استخراج רשימת ספקים ייחודיים מהמאגר
  const suppliers = React.useMemo(() => {
    const supplierSet = new Set<string>();
    Object.values(barcodeDatabase).forEach(product => {
      if (product.supplier && product.supplier.trim()) {
        supplierSet.add(product.supplier.trim());
      }
    });
    return Array.from(supplierSet).sort();
  }, [barcodeDatabase]);

  // סינון ספקים לפי חיפוש
  const filteredSuppliers = React.useMemo(() => {
    if (!searchTerm.trim()) return suppliers;
    return suppliers.filter(supplier =>
      supplier.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [suppliers, searchTerm]);

  const handleSupplierClick = (supplierName: string) => {
    onSupplierSelected(supplierName);
  };

  const handleClose = () => {
    setSearchTerm("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent dir="rtl" className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            בחירת ספק להזמנה
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש ספק..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>

          <ScrollArea className="h-[400px] border rounded-md p-2">
            {filteredSuppliers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {suppliers.length === 0 
                  ? "לא נמצאו ספקים במאגר הברקודים"
                  : "לא נמצאו ספקים העונים לחיפוש"
                }
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSuppliers.map((supplier) => {
                  // ספירת מוצרים לספק
                  const productCount = Object.values(barcodeDatabase).filter(
                    product => product.supplier === supplier
                  ).length;

                  return (
                    <Button
                      key={supplier}
                      variant="ghost"
                      className="w-full justify-between h-auto p-4 text-right"
                      onClick={() => handleSupplierClick(supplier)}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-semibold">{supplier}</span>
                        <span className="text-sm text-muted-foreground">
                          {productCount} מוצרים במאגר
                        </span>
                      </div>
                    </Button>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-end">
            <Button variant="secondary" onClick={handleClose}>
              ביטול
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SupplierSelectionDialog;
