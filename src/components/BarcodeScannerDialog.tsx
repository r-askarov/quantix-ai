
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
    console.log("BarcodeScannerDialog useEffect triggered", { open });
    
    if (open && scannerRef.current) {
      setScanning(false);
      setError(null);
      setLoading(true);
      
      const startScanner = async () => {
        try {
          console.log("=== STARTING BARCODE SCANNER ===");
          console.log("Scanner container:", scannerRef.current);
          console.log("Scanner container ID:", scannerRef.current?.id);
          
          // בדיקת תמיכה במצלמה
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("המכשיר לא תומך בגישה למצלמה");
          }
          
          console.log("Requesting camera permissions...");
          // בדיקת הרשאות מצלמה
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: "environment" 
            } 
          });
          console.log("Camera stream obtained:", stream);
          
          // עצירת הזרם הזמני
          stream.getTracks().forEach(track => {
            console.log("Stopping track:", track);
            track.stop();
          });
          
          console.log("Importing Html5Qrcode...");
          const { Html5Qrcode } = await import("html5-qrcode");
          console.log("Html5Qrcode imported successfully:", Html5Qrcode);
          
          if (!scannerRef.current) {
            throw new Error("Scanner container not found");
          }
          
          const scannerId = scannerRef.current.id;
          console.log("Creating Html5Qrcode instance with ID:", scannerId);
          
          const qr = new Html5Qrcode(scannerId);
          html5QrCodeRef.current = qr;
          
          console.log("Html5Qrcode instance created:", qr);
          console.log("Starting camera with configuration...");
          
          const config = {
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
            aspectRatio: 1.777778
          };
          
          console.log("Scanner config:", config);
          
          await qr.start(
            { facingMode: "environment" },
            config,
            (decodedText: string) => {
              console.log("=== BARCODE DETECTED ===");
              console.log("Decoded text:", decodedText);
              console.log("Decoded text type:", typeof decodedText);
              console.log("Decoded text length:", decodedText.length);
              
              qr.stop().then(() => {
                console.log("Scanner stopped successfully");
                setScanning(false);
                setLoading(false);
                console.log("Calling onDetected with:", decodedText);
                onDetected(decodedText);
                onClose();
              }).catch((stopError) => {
                console.error("Error stopping scanner:", stopError);
                onDetected(decodedText);
                onClose();
              });
            },
            (errorMessage: string) => {
              // Silent error handling for continuous scanning
              // רק לוג מפורט לבדיקה
              if (errorMessage.includes("NotFoundException")) {
                // זה נורמלי - פירוש שאין ברקוד בתמונה
              } else {
                console.log("Scan error (not critical):", errorMessage);
              }
            }
          );
          
          setScanning(true);
          setLoading(false);
          setError(null);
          console.log("=== SCANNER STARTED SUCCESSFULLY ===");
          
        } catch (err) {
          console.error("=== SCANNER INITIALIZATION ERROR ===");
          console.error("Error object:", err);
          console.error("Error name:", err instanceof Error ? err.name : 'Unknown');
          console.error("Error message:", err instanceof Error ? err.message : String(err));
          console.error("Error stack:", err instanceof Error ? err.stack : 'No stack');
          
          setLoading(false);
          setScanning(false);
          
          if (err instanceof Error) {
            if (err.name === 'NotAllowedError') {
              setError("אין הרשאה לגישה למצלמה. אנא אפשר/י גישה למצלמה ונסה/י שוב.");
            } else if (err.name === 'NotFoundError') {
              setError("לא נמצאה מצלמה במכשיר.");
            } else if (err.name === 'NotReadableError') {
              setError("המצלמה בשימוש על ידי אפליקציה אחרת.");
            } else if (err.message.includes("המכשיר לא תומך")) {
              setError("המכשיר לא תומך בסריקת ברקוד.");
            } else {
              setError(`שגיאה בטעינת הסורק: ${err.message}`);
            }
          } else {
            setError("שגיאה לא ידועה בטעינת הסורק.");
          }
        }
      };

      // המתנה קצרה לפני התחלת הסורק
      const timeout = setTimeout(() => {
        startScanner();
      }, 100);

      return () => {
        clearTimeout(timeout);
      };
    }

    return () => {
      console.log("Cleanup: stopping scanner");
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop()
          .then(() => {
            console.log("Scanner stopped in cleanup");
            return html5QrCodeRef.current?.clear?.();
          })
          .catch((err: any) => {
            console.error("Error in cleanup:", err);
          });
      }
      setScanning(false);
      setLoading(false);
      setError(null);
    };
  }, [open, onDetected, onClose]);

  console.log("Rendering BarcodeScannerDialog", { 
    open, 
    scanning, 
    loading, 
    error,
    scannerRefCurrent: !!scannerRef.current 
  });

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
                <div className="text-sm">{error}</div>
              </div>
            )}
            {scanning && !loading && !error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-green-400 w-64 h-64 rounded-lg animate-pulse"></div>
                <div className="absolute text-white text-center bottom-4">
                  <div className="text-sm">כוון את המצלמה לברקוד</div>
                </div>
              </div>
            )}
          </div>
          <div className="mt-2 text-xs text-gray-700 text-center">
            {error 
              ? "בדוק/י הרשאות מצלמה בדפדפן ונסה/י שוב" 
              : loading 
              ? "מכין את המצלמה..."
              : scanning
              ? "מחפש ברקוד..."
              : "לחץ על כפתור הסורק להתחלה"
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
