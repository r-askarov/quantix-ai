
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Html5Qrcode } from "html5-qrcode";

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
  const [scanning, setScanning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const scannerRef = React.useRef<Html5Qrcode | null>(null);
  const qrCodeRegionId = "html5qr-code-full-region";

  const stopScanning = async () => {
    console.log("Stopping scanner...");
    
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        console.log("Scanner stopped and cleared successfully");
      } catch (err) {
        console.log("Error stopping scanner:", err);
      }
      scannerRef.current = null;
    }
    
    setScanning(false);
    setError(null);
    setSuccess(false);
  };

  const startScanning = async () => {
    console.log("=== STARTING BARCODE SCANNER ===");
    setError(null);
    setSuccess(false);
    setScanning(true);

    try {
      const scanner = new Html5Qrcode(qrCodeRegionId);
      scannerRef.current = scanner;

      // Enhanced configuration for better accuracy
      const config = {
        fps: 15, // Increased FPS for better detection
        qrbox: { width: 280, height: 120 }, // Slightly larger scanning area
        aspectRatio: 2.3, // Better ratio for barcodes
        disableFlip: false, // Allow image flipping for better detection
        videoConstraints: {
          facingMode: "environment",
          focusMode: "continuous", // Enable auto-focus
          advanced: [
            { focusMode: "continuous" },
            { exposureMode: "continuous" },
            { whiteBalanceMode: "continuous" }
          ]
        },
        formatsToSupport: [
          "EAN_13", "EAN_8", "CODE_128", "CODE_39", "UPC_A", "UPC_E", 
          "ITF", "CODE_93", "CODABAR", "RSS_14", "RSS_EXPANDED"
        ]
      };

      await scanner.start(
        { 
          facingMode: "environment",
          advanced: [
            { focusMode: "continuous" },
            { torch: false }
          ]
        },
        config,
        (decodedText, decodedResult) => {
          console.log("=== BARCODE DETECTED ===");
          console.log("Detected code:", decodedText);
          console.log("Format:", decodedResult.result?.format);
          
          // Show success animation
          setSuccess(true);
          
          // Stop scanning and close after a brief delay
          setTimeout(() => {
            stopScanning();
            onDetected(decodedText);
            onClose();
          }, 500);
        },
        (errorMessage) => {
          // Only show critical errors, not "no barcode found" messages
          if (!errorMessage.includes("NotFoundException") && 
              !errorMessage.includes("No MultiFormat Readers") &&
              !errorMessage.includes("No code found") &&
              !errorMessage.includes("NotFoundError")) {
            console.log("Scan error:", errorMessage);
          }
        }
      );

      console.log("=== SCANNER STARTED SUCCESSFULLY ===");
      
    } catch (err: any) {
      console.error("=== SCANNER ERROR ===", err);
      setScanning(false);
      
      let errorMessage = "שגיאה בהפעלת הסורק";
      
      if (err.name === 'NotAllowedError') {
        errorMessage = "נדרשת הרשאה לגישה למצלמה. אנא אפשר גישה בדפדפן ונסה שוב.";
      } else if (err.name === 'NotFoundError') {
        errorMessage = "לא נמצאה מצלמה במכשיר. בדוק שהמצלמה פועלת כראוי.";
      } else if (err.name === 'NotReadableError') {
        errorMessage = "המצלמה בשימוש באפליקציה אחרת. סגור אפליקציות אחרות ונסה שוב.";
      } else if (err.message && err.message.includes('Permission')) {
        errorMessage = "נדרשת הרשאה לגישה למצלמה. בדוק הגדרות הדפדפן.";
      } else if (err.message && err.message.includes('constraints')) {
        errorMessage = "בעיה בהגדרות המצלמה. נסה לרענן את הדף.";
      }
      
      setError(errorMessage);
    }
  };

  React.useEffect(() => {
    if (open) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        startScanning();
      }, 100);
    } else {
      stopScanning();
    }
    
    return () => {
      stopScanning();
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle>סרוק ברקוד עם המצלמה</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center">
          {!error && (
            <div className="w-full min-h-80 bg-black rounded-lg flex items-center justify-center relative overflow-hidden">
              <div id={qrCodeRegionId} className="w-full h-full" />
              
              {/* Visual guidance frame */}
              {scanning && !success && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {/* Scanning frame overlay */}
                  <div className="relative">
                    <div className="w-64 h-32 border-2 border-white border-dashed rounded-lg opacity-80">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>
                    </div>
                  </div>
                  
                  {/* Instructions */}
                  <div className="absolute text-white text-center bottom-4 bg-black bg-opacity-70 px-4 py-3 rounded-lg mx-4">
                    <div className="text-sm font-medium">כוון את הברקוד למסגרת</div>
                    <div className="text-xs mt-1 opacity-90">תמיכה: EAN-13, UPC, Code128, Code39, QR</div>
                    <div className="text-xs mt-1 opacity-75">💡 וודא תאורה טובה למיקוד אוטומטי</div>
                  </div>
                </div>
              )}

              {/* Success animation */}
              {success && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-green-600 bg-opacity-20">
                  <div className="text-center animate-scale-in">
                    <div className="text-6xl mb-2">✅</div>
                    <div className="text-white text-lg font-bold">ברקוד נסרק בהצלחה!</div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {error && (
            <div className="w-full h-80 bg-black rounded-lg flex items-center justify-center">
              <div className="text-center px-6 py-4">
                <div className="text-4xl mb-4">⚠️</div>
                <div className="text-red-400 text-base font-medium leading-6 mb-4">{error}</div>
                <div className="text-gray-400 text-sm">
                  💡 טיפים לסריקה טובה יותר:
                  <ul className="text-right mt-2 space-y-1 text-xs">
                    <li>• וודא תאורה טובה</li>
                    <li>• החזק את המכשיר יציב</li>
                    <li>• נקה את עדשת המצלמה</li>
                    <li>• הצמד את הברקוד למסגרת</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-3 text-xs text-gray-600 text-center">
            {error 
              ? "בדוק הרשאות מצלמה בדפדפן ונסה שוב" 
              : success
              ? "ברקוד זוהה בהצלחה - סוגר חלון..."
              : scanning
              ? "מחפש ברקוד - כוון את המצלמה לברקוד במסגרת"
              : "מכין סורק ברקוד עם מיקוד אוטומטי..."
            }
          </div>
        </div>
        
        <DialogFooter className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>
            ביטול
          </Button>
          {error && (
            <Button variant="default" onClick={startScanning}>
              נסה שוב
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScannerDialog;
