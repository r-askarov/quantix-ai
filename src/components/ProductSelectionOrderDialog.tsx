
import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Search, Save, Send } from "lucide-react";
import { format, addDays } from "date-fns";
import { he } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface BarcodeProduct {
  barcode: string;
  name: string;
  supplier: string;
  unitPrice?: number;
  category?: string;
}

interface OrderItem {
  barcode: string;
  product_name: string;
  ordered_quantity: number;
  unit_price?: number;
  notes?: string;
}

interface ProductSelectionOrderDialogProps {
  open: boolean;
  onClose: () => void;
  supplierName: string | null;
  barcodeDatabase: Record<string, BarcodeProduct>;
}

const ProductSelectionOrderDialog: React.FC<ProductSelectionOrderDialogProps> = ({
  open,
  onClose,
  supplierName,
  barcodeDatabase,
}) => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [orderItems, setOrderItems] = React.useState<Record<string, OrderItem>>({});
  const [globalNotes, setGlobalNotes] = React.useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // מוצרים של הספק הנבחר
  const supplierProducts = React.useMemo(() => {
    if (!supplierName) return [];
    return Object.entries(barcodeDatabase)
      .filter(([_, product]) => product.supplier === supplierName)
      .map(([barcode, product]) => ({ ...product, barcode }));
  }, [barcodeDatabase, supplierName]);

  // קטגוריות זמינות
  const categories = React.useMemo(() => {
    const categorySet = new Set<string>();
    supplierProducts.forEach(product => {
      if (product.category && product.category.trim()) {
        categorySet.add(product.category.trim());
      }
    });
    return Array.from(categorySet).sort();
  }, [supplierProducts]);

  // מוצרים מסוננים
  const filteredProducts = React.useMemo(() => {
    let filtered = supplierProducts;
    
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    if (searchTerm.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode.includes(searchTerm)
      );
    }
    
    return filtered;
  }, [supplierProducts, selectedCategory, searchTerm]);

  const updateQuantity = (barcode: string, product: BarcodeProduct, quantity: number) => {
    if (quantity <= 0) {
      const newItems = { ...orderItems };
      delete newItems[barcode];
      setOrderItems(newItems);
    } else {
      setOrderItems(prev => ({
        ...prev,
        [barcode]: {
          barcode,
          product_name: product.name,
          ordered_quantity: quantity,
          unit_price: product.unitPrice,
          notes: prev[barcode]?.notes || ""
        }
      }));
    }
  };

  const updateItemNotes = (barcode: string, notes: string) => {
    setOrderItems(prev => ({
      ...prev,
      [barcode]: {
        ...prev[barcode],
        notes
      }
    }));
  };

  const createOrderMutation = useMutation({
    mutationFn: async ({ isDraft }: { isDraft: boolean }) => {
      if (!supplierName) throw new Error('לא נבחר ספק');
      
      const itemsToOrder = Object.values(orderItems);
      if (itemsToOrder.length === 0) {
        throw new Error('נא לבחור לפחות מוצר אחד להזמנה');
      }

      // יצירת מספר הזמנה
      const orderNumber = `PO-${Date.now()}`;
      const deliveryDate = format(addDays(new Date(), 1), 'yyyy-MM-dd');
      
      // חיפוש או יצירת ספק במערכת
      let supplier;
      const { data: existingSupplier } = await supabase
        .from('suppliers')
        .select('*')
        .eq('name', supplierName)
        .single();

      if (existingSupplier) {
        supplier = existingSupplier;
      } else {
        // יצירת ספק חדש אם לא קיים
        const { data: newSupplier, error: supplierError } = await supabase
          .from('suppliers')
          .insert({
            name: supplierName,
            delivery_days: ['sunday'], // ברירת מחדל
            deadline_hour: '10:00'
          })
          .select()
          .single();

        if (supplierError) throw supplierError;
        supplier = newSupplier;
      }

      // יצירת הזמנה
      const { data: order, error: orderError } = await supabase
        .from('purchase_orders')
        .insert({
          order_number: orderNumber,
          supplier_id: supplier.id,
          delivery_date: deliveryDate,
          status: isDraft ? 'draft' : 'sent',
          notes: globalNotes.trim() || null
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // הוספת פריטים להזמנה
      const itemsToInsert = itemsToOrder.map(item => ({
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

  const resetForm = () => {
    setOrderItems({});
    setGlobalNotes("");
    setSearchTerm("");
    setSelectedCategory(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const totalItems = Object.keys(orderItems).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent dir="rtl" className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>בחירת מוצרים להזמנה - {supplierName}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* כלי סינון וחיפוש */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חיפוש מוצר..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                הכל
              </Button>
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* סיכום הזמנה */}
          {totalItems > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-green-800">
                  נבחרו {totalItems} מוצרים להזמנה
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOrderItems({})}
                >
                  נקה הכל
                </Button>
              </div>
            </div>
          )}

          {/* רשימת מוצרים */}
          <ScrollArea className="flex-1 border rounded-lg">
            <div className="p-4 space-y-3">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  לא נמצאו מוצרים העונים לקריטריונים
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const currentQuantity = orderItems[product.barcode]?.ordered_quantity || 0;
                  
                  return (
                    <div key={product.barcode} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold">{product.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>ברקוד: {product.barcode}</span>
                            {product.unitPrice && (
                              <span>מחיר: ₪{product.unitPrice}</span>
                            )}
                            {product.category && (
                              <Badge variant="outline">{product.category}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(product.barcode, product, currentQuantity - 1)}
                            disabled={currentQuantity <= 0}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {currentQuantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(product.barcode, product, currentQuantity + 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {currentQuantity > 0 && (
                        <div className="mt-2">
                          <Label className="text-sm">הערה למוצר זה:</Label>
                          <Input
                            placeholder="הערות אופציונליות..."
                            value={orderItems[product.barcode]?.notes || ""}
                            onChange={(e) => updateItemNotes(product.barcode, e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* הערות כלליות */}
          <div className="space-y-2">
            <Label htmlFor="notes">הערות כלליות להזמנה</Label>
            <Textarea
              id="notes"
              value={globalNotes}
              onChange={(e) => setGlobalNotes(e.target.value)}
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
            disabled={createOrderMutation.isPending || totalItems === 0}
          >
            <Save className="w-4 h-4 ml-1" />
            שמור טיוטה
          </Button>
          <Button 
            onClick={() => createOrderMutation.mutate({ isDraft: false })}
            disabled={createOrderMutation.isPending || totalItems === 0}
          >
            <Send className="w-4 h-4 ml-1" />
            שלח הזמנה
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductSelectionOrderDialog;
