
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText, Calendar, User, Package, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface OrderSummaryDialogProps {
  open: boolean;
  onClose: () => void;
  orderId: string | null;
}

interface OrderDetails {
  id: string;
  order_number: string;
  status: string;
  delivery_date: string;
  notes?: string;
  created_at: string;
  supplier: {
    name: string;
    contact_email?: string;
    contact_phone?: string;
  };
  purchase_order_items: Array<{
    id: string;
    product_name: string;
    ordered_quantity: number;
    unit_price?: number;
    notes?: string;
  }>;
}

const OrderSummaryDialog: React.FC<OrderSummaryDialogProps> = ({
  open,
  onClose,
  orderId,
}) => {
  const { data: orderData, isLoading } = useQuery({
    queryKey: ['order-summary', orderId],
    queryFn: async () => {
      if (!orderId) return null;

      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          id,
          order_number,
          status,
          delivery_date,
          notes,
          created_at,
          supplier:suppliers(
            name,
            contact_email,
            contact_phone
          ),
          purchase_order_items(
            id,
            product_name,
            ordered_quantity,
            unit_price,
            notes
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('Error fetching order details:', error);
        throw error;
      }

      return data as OrderDetails;
    },
    enabled: !!orderId && open,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-blue-100 text-blue-700">טיוטה</Badge>;
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

  const calculateTotalAmount = () => {
    if (!orderData?.purchase_order_items) return 0;
    return orderData.purchase_order_items.reduce((sum, item) => {
      return sum + ((item.unit_price || 0) * item.ordered_quantity);
    }, 0);
  };

  if (!open || !orderId) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            סיכום הזמנה
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">טוען...</div>
        ) : orderData ? (
          <div className="space-y-6">
            {/* פרטי הזמנה בסיסיים */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    פרטי הזמנה
                  </div>
                  {getStatusBadge(orderData.status)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">מספר הזמנה:</span>
                    <p className="font-semibold">{orderData.order_number}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">ספק:</span>
                    <p className="font-semibold">{orderData.supplier.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">תאריך אספקה:</span>
                    <p className="font-semibold">
                      {format(new Date(orderData.delivery_date), 'dd/MM/yyyy', { locale: he })}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">תאריך יצירה:</span>
                    <p className="font-semibold">
                      {format(new Date(orderData.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                    </p>
                  </div>
                </div>
                
                {orderData.supplier.contact_email && (
                  <div>
                    <span className="text-sm text-muted-foreground">אימייל ספק:</span>
                    <p className="font-semibold">{orderData.supplier.contact_email}</p>
                  </div>
                )}
                
                {orderData.supplier.contact_phone && (
                  <div>
                    <span className="text-sm text-muted-foreground">טלפון ספק:</span>
                    <p className="font-semibold">{orderData.supplier.contact_phone}</p>
                  </div>
                )}

                {orderData.notes && (
                  <div>
                    <span className="text-sm text-muted-foreground">הערות:</span>
                    <p className="font-semibold">{orderData.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* פריטי ההזמנה */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  פריטי ההזמנה ({orderData.purchase_order_items.length} פריטים)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orderData.purchase_order_items.map((item, index) => (
                    <div key={item.id}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{item.product_name}</h4>
                          {item.notes && (
                            <p className="text-sm text-muted-foreground">{item.notes}</p>
                          )}
                        </div>
                        <div className="text-left space-y-1">
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">
                              כמות: {item.ordered_quantity}
                            </span>
                            {item.unit_price && (
                              <>
                                <span className="text-sm text-muted-foreground">
                                  מחיר יחידה: ₪{item.unit_price.toFixed(2)}
                                </span>
                                <span className="font-semibold">
                                  סה"כ: ₪{(item.unit_price * item.ordered_quantity).toFixed(2)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {index < orderData.purchase_order_items.length - 1 && (
                        <Separator className="mt-3" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* סיכום כספי */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  סיכום כספי
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>סה"כ הזמנה:</span>
                  <span>₪{calculateTotalAmount().toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            לא ניתן לטעון את פרטי ההזמנה
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OrderSummaryDialog;
