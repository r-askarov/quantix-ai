
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BrowserMultiFormatReader, BarcodeFormat } from "@zxing/browser";

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
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const readerRef = React.useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const stopScanning = () => {
    console.log("Stopping scanner...");
    
    if (readerRef.current) {
      readerRef.current.reset();
      console.log("Scanner reset");
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log("Stopped track:", track.kind);
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setScanning(false);
    setLoading(false);
    setError(null);
  };

  const startScanning = async () => {
    console.log("=== STARTING BARCODE SCANNER ===");
    setError(null);
    setLoading(true);
    setScanning(false);

    try {
      console.log("Initializing ZXing scanner...");
      
      // יצירת קורא ברקודים עם תמיכה בפורמטים שונים
      const codeReader = new BrowserMultiFormatReader();
      readerRef.current = codeReader;
      
      // הגדרת הפורמטים הנתמכים
      const hints = new Map();
      hints.set(2, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.CODE_93,
        BarcodeFormat.ITF,
        BarcodeFormat.CODABAR,
        BarcodeFormat.QR_CODE
      ]);
      
      console.log("Requesting camera access...");
      
      // בקשת גישה למצלמה
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // מצלמה אחורית
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      console.log("Camera access granted!");
      streamRef.current = stream;
      
      if (!videoRef.current) {
        throw new Error("Video element not found");
      }
      
      setLoading(false);
      setScanning(true);
      
      // התחלת סריקה רציפה
      try {
        const result = await codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result, error) => {
          if (result) {
            console.log("=== BARCODE DETECTED ===");
            console.log("Detected code:", result.getText());
            console.log("Format:", result.getBarcodeFormat());
            
            // עצירת הסריקה והחזרת התוצאה
            stopScanning();
            onDetected(result.getText());
            onClose();
          }
          
          if (error && !(error instanceof Error && error.name === 'NotFoundException')) {
            console.error("Scan error:", error);
          }
        });
        
        console.log("=== SCANNER STARTED SUCCESSFULLY ===");
        
      } catch (scanError) {
        console.error("Scan start error:", scanError);
        throw scanError;
      }
      
    } catch (err: any) {
      console.error("=== SCANNER ERROR ===", err);
      setLoading(false);
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
      startScanning();
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
          <div className="w-full h-72 bg-black rounded-lg flex items-center justify-center relative overflow-hidden">
            {/* וידיאו לתצוגה */}
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${scanning ? 'block' : 'hidden'}`}
              autoPlay
              playsInline
              muted
            />
            
            {/* מסך טעינה */}
            {loading && (
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <span>מפעיל מצלמה...</span>
              </div>
            )}
            
            {/* הודעת שגיאה */}
            {error && (
              <div className="text-red-400 text-center px-4">
                <div className="text-2xl mb-2">⚠️</div>
                <div className="text-sm leading-5">{error}</div>
              </div>
            )}
            
            {/* מסגרת סריקה */}
            {scanning && !loading && !error && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-green-400 w-64 h-64 rounded-lg animate-pulse"></div>
                <div className="absolute text-white text-center bottom-4 bg-black bg-opacity-50 px-4 py-2 rounded">
                  <div className="text-sm">כוון את המצלמה לברקוד</div>
                  <div className="text-xs mt-1">תמיכה: EAN, UPC, Code128, Code39, QR</div>
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
              ? "מחפש ברקוד - כוון את המצלמה לברקוד רגיל או QR"
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
