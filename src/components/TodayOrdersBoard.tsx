
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, Plus, Edit, Star, Eye } from "lucide-react";
import { format, isToday, isBefore, addDays } from "date-fns";
import { he } from "date-fns/locale";
import OrderSummaryDialog from "./OrderSummaryDialog";

interface TodayOrdersBoardProps {
  onCreateOrder: (supplierId: string) => void;
}

interface SupplierWithOrder {
  id: string;
  name: string;
  deadline_hour: string;
  delivery_days: string[];
  existing_order?: {
    id: string;
    order_number: string;
    status: string;
    items_count?: number;
    total_amount?: number;
  };
}

const TodayOrdersBoard: React.FC<TodayOrdersBoardProps> = ({ onCreateOrder }) => {
  const [showOrderSummary, setShowOrderSummary] = React.useState(false);
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);
  
  const todayDay = format(new Date(), 'EEEE', { locale: he }).toLowerCase();
  const today = new Date();
  
  // מציאת ספקים שדורשים הזמנה היום
  const { data: suppliersData, isLoading } = useQuery({
    queryKey: ['suppliers-needing-orders', todayDay],
    queryFn: async () => {
      console.log('Fetching suppliers for day:', todayDay);
      
      const { data: suppliers, error } = await supabase
        .from('suppliers')
        .select('*');

      if (error) {
        console.error('Error fetching suppliers:', error);
        throw error;
      }

      // סינון ספקים לפי יום האספקה
      const relevantSuppliers = suppliers.filter(supplier => 
        supplier.delivery_days && supplier.delivery_days.includes(todayDay)
      );

      console.log('Relevant suppliers:', relevantSuppliers);

      // בדיקה האם יש הזמנות קיימות לספקים אלו
      const suppliersWithOrders: SupplierWithOrder[] = [];
      
      for (const supplier of relevantSuppliers) {
        const { data: existingOrder } = await supabase
          .from('purchase_orders')
          .select(`
            id, 
            order_number, 
            status,
            purchase_order_items(
              id,
              unit_price,
              ordered_quantity
            )
          `)
          .eq('supplier_id', supplier.id)
          .eq('delivery_date', format(addDays(today, 1), 'yyyy-MM-dd'))
          .single();

        let orderWithStats = undefined;
        if (existingOrder) {
          const items_count = existingOrder.purchase_order_items?.length || 0;
          const total_amount = existingOrder.purchase_order_items?.reduce((sum, item) => {
            return sum + ((item.unit_price || 0) * (item.ordered_quantity || 0));
          }, 0) || 0;

          orderWithStats = {
            id: existingOrder.id,
            order_number: existingOrder.order_number,
            status: existingOrder.status,
            items_count,
            total_amount
          };
        }

        suppliersWithOrders.push({
          ...supplier,
          existing_order: orderWithStats
        });
      }

      return suppliersWithOrders;
    }
  });

  const handleViewOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowOrderSummary(true);
  };

  const isDeadlineNear = (deadlineHour: string) => {
    const now = new Date();
    const [hours, minutes] = deadlineHour.split(':').map(Number);
    const deadline = new Date(now);
    deadline.setHours(hours, minutes, 0, 0);
    
    const diffInMinutes = (deadline.getTime() - now.getTime()) / (1000 * 60);
    return diffInMinutes <= 60 && diffInMinutes > 0; // שעה לפני הדדליין
  };

  const isDeadlinePassed = (deadlineHour: string) => {
    const now = new Date();
    const [hours, minutes] = deadlineHour.split(':').map(Number);
    const deadline = new Date(now);
    deadline.setHours(hours, minutes, 0, 0);
    
    return now > deadline;
  };

  if (isLoading) {
    return (
      <Card dir="rtl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            הזמנות לביצוע היום
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">טוען...</div>
        </CardContent>
      </Card>
    );
  }

  // הצגת כל הספקים כולל אלו עם הזמנות בטיוטה או שנשלחו
  const allSuppliers = suppliersData || [];

  return (
    <>
      <Card dir="rtl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            הזמנות לביצוע היום
          </CardTitle>
          <CardDescription>
            ספקים הדורשים הזמנה לאספקה מחר ({format(addDays(today, 1), 'dd/MM/yyyy', { locale: he })})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allSuppliers.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              אין הזמנות שדורשות ביצוע היום
            </div>
          ) : (
            <div className="space-y-4">
              {allSuppliers.map((supplier) => {
                const nearDeadline = isDeadlineNear(supplier.deadline_hour);
                const passedDeadline = isDeadlinePassed(supplier.deadline_hour);
                const hasOrder = supplier.existing_order;
                const isDraft = hasOrder?.status === 'draft';
                const isSent = hasOrder?.status === 'sent';
                
                return (
                  <div 
                    key={supplier.id}
                    className={`p-4 rounded-lg border ${
                      passedDeadline ? 'border-red-200 bg-red-50' : 
                      nearDeadline ? 'border-yellow-200 bg-yellow-50' : 
                      isDraft ? 'border-blue-200 bg-blue-50' :
                      isSent ? 'border-green-200 bg-green-50' :
                      'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{supplier.name}</h3>
                          {isDraft && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-700 flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              טיוטה
                            </Badge>
                          )}
                          {isSent && (
                            <Badge variant="outline" className="bg-green-100 text-green-700">
                              נשלח
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm text-muted-foreground">
                            דדליין: {supplier.deadline_hour}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            אספקה: {format(addDays(today, 1), 'dd/MM', { locale: he })}
                          </span>
                          {hasOrder && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>הזמנה #{hasOrder.order_number}</span>
                              <span>• {hasOrder.items_count || 0} פריטים</span>
                              <span>• ₪{(hasOrder.total_amount || 0).toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                        {(nearDeadline || passedDeadline) && !isSent && (
                          <div className="flex items-center gap-1 mt-2">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-red-600">
                              {passedDeadline ? 'הדדליין עבר!' : 'דדליין קרב!'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {hasOrder && (
                          <Button
                            onClick={() => handleViewOrder(hasOrder.id)}
                            size="sm"
                            variant="outline"
                          >
                            <Eye className="w-4 h-4 ml-1" />
                            צפה בהזמנה
                          </Button>
                        )}
                        {!isSent && (
                          <Button
                            onClick={() => onCreateOrder(supplier.id)}
                            size="sm"
                            variant={hasOrder ? "outline" : "default"}
                          >
                            {hasOrder ? (
                              <>
                                <Edit className="w-4 h-4 ml-1" />
                                ערוך הזמנה
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4 ml-1" />
                                צור הזמנה
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <OrderSummaryDialog
        open={showOrderSummary}
        onClose={() => setShowOrderSummary(false)}
        orderId={selectedOrderId}
      />
    </>
  );
};

export default TodayOrdersBoard;
