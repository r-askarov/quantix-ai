
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface BarcodeScannerDialogProps {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}

const BarcodeScannerDialog: React.FC<BarcodeScannerDialogProps> = ({
  open,
  onClose,
  onDetected,
}) => {
  const scannerRef = React.useRef<HTMLDivElement | null>(null);
  const [scanning, setScanning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const html5QrCodeRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (open && scannerRef.current) {
      setScanning(false);
      setError(null);
      setLoading(true);
      
      const startScanner = async () => {
        try {
          console.log("Starting barcode scanner...");
          
          // בדיקת הרשאות מצלמה
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop()); // עצירת הזרם הזמני
          
          const { Html5Qrcode } = await import("html5-qrcode");
          console.log("Html5Qrcode imported successfully");
          
          const qr = new Html5Qrcode(scannerRef.current!.id);
          html5QrCodeRef.current = qr;
          
          console.log("Starting camera...");
          await qr.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              formatsToSupport: [
                "QR_CODE",
                "EAN_13", 
                "EAN_8", 
                "CODE_128", 
                "CODE_39",
                "CODE_93",
                "CODE_11",
                "CODABAR"
              ],
            },
            (decodedText: string) => {
              console.log("Barcode detected:", decodedText);
              qr.stop().then(() => {
                setScanning(false);
                setLoading(false);
                onDetected(decodedText);
                onClose();
              }).catch(console.error);
            },
            (errorMessage: string) => {
              // Silent error handling for continuous scanning
              // console.log("Scan error:", errorMessage);
            }
          );
          
          setScanning(true);
          setLoading(false);
          setError(null);
          console.log("Scanner started successfully");
          
        } catch (err) {
          console.error("Scanner initialization error:", err);
          setLoading(false);
          setScanning(false);
          
          if (err instanceof Error) {
            if (err.name === 'NotAllowedError') {
              setError("אין הרשאה לגישה למצלמה. אנא אפשר/י גישה למצלמה ונסה/י שוב.");
            } else if (err.name === 'NotFoundError') {
              setError("לא נמצאה מצלמה במכשיר.");
            } else {
              setError("שגיאה בטעינת הסורק. אנא רענן/י את הדף ונסה/י שוב.");
            }
          } else {
            setError("שגיאה לא ידועה בטעינת הסורק.");
          }
        }
      };

      startScanner();
    }

    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop()
          .then(() => html5QrCodeRef.current.clear())
          .catch(console.error);
      }
      setScanning(false);
      setLoading(false);
      setError(null);
    };
  }, [open, onDetected, onClose]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle>סרוק/י ברקוד עם המצלמה</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center">
          <div
            ref={scannerRef}
            id="barcode-scanner"
            className="w-full h-72 bg-black rounded flex items-center justify-center relative overflow-hidden"
          >
            {loading && (
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <span>טוען סורק...</span>
              </div>
            )}
            {error && (
              <div className="text-red-400 text-center px-4">
                <div className="mb-2">⚠️</div>
                {error}
              </div>
            )}
            {scanning && !loading && !error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-green-400 w-64 h-64 rounded-lg"></div>
              </div>
            )}
          </div>
          <div className="mt-2 text-xs text-gray-700 text-center">
            {error 
              ? "בדוק/י הרשאות מצלמה בדפדפן ונסה/י שוב" 
              : loading 
              ? "מכין את המצלמה..."
              : "כוון/י את המצלמה לברקוד"
            }
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            ביטול
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScannerDialog;
