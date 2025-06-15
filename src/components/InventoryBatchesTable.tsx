
import * as React from "react";
import { InventoryBatch } from "@/types/inventory";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { format } from "date-fns";

interface Props {
  batches: InventoryBatch[];
}

export default function InventoryBatchesTable({ batches }: Props) {
  // שליחת בקשת פיפו בכל רינדור (מומלץ לשלוח ב-useEffect)
  React.useEffect(() => {
    fetch("/api/pipu").catch(() => {});
  }, []);

  return (
    <div className="overflow-x-auto rounded-md border bg-card shadow">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ברקוד</TableHead>
            <TableHead>שם מוצר</TableHead>
            <TableHead>תוקף</TableHead>
            <TableHead>כמות</TableHead>
            <TableHead>ספק</TableHead>
            <TableHead>תאריך תפוגה</TableHead>
            <TableHead>מחיר יח'</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">לא קיימות רשומות מלאי.</TableCell>
            </TableRow>
          ) : (
            batches.map((batch) => (
              <TableRow key={batch.id}>
                <TableCell className="font-mono">{batch.barcode}</TableCell>
                <TableCell>{batch.product_name}</TableCell>
                <TableCell>
                  {batch.expiry_date ? format(new Date(batch.expiry_date), "dd/MM/yyyy") : <span className="text-gray-400">—</span>}
                </TableCell>
                <TableCell>{batch.quantity}</TableCell>
                <TableCell>{batch.supplier || ""}</TableCell>
                {/* תאריך תפוגה במקום קבלה */}
                <TableCell>
                  {batch.expiry_date ? format(new Date(batch.expiry_date), "dd/MM/yyyy") : ""}
                </TableCell>
                <TableCell>{Number(batch.unit_price).toLocaleString("he-IL")} ₪</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
