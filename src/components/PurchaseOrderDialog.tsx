
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Send, Save } from "lucide-react";
import { format, addDays } from "date-fns";
import { he } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface OrderItem {
  product_name: string;
  ordered_quantity: number;
  unit_price?: number;
  notes?: string;
}

interface PurchaseOrderDialogProps {
  open: boolean;
  onClose: () => void;
  supplierId: string | null;
}

const PurchaseOrderDialog: React.FC<PurchaseOrderDialogProps> = ({
  open,
  onClose,
  supplierId,
}) => {
  const [orderItems, setOrderItems] = React.useState<OrderItem[]>([
    { product_name: "", ordered_quantity: 1 }
  ]);
  const [notes, setNotes] = React.useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: supplier } = useQuery({
    queryKey: ['supplier', supplierId],
    queryFn: async () => {
      if (!supplierId) return null;
      
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', supplierId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!supplierId
  });

  const createOrderMutation = useMutation({
    mutationFn: async ({ isDraft }: { isDraft: boolean }) => {
      if (!supplierId) throw new Error('No supplier selected');
      
      const validItems = orderItems.filter(item => item.product_name.trim() !== "");
      if (validItems.length === 0) {
        throw new Error('נא להוסיף לפחות פריט אחד');
      }

      const orderNumber = `PO-${Date.now()}`;
      const deliveryDate = format(addDays(new Date(), 1), 'yyyy-MM-dd');
      
      const { data: order, error: orderError } = await supabase
        .from('purchase_orders')
        .insert({
          order_number: orderNumber,
          supplier_id: supplierId,
          delivery_date: deliveryDate,
          status: isDraft ? 'draft' : 'sent',
          notes: notes.trim() || null
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const itemsToInsert = validItems.map(item => ({
        purchase_order_id: order.id,
        product_name: item.product_name,
        ordered_quantity: item.ordered_quantity,
        unit_price: item.unit_price || null,
        notes: item.notes || null
      }));

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      return order;
    },
    onSuccess: (order, { isDraft }) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers-needing-orders'] });
      queryClient.invalidateQueries({ queryKey: ['today-deliveries'] });
      
      toast({
        title: isDraft ? "טיוטה נשמרה" : "הזמנה נשלחה",
        description: `הזמנה ${order.order_number} ${isDraft ? 'נשמרה כטיוטה' : 'נשלחה לספק'} בהצלחה`,
      });
      
      resetForm();
      onClose();
    },
    onError: (error) => {
      console.error('Error creating order:', error);
      toast({
        title: "שגיאה",
        description: error.message || "שגיאה ביצירת ההזמנה",
        variant: "destructive",
      });
    }
  });

  const addItem = () => {
    setOrderItems([...orderItems, { product_name: "", ordered_quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof OrderItem, value: string | number) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    setOrderItems(updated);
  };

  const resetForm = () => {
    setOrderItems([{ product_name: "", ordered_quantity: 1 }]);
    setNotes("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!supplier) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent dir="rtl" className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>יצירת הזמנת רכש - {supplier.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">פרטי הספק</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">שם: </span>
                <span>{supplier.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">דדליין: </span>
                <span>{supplier.deadline_hour}</span>
              </div>
              <div>
                <span className="text-muted-foreground">תאריך אספקה: </span>
                <span>{format(addDays(new Date(), 1), 'dd/MM/yyyy', { locale: he })}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>פריטי ההזמנה</Label>
              <Button 
                type="button" 
                onClick={addItem}
                size="sm"
                variant="outline"
              >
                <Plus className="w-4 h-4 ml-1" />
                הוסף פריט
              </Button>
            </div>
            
            {orderItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg">
                <div className="col-span-4">
                  <Label>שם הפריט</Label>
                  <Input
                    value={item.product_name}
                    onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                    placeholder="שם הפריט"
                  />
                </div>
                <div className="col-span-2">
                  <Label>כמות</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.ordered_quantity}
                    onChange={(e) => updateItem(index, 'ordered_quantity', parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="col-span-2">
                  <Label>מחיר יחידה</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.unit_price || ""}
                    onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || undefined)}
                    placeholder="0.00"
                  />
                </div>
                <div className="col-span-3">
                  <Label>הערות</Label>
                  <Input
                    value={item.notes || ""}
                    onChange={(e) => updateItem(index, 'notes', e.target.value)}
                    placeholder="הערות"
                  />
                </div>
                <div className="col-span-1">
                  {orderItems.length > 1 && (
                    <Button 
                      type="button"
                      onClick={() => removeItem(index)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">הערות כלליות</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="הערות נוספות להזמנה"
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={handleClose}>
            ביטול
          </Button>
          <Button 
            variant="outline"
            onClick={() => createOrderMutation.mutate({ isDraft: true })}
            disabled={createOrderMutation.isPending}
          >
            <Save className="w-4 h-4 ml-1" />
            שמור טיוטה
          </Button>
          <Button 
            onClick={() => createOrderMutation.mutate({ isDraft: false })}
            disabled={createOrderMutation.isPending}
          >
            <Send className="w-4 h-4 ml-1" />
            שלח הזמנה
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseOrderDialog;
