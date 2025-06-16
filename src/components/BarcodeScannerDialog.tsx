
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";

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
  const scannerRef = React.useRef<Html5QrcodeScanner | null>(null);
  const qrCodeRegionId = "html5qr-code-full-region";

  const stopScanning = () => {
    console.log("Stopping scanner...");
    
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
        console.log("Scanner cleared successfully");
      } catch (err) {
        console.log("Error clearing scanner:", err);
      }
      scannerRef.current = null;
    }
    
    setScanning(false);
    setError(null);
  };

  const startScanning = () => {
    console.log("=== STARTING BARCODE SCANNER ===");
    setError(null);
    setScanning(true);

    try {
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 100 },
        aspectRatio: 1.7777778,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.CODE_93
        ]
      };

      const scanner = new Html5QrcodeScanner(qrCodeRegionId, config, false);
      scannerRef.current = scanner;

      scanner.render(
        (decodedText, decodedResult) => {
          console.log("=== BARCODE DETECTED ===");
          console.log("Detected code:", decodedText);
          console.log("Format:", decodedResult.result.format);
          
          stopScanning();
          onDetected(decodedText);
          onClose();
        },
        (errorMessage) => {
          // רק נציג שגיאות חמורות, לא "לא נמצא ברקוד"
          if (!errorMessage.includes("NotFoundException") && 
              !errorMessage.includes("No MultiFormat Readers") &&
              !errorMessage.includes("No code found")) {
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
        errorMessage = "נדרשת הרשאה לגישה למצלמה. אנא אפשר גישה ונסה שוב.";
      } else if (err.name === 'NotFoundError') {
        errorMessage = "לא נמצאה מצלמה במכשיר";
      } else if (err.name === 'NotReadableError') {
        errorMessage = "המצלמה בשימוש באפליקציה אחרת";
      } else if (err.message && err.message.includes('Permission')) {
        errorMessage = "נדרשת הרשאה לגישה למצלמה";
      }
      
      setError(errorMessage);
    }
  };

  React.useEffect(() => {
    if (open) {
      // קצת עיכוב כדי שה-DOM יהיה מוכן
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
            <div className="w-full min-h-72 bg-black rounded-lg flex items-center justify-center relative overflow-hidden">
              <div id={qrCodeRegionId} className="w-full h-full" />
              
              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="absolute text-white text-center bottom-4 bg-black bg-opacity-50 px-4 py-2 rounded">
                    <div className="text-sm">כוון את המצלמה לברקוד</div>
                    <div className="text-xs mt-1">תמיכה: EAN, UPC, Code128, Code39</div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {error && (
            <div className="w-full h-72 bg-black rounded-lg flex items-center justify-center">
              <div className="text-red-400 text-center px-4">
                <div className="text-2xl mb-2">⚠️</div>
                <div className="text-sm leading-5">{error}</div>
              </div>
            </div>
          )}
          
          <div className="mt-3 text-xs text-gray-600 text-center">
            {error 
              ? "בדוק הרשאות מצלמה בדפדפן ונסה שוב" 
              : scanning
              ? "מחפש ברקוד - כוון את המצלמה לברקוד"
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
