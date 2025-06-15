
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Star, Calendar, Building2 } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface AllOrdersTableProps {
  onViewOrder: (orderId: string) => void;
}

interface OrderWithSupplier {
  id: string;
  order_number: string;
  status: string;
  delivery_date: string;
  created_at: string;
  notes?: string;
  supplier: {
    name: string;
  };
  purchase_order_items: Array<{
    id: string;
    product_name: string;
    ordered_quantity: number;
  }>;
}

const AllOrdersTable: React.FC<AllOrdersTableProps> = ({ onViewOrder }) => {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['all-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          id,
          order_number,
          status,
          delivery_date,
          created_at,
          notes,
          supplier:suppliers(name),
          purchase_order_items(
            id,
            product_name,
            ordered_quantity
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all orders:', error);
        throw error;
      }

      return data as OrderWithSupplier[];
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-700 flex items-center gap-1">
            <Star className="w-3 h-3" />
            טיוטה
          </Badge>
        );
      case 'sent':
        return <Badge variant="outline" className="bg-green-100 text-green-700">נשלח</Badge>;
      case 'partially_received':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-700">התקבל חלקית</Badge>;
      case 'received':
        return <Badge variant="outline" className="bg-gray-100 text-gray-700">התקבל</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTotalItems = (items: Array<{ ordered_quantity: number }>) => {
    return items.reduce((sum, item) => sum + item.ordered_quantity, 0);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">טוען...</div>
        </CardContent>
      </Card>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            אין הזמנות במערכת
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          כל ההזמנות והטיוטות ({orders.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">מספר הזמנה</TableHead>
              <TableHead className="text-right">ספק</TableHead>
              <TableHead className="text-right">סטטוס</TableHead>
              <TableHead className="text-right">תאריך אספקה</TableHead>
              <TableHead className="text-right">פריטים</TableHead>
              <TableHead className="text-right">תאריך יצירה</TableHead>
              <TableHead className="text-right">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">
                  {order.order_number}
                </TableCell>
                <TableCell>{order.supplier.name}</TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {format(new Date(order.delivery_date), 'dd/MM/yyyy', { locale: he })}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {order.purchase_order_items.length} מוצרים
                    <br />
                    <span className="text-muted-foreground">
                      סה"כ: {getTotalItems(order.purchase_order_items)} יחידות
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewOrder(order.id)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    צפייה
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AllOrdersTable;
