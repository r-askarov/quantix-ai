
import * as React from "react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import type { Product } from "../pages/Products";
import { format } from "date-fns";

// נוסיף טיפוס שגם שדה הערות אפשרי:
interface ProductsTableProps {
  products: (Product & { remarks?: string })[];
}

const ProductsTable: React.FC<ProductsTableProps> = ({ products }) => {
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
            <TableHead className="text-right">הערות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
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
                    {p.remarks
                      ? p.remarks
                      : (p.expiryDate
                          ? (() => { try { return format(new Date(p.expiryDate), "dd/MM/yyyy"); } catch { return "שגוי"; } })()
                          : "אין")}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProductsTable;
