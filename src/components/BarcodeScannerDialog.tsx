
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BrowserMultiFormatReader } from "@zxing/browser";

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
      try {
        readerRef.current.reset();
        console.log("Reader reset successfully");
      } catch (err) {
        console.log("Error resetting reader:", err);
      }
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
      
      const codeReader = new BrowserMultiFormatReader();
      readerRef.current = codeReader;
      
      console.log("Requesting camera access...");
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
      });
      
      console.log("Camera access granted!");
      streamRef.current = stream;
      
      if (!videoRef.current) {
        throw new Error("Video element not found");
      }
      
      videoRef.current.srcObject = stream;
      
      setLoading(false);
      setScanning(true);
      
      try {
        const result = await codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result, error) => {
          if (result) {
            console.log("=== BARCODE DETECTED ===");
            console.log("Detected code:", result.getText());
            console.log("Format:", result.getBarcodeFormat());
            
            stopScanning();
            onDetected(result.getText());
            onClose();
          }
          
          if (error && !(error.name === 'NotFoundException')) {
            console.log("Scan error (not critical):", error.message);
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
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${scanning ? 'block' : 'hidden'}`}
              autoPlay
              playsInline
              muted
            />
            
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
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-green-400 w-64 h-16 rounded-lg animate-pulse"></div>
                <div className="absolute text-white text-center bottom-4 bg-black bg-opacity-50 px-4 py-2 rounded">
                  <div className="text-sm">כוון את המצלמה לברקוד</div>
                  <div className="text-xs mt-1">תמיכה: EAN, UPC, Code128, Code39</div>
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
