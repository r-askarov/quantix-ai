
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import QRCode from "qrcode";

interface QRCodeGeneratorProps {
  open: boolean;
  onClose: () => void;
  orderData: {
    orderId: string;
    supplierName: string;
    items: Array<{
      name: string;
      quantity: number;
    }>;
    orderDate: string;
  };
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  open,
  onClose,
  orderData,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);

  const generateQRCode = React.useCallback(async () => {
    setLoading(true);
    try {
      // יצירת נתוני ההזמנה עבור ה-QR
      const qrData = {
        orderId: orderData.orderId,
        supplier: orderData.supplierName,
        items: orderData.items,
        date: orderData.orderDate,
        totalItems: orderData.items.reduce((sum, item) => sum + item.quantity, 0)
      };

      // המרה לטקסט JSON
      const qrText = JSON.stringify(qrData);
      
      // יצירת QR Code
      const qrUrl = await QRCode.toDataURL(qrText, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error("שגיאה ביצירת QR Code:", error);
    } finally {
      setLoading(false);
    }
  }, [orderData]);

  React.useEffect(() => {
    if (open && orderData) {
      generateQRCode();
    }
  }, [open, orderData, generateQRCode]);

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.download = `order-${orderData.orderId}-qr.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  const copyQRData = async () => {
    const qrData = {
      orderId: orderData.orderId,
      supplier: orderData.supplierName,
      items: orderData.items,
      date: orderData.orderDate,
      totalItems: orderData.items.reduce((sum, item) => sum + item.quantity, 0)
    };
    
    try {
      await navigator.clipboard.writeText(JSON.stringify(qrData, null, 2));
      console.log("נתוני ההזמנה הועתקו ללוח");
    } catch (error) {
      console.error("שגיאה בהעתקה:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code להזמנה #{orderData?.orderId}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
            {loading ? (
              <div className="w-64 h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : qrCodeUrl ? (
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                className="w-64 h-64"
              />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center text-gray-500">
                שגיאה ביצירת QR Code
              </div>
            )}
          </div>
          
          {orderData && (
            <div className="text-center text-sm text-gray-600 space-y-1">
              <div><strong>הזמנה:</strong> #{orderData.orderId}</div>
              <div><strong>ספק:</strong> {orderData.supplierName}</div>
              <div><strong>פריטים:</strong> {orderData.items.length}</div>
              <div><strong>תאריך:</strong> {orderData.orderDate}</div>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={copyQRData}
            disabled={loading}
          >
            העתק נתונים
          </Button>
          <Button 
            onClick={downloadQRCode}
            disabled={loading || !qrCodeUrl}
          >
            הורד QR Code
          </Button>
          <Button variant="secondary" onClick={onClose}>
            סגור
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeGenerator;
