
import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { ShippingItem } from "@/pages/Orders";

interface ShippingComparisonTableProps {
  items: ShippingItem[];
}

const ShippingComparisonTable: React.FC<ShippingComparisonTableProps> = ({ items }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'match':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'missing':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'extra':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'match':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">תואם</Badge>;
      case 'missing':
        return <Badge variant="destructive">חסר במלאי</Badge>;
      case 'extra':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">לא במלאי</Badge>;
      default:
        return <Badge variant="outline">לא ידוע</Badge>;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'match':
        return 'המוצר קיים במלאי בכמות מספקת';
      case 'missing':
        return 'המוצר קיים במלאי אך לא בכמות מספקת';
      case 'extra':
        return 'המוצר לא נמצא במלאי הקיים';
      default:
        return '';
    }
  };

  const matchCount = items.filter(item => item.status === 'match').length;
  const missingCount = items.filter(item => item.status === 'missing').length;
  const extraCount = items.filter(item => item.status === 'extra').length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">תוצאות השוואת תעודת המשלוח</h2>
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-green-500" />
            תואם: {matchCount}
          </span>
          <span className="flex items-center gap-1">
            <XCircle className="h-4 w-4 text-red-500" />
            חסר: {missingCount}
          </span>
          <span className="flex items-center gap-1">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            לא במלאי: {extraCount}
          </span>
        </div>
      </div>

      <div className="rounded-xl bg-card shadow border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">סטטוס</TableHead>
              <TableHead className="text-right">שם המוצר</TableHead>
              <TableHead className="text-right">כמות</TableHead>
              <TableHead className="text-right">הערות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="flex items-center gap-2">
                  {getStatusIcon(item.status)}
                  {getStatusBadge(item.status)}
                </TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {getStatusText(item.status)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {missingCount > 0 || extraCount > 0 ? (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>שים לב:</strong> יש {missingCount + extraCount} אי התאמות בין תעודת המשלוח למלאי הקיים.
            אנא בדוק את הפריטים המסומנים.
          </p>
        </div>
      ) : (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>מצוין!</strong> כל הפריטים בתעודת המשלוח תואמים למלאי הקיים.
          </p>
        </div>
      )}
    </div>
  );
};

export default ShippingComparisonTable;
