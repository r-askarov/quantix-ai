
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import QRCodeGenerator from "./QRCodeGenerator";
import { Plus, Trash2 } from "lucide-react";

interface OrderItem {
  name: string;
  quantity: number;
}

interface CreateOrderDialogProps {
  open: boolean;
  onClose: () => void;
}

const CreateOrderDialog: React.FC<CreateOrderDialogProps> = ({
  open,
  onClose,
}) => {
  const [supplierName, setSupplierName] = React.useState("");
  const [orderItems, setOrderItems] = React.useState<OrderItem[]>([{ name: "", quantity: 1 }]);
  const [notes, setNotes] = React.useState("");
  const [showQRCode, setShowQRCode] = React.useState(false);
  const [createdOrder, setCreatedOrder] = React.useState<any>(null);

  const addItem = () => {
    setOrderItems([...orderItems, { name: "", quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof OrderItem, value: string | number) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    setOrderItems(updated);
  };

  const handleSubmit = () => {
    // יצירת מספר הזמנה ייחודי
    const orderId = `ORD-${Date.now()}`;
    const orderDate = new Date().toLocaleDateString('he-IL');
    
    // סינון פריטים עם שם
    const validItems = orderItems.filter(item => item.name.trim() !== "");
    
    if (!supplierName.trim() || validItems.length === 0) {
      alert("נא למלא את שם הספק ולהוסיף לפחות פריט אחד");
      return;
    }

    const orderData = {
      orderId,
      supplierName,
      items: validItems,
      orderDate,
      notes
    };

    setCreatedOrder(orderData);
    setShowQRCode(true);
    
    console.log("הזמנה נוצרה:", orderData);
  };

  const resetForm = () => {
    setSupplierName("");
    setOrderItems([{ name: "", quantity: 1 }]);
    setNotes("");
    setCreatedOrder(null);
    setShowQRCode(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>יצירת הזמנה חדשה לספק</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* בחירת ספק */}
            <div className="space-y-2">
              <Label htmlFor="supplier">שם הספק</Label>
              <Input
                id="supplier"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="הזן שם הספק"
              />
            </div>

            {/* פריטי ההזמנה */}
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
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label>שם הפריט</Label>
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                      placeholder="שם הפריט"
                    />
                  </div>
                  <div className="w-24">
                    <Label>כמות</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
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
              ))}
            </div>

            {/* הערות */}
            <div className="space-y-2">
              <Label htmlFor="notes">הערות (אופציונלי)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="הערות נוספות להזמנה"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="secondary" onClick={handleClose}>
              ביטול
            </Button>
            <Button onClick={handleSubmit}>
              צור הזמנה ו-QR Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      {createdOrder && (
        <QRCodeGenerator
          open={showQRCode}
          onClose={() => {
            setShowQRCode(false);
            handleClose();
          }}
          orderData={createdOrder}
        />
      )}
    </>
  );
};

export default CreateOrderDialog;
