
import * as React from "react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";

// נתוני דמו של מוצרים
const products = [
  { barcode: "7290001234567", name: "מברגה בוש", quantity: 13, supplier: "חשמל יצחק" },
  { barcode: "7290009876541", name: "סרט מדידה 5 מטר", quantity: 34, supplier: "י.א. בניה" },
  { barcode: "7290001122445", name: "פלייר מקצועי", quantity: 28, supplier: "כלי-ברזל בע\"מ" },
  { barcode: "7290009988776", name: "מברשת צבע", quantity: 56, supplier: "ספק מבנים" },
  { barcode: "7290008765432", name: "מסור ידני", quantity: 2, supplier: "כלי-ברזל בע\"מ" },
];

const ProductsTable = () => {
  return (
    <div className="overflow-x-auto rounded-md border bg-card shadow">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">ברקוד</TableHead>
            <TableHead className="text-right">שם מוצר</TableHead>
            <TableHead className="text-right">כמות</TableHead>
            <TableHead className="text-right">ספק</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                לא נמצאו מוצרים.
              </TableCell>
            </TableRow>
          ) : (
            products.map((p) => (
              <TableRow key={p.barcode}>
                <TableCell className="font-mono">{p.barcode}</TableCell>
                <TableCell>{p.name}</TableCell>
                <TableCell className={p.quantity === 0 ? "text-red-600 font-bold" : ""}>{p.quantity}</TableCell>
                <TableCell>{p.supplier}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProductsTable;
