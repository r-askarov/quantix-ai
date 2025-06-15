
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Check, X, Plus, Package } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface ReceivingItem {
  id: string;
  product_name: string;
  ordered_quantity: number;
  received_quantity: number;
  notes?: string;
}

interface ReceivingDialogProps {
  open: boolean;
  onClose: () => void;
  orderId: string | null;
}

const ReceivingDialog: React.FC<ReceivingDialogProps> = ({
  open,
  onClose,
  orderId,
}) => {
  const [receivingItems, setReceivingItems] = React.useState<ReceivingItem[]>([]);
  const [deliveryNotes, setDeliveryNotes] = React.useState("");
  const [receivedBy, setReceivedBy] = React.useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: orderData, isLoading } = useQuery({
    queryKey: ['purchase-order', orderId],
    queryFn: async () => {
      if (!orderId) return null;
      
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers(name),
          purchase_order_items(*)
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!orderId && open
  });

  React.useEffect(() => {
    if (orderData?.purchase_order_items) {
      setReceivingItems(
        orderData.purchase_order_items.map(item => ({
          id: item.id,
          product_name: item.product_name,
          ordered_quantity: item.ordered_quantity,
          received_quantity: item.received_quantity || item.ordered_quantity,
          notes: item.notes || ""
        }))
      );
    }
  }, [orderData]);

  const updateReceivingMutation = useMutation({
    mutationFn: async () => {
      if (!orderId || !orderData) throw new Error('No order selected');
      
      // עדכון פריטי ההזמנה
      for (const item of receivingItems) {
        const { error } = await supabase
          .from('purchase_order_items')
          .update({
            received_quantity: item.received_quantity,
            notes: item.notes
          })
          .eq('id', item.id);

        if (error) throw error;

        // רישום שינויים בלוג אם יש הבדל
        if (item.received_quantity !== item.ordered_quantity) {
          await supabase
            .from('receiving_logs')
            .insert({
              purchase_order_id: orderId,
              action_type: 'quantity_change',
              product_name: item.product_name,
              original_quantity: item.ordered_quantity,
              new_quantity: item.received_quantity,
              reason: item.notes || 'עדכון כמות בקליטה'
            });
        }
      }

      // קביעת סטטוס חדש להזמנה
      const allReceived = receivingItems.every(item => item.received_quantity === item.ordered_quantity);
      const noneReceived = receivingItems.every(item => item.received_quantity === 0);
      
      let newStatus = 'partially_received';
      if (allReceived) newStatus = 'received';
      else if (noneReceived) newStatus = 'sent';

      // עדכון סטטוס ההזמנה
      const { error: orderError } = await supabase
        .from('purchase_orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // יצירת רשומת קליטה
      const { error: receiptError } = await supabase
        .from('delivery_receipts')
        .insert({
          purchase_order_id: orderId,
          received_by: receivedBy.trim() || null,
          delivery_notes: deliveryNotes.trim() || null
        });

      if (receiptError) throw receiptError;

      return newStatus;
    },
    onSuccess: (newStatus) => {
      queryClient.invalidateQueries({ queryKey: ['today-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order'] });
      
      toast({
        title: "קליטה הושלמה",
        description: `ההזמנה עודכנה לסטטוס: ${
          newStatus === 'received' ? 'התקבל במלואו' : 
          newStatus === 'partially_received' ? 'התקבל חלקית' : 'לא התקבל'
        }`,
      });
      
      resetForm();
      onClose();
    },
    onError: (error) => {
      console.error('Error updating receiving:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בעדכון הקליטה",
        variant: "destructive",
      });
    }
  });

  const updateItemQuantity = (itemId: string, quantity: number) => {
    setReceivingItems(items => 
      items.map(item => 
        item.id === itemId 
          ? { ...item, received_quantity: Math.max(0, quantity) }
          : item
      )
    );
  };

  const updateItemNotes = (itemId: string, notes: string) => {
    setReceivingItems(items => 
      items.map(item => 
        item.id === itemId 
          ? { ...item, notes }
          : item
      )
    );
  };

  const resetForm = () => {
    setReceivingItems([]);
    setDeliveryNotes("");
    setReceivedBy("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!orderData || isLoading) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent dir="rtl">
          <div className="text-center py-4">טוען...</div>
        </DialogContent>
      </Dialog>
    );
  }

  const totalOrdered = receivingItems.reduce((sum, item) => sum + item.ordered_quantity, 0);
  const totalReceived = receivingItems.reduce((sum, item) => sum + item.received_quantity, 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent dir="rtl" className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            קליטת סחורה - הזמנה #{orderData.order_number}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* פרטי ההזמנה */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">ספק: </span>
                <span className="font-semibold">{orderData.supplier.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">תאריך אספקה: </span>
                <span>{format(new Date(orderData.delivery_date), 'dd/MM/yyyy', { locale: he })}</span>
              </div>
              <div>
                <span className="text-muted-foreground">סטטוס נוכחי: </span>
                <Badge variant="outline">{orderData.status}</Badge>
              </div>
            </div>
          </div>

          {/* סיכום כמויות */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">סיכום כמויות</h3>
            <div className="flex justify-between items-center">
              <span>הוזמן: {totalOrdered} יחידות</span>
              <span>התקבל: {totalReceived} יחידות</span>
              <span className={`font-semibold ${totalReceived === totalOrdered ? 'text-green-600' : 'text-yellow-600'}`}>
                {totalReceived === totalOrdered ? 'התקבל במלואו' : `הפרש: ${totalReceived - totalOrdered}`}
              </span>
            </div>
          </div>

          {/* פריטי הקליטה */}
          <div className="space-y-4">
            <Label>פריטי הקליטה</Label>
            {receivingItems.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-3 p-4 border rounded-lg">
                <div className="col-span-4">
                  <div className="font-medium">{item.product_name}</div>
                </div>
                <div className="col-span-2 text-center">
                  <Label className="text-xs text-muted-foreground">הוזמן</Label>
                  <div className="font-medium">{item.ordered_quantity}</div>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">התקבל בפועל</Label>
                  <Input
                    type="number"
                    min="0"
                    value={item.received_quantity}
                    onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 0)}
                    className="text-center"
                  />
                </div>
                <div className="col-span-1 flex items-center justify-center">
                  {item.received_quantity === item.ordered_quantity ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <X className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div className="col-span-3">
                  <Label className="text-xs">הערות</Label>
                  <Input
                    value={item.notes || ""}
                    onChange={(e) => updateItemNotes(item.id, e.target.value)}
                    placeholder="הערות על הפריט"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* פרטי קליטה */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="receivedBy">התקבל על ידי</Label>
              <Input
                id="receivedBy"
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                placeholder="שם המקלט"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="deliveryNotes">הערות קליטה</Label>
            <Textarea
              id="deliveryNotes"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="הערות על הקליטה, נזקים, או הבדלים מההזמנה"
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="secondary" onClick={handleClose}>
            ביטול
          </Button>
          <Button 
            onClick={() => updateReceivingMutation.mutate()}
            disabled={updateReceivingMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            <Check className="w-4 h-4 ml-1" />
            אישור קליטה
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReceivingDialog;
