
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, Package, AlertCircle } from "lucide-react";
import { format, isToday } from "date-fns";
import { he } from "date-fns/locale";

interface TodayDeliveriesBoardProps {
  onStartReceiving: (orderId: string) => void;
}

interface DeliveryOrder {
  id: string;
  order_number: string;
  delivery_date: string;
  status: string;
  supplier: {
    name: string;
  };
  items_count: number;
}

const TodayDeliveriesBoard: React.FC<TodayDeliveriesBoardProps> = ({ onStartReceiving }) => {
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: deliveries, isLoading } = useQuery({
    queryKey: ['today-deliveries', today],
    queryFn: async () => {
      console.log('Fetching deliveries for date:', today);
      
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          id,
          order_number,
          delivery_date,
          status,
          supplier:suppliers(name),
          purchase_order_items(id)
        `)
        .eq('delivery_date', today)
        .in('status', ['sent', 'partially_received']);

      if (error) {
        console.error('Error fetching deliveries:', error);
        throw error;
      }

      return data?.map(order => ({
        ...order,
        items_count: order.purchase_order_items?.length || 0
      })) as DeliveryOrder[];
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="outline" className="bg-blue-50">ממתין לקליטה</Badge>;
      case 'partially_received':
        return <Badge variant="outline" className="bg-yellow-50">התקבל חלקית</Badge>;
      case 'received':
        return <Badge variant="outline" className="bg-green-50">התקבל</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card dir="rtl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            אספקות היום
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">טוען...</div>
        </CardContent>
      </Card>
    );
  }

  const pendingDeliveries = deliveries?.filter(d => d.status !== 'received') || [];

  return (
    <Card dir="rtl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="w-5 h-5" />
          אספקות היום
        </CardTitle>
        <CardDescription>
          הזמנות המיועדות לקליטה היום ({format(new Date(), 'dd/MM/yyyy', { locale: he })})
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pendingDeliveries.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            אין אספקות להיום או שכל האספקות נקלטו
          </div>
        ) : (
          <div className="space-y-4">
            {pendingDeliveries.map((delivery) => (
              <div 
                key={delivery.id}
                className="p-4 rounded-lg border border-orange-200 bg-orange-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{delivery.supplier.name}</h3>
                      {getStatusBadge(delivery.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>הזמנה #{delivery.order_number}</span>
                      <span className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        {delivery.items_count} פריטים
                      </span>
                      <span className="font-semibold text-orange-600">
                        {format(new Date(delivery.delivery_date), 'dd/MM/yyyy', { locale: he })}
                      </span>
                    </div>
                    {delivery.status !== 'received' && (
                      <div className="flex items-center gap-1 mt-2">
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-orange-600">
                          ממתין לקליטה
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => onStartReceiving(delivery.id)}
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      עבור לקליטה
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TodayDeliveriesBoard;
