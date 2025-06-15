
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
  const [html5QrCode, setHtml5QrCode] = React.useState<any>(null);

  // ניקוי הסורק בעת סגירת הדיאלוג
  const cleanupScanner = React.useCallback(async () => {
    if (html5QrCode) {
      try {
        console.log("Cleaning up scanner...");
        await html5QrCode.stop();
        console.log("Scanner stopped successfully");
      } catch (err) {
        console.log("Scanner cleanup error (might be already stopped):", err);
      }
    }
    setHtml5QrCode(null);
    setScanning(false);
    setLoading(false);
    setError(null);
  }, [html5QrCode]);

  React.useEffect(() => {
    if (!open) {
      cleanupScanner();
      return;
    }

    if (open && scannerRef.current) {
      console.log("=== INITIALIZING BARCODE SCANNER ===");
      setError(null);
      setLoading(true);
      setScanning(false);

      const initializeScanner = async () => {
        try {
          console.log("Scanner container:", scannerRef.current);
          
          // בדיקת תמיכה במצלמה
          if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error("הדפדפן לא תומך בגישה למצלמה");
          }

          console.log("Requesting camera permissions explicitly...");
          // בקשת הרשאות מפורשת למצלמה
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
              video: { 
                facingMode: "environment",
                width: { ideal: 1280 },
                height: { ideal: 720 }
              } 
            });
            console.log("Camera permission granted, stream:", stream);
            
            // עצירת הזרם הזמני
            stream.getTracks().forEach(track => track.stop());
          } catch (permError) {
            console.error("Camera permission error:", permError);
            throw new Error("נדרשת הרשאה לגישה למצלמה");
          }

          console.log("Loading Html5Qrcode library...");
          const { Html5Qrcode } = await import("html5-qrcode");
          
          if (!scannerRef.current) {
            throw new Error("Scanner container disappeared");
          }

          const scannerId = "barcode-scanner";
          console.log("Creating Html5Qrcode instance...");
          
          const qrCodeScanner = new Html5Qrcode(scannerId);
          setHtml5QrCode(qrCodeScanner);

          console.log("Starting camera...");
          
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
              "UPC_A",
              "UPC_E"
            ]
          };

          await qrCodeScanner.start(
            { facingMode: "environment" },
            config,
            (decodedText: string, decodedResult: any) => {
              console.log("=== BARCODE DETECTED ===");
              console.log("Decoded:", decodedText);
              
              // עצירת הסורק והחזרת התוצאה
              qrCodeScanner.stop().then(() => {
                console.log("Scanner stopped after detection");
                onDetected(decodedText);
                onClose();
              }).catch((err) => {
                console.error("Error stopping scanner:", err);
                onDetected(decodedText);
                onClose();
              });
            },
            (errorMessage: string) => {
              // שגיאות רגילות של סריקה - לא מציגות למשתמש
              if (!errorMessage.includes("NotFoundException")) {
                console.log("Scan error:", errorMessage);
              }
            }
          );

          setScanning(true);
          setLoading(false);
          console.log("=== SCANNER STARTED SUCCESSFULLY ===");

        } catch (err: any) {
          console.error("=== SCANNER ERROR ===", err);
          setLoading(false);
          setScanning(false);
          
          let errorMessage = "שגיאה בהפעלת הסורק";
          
          if (err.name === 'NotAllowedError' || err.message.includes("הרשאה")) {
            errorMessage = "נדרשת הרשאה לגישה למצלמה. אנא אפשר גישה ונסה שוב.";
          } else if (err.name === 'NotFoundError') {
            errorMessage = "לא נמצאה מצלמה במכשיר";
          } else if (err.name === 'NotReadableError') {
            errorMessage = "המצלמה בשימוש באפליקציה אחרת";
          } else if (err.message.includes("תומך")) {
            errorMessage = err.message;
          }
          
          setError(errorMessage);
        }
      };

      // המתנה קצרה לפני התחלה
      const timer = setTimeout(initializeScanner, 200);

      return () => {
        clearTimeout(timer);
      };
    }

    return cleanupScanner;
  }, [open, onDetected, onClose, cleanupScanner]);

  // ניקוי בעת unmounting
  React.useEffect(() => {
    return () => {
      if (html5QrCode) {
        html5QrCode.stop().catch(() => {});
      }
    };
  }, [html5QrCode]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle>סרוק ברקוד עם המצלמה</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center">
          <div
            ref={scannerRef}
            id="barcode-scanner"
            className="w-full h-72 bg-black rounded-lg flex items-center justify-center relative overflow-hidden"
          >
            {loading && (
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <span>מפעיל מצלמה...</span>
              </div>
            )}
            
            {error && (
              <div className="text-red-400 text-center px-4">
                <div className="text-2xl mb-2">⚠️</div>
                <div className="text-sm leading-5">{error}</div>
              </div>
            )}
            
            {scanning && !loading && !error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-green-400 w-64 h-64 rounded-lg"></div>
                <div className="absolute text-white text-center bottom-4">
                  <div className="text-sm">כוון את המצלמה לברקוד</div>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-3 text-xs text-gray-600 text-center">
            {error 
              ? "בדוק הרשאות מצלמה בדפדפן ונסה שוב" 
              : loading 
              ? "טוען מצלמה..."
              : scanning
              ? "מחפש ברקוד - כוון את המצלמה"
              : "מכין סורק ברקוד..."
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
