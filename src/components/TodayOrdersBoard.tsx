import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Star, Eye, Plus } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface TodayOrdersBoardProps {
  onCreateOrder: (supplierId: string) => void;
  onViewOrder: (orderId: string) => void;
}

interface SupplierWithOrders {
  id: string;
  name: string;
  deadline_hour: string;
  purchase_orders: Array<{
    id: string;
    order_number: string;
    status: string;
    created_at: string;
    purchase_order_items: Array<{
      id: string;
      product_name: string;
      ordered_quantity: number;
    }>;
  }>;
}

const TodayOrdersBoard: React.FC<TodayOrdersBoardProps> = ({ onCreateOrder, onViewOrder }) => {
  const getCurrentDayOfWeek = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = new Date();
    return days[today.getDay()];
  };

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers-with-orders', getCurrentDayOfWeek()],
    queryFn: async () => {
      const currentDay = getCurrentDayOfWeek();
      const { data, error } = await supabase
        .from('suppliers')
        .select(`
          id,
          name,
          deadline_hour,
          purchase_orders(
            id,
            order_number,
            status,
            created_at,
            purchase_order_items(
              id,
              product_name,
              ordered_quantity
            )
          )
        `)
        .contains('order_days', [currentDay])
        .order('deadline_hour', { ascending: true });

      if (error) {
        console.error('Error fetching suppliers:', error);
        throw error;
      }

      return data as SupplierWithOrders[];
    },
  });

  const getTotalItems = (items: Array<{ ordered_quantity: number }>) => {
    return items.reduce((sum, item) => sum + item.ordered_quantity, 0);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <CalendarDays className="w-5 h-5" />
            הזמנות שיש לבצע היום
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">טוען...</div>
        </CardContent>
      </Card>
    );
  }

  if (!suppliers || suppliers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <CalendarDays className="w-5 h-5" />
            הזמנות שיש לבצע היום
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            אין ספקים שדורשים הזמנה היום
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700">
          <CalendarDays className="w-5 h-5" />
          הזמנות שיש לבצע היום ({suppliers.length} ספקים)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-lg">{supplier.name}</h3>
                <Badge variant="outline" className="text-xs">
                  מועד סגירה: {supplier.deadline_hour}
                </Badge>
              </div>
              <Button
                onClick={() => onCreateOrder(supplier.id)}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <Plus className="w-4 h-4 ml-1" />
                הזמנה חדשה
              </Button>
            </div>

            {supplier.purchase_orders.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-medium text-gray-600 mb-2">
                  טיוטות קיימות ({supplier.purchase_orders.length}):
                </h4>
                <div className="space-y-2">
                  {supplier.purchase_orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between bg-white p-3 rounded border">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-blue-100 text-blue-700 flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          טיוטה
                        </Badge>
                        <span className="font-medium">{order.order_number}</span>
                        <span className="text-sm text-gray-500">
                          {order.purchase_order_items.length} מוצרים | 
                          {getTotalItems(order.purchase_order_items)} יחידות
                        </span>
                        <span className="text-xs text-gray-400">
                          נוצר: {format(new Date(order.created_at), 'dd/MM HH:mm', { locale: he })}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewOrder(order.id)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        צפייה
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default TodayOrdersBoard;
