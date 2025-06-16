
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";

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
  const [lastDetectionTime, setLastDetectionTime] = React.useState(0);
  const scannerRef = React.useRef<BrowserMultiFormatReader | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const stopScanning = async () => {
    console.log("Stopping scanner...");
    
    if (scannerRef.current) {
      try {
        // Stop the decoding process
        scannerRef.current.stopContinuousDecode();
        console.log("Scanner stopped successfully");
      } catch (err) {
        console.log("Error stopping scanner:", err);
      }
      scannerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setScanning(false);
    setError(null);
    setSuccess(false);
  };

  const startScanning = async () => {
    console.log("=== STARTING ZXING BARCODE SCANNER ===");
    setError(null);
    setSuccess(false);
    setScanning(true);
    setLastDetectionTime(0);

    try {
      if (!videoRef.current) {
        throw new Error("Video element not found");
      }

      const codeReader = new BrowserMultiFormatReader();
      scannerRef.current = codeReader;

      // Get video stream with enhanced constraints
      const constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      console.log("Video stream started, beginning continuous decode...");

      // Start continuous decoding - like Open Food Facts
      codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result, error) => {
        if (result) {
          const now = Date.now();
          // Prevent duplicate detections within 2 seconds
          if (now - lastDetectionTime > 2000) {
            console.log("=== BARCODE DETECTED ===");
            console.log("Detected code:", result.getText());
            console.log("Format:", result.getBarcodeFormat());
            
            setLastDetectionTime(now);
            setSuccess(true);
            
            // Stop scanning and close after success animation
            setTimeout(() => {
              stopScanning();
              onDetected(result.getText());
              onClose();
            }, 800);
          }
        }
        
        if (error && !(error instanceof NotFoundException)) {
          console.log("Scan error (non-critical):", error.message);
        }
      });

      console.log("=== ZXING SCANNER STARTED SUCCESSFULLY ===");
      
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
          <DialogTitle>סרוק ברקוד - זיהוי מיידי</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center">
          {!error && (
            <div className="w-full min-h-80 bg-black rounded-lg flex items-center justify-center relative overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              
              {/* Enhanced visual guidance frame */}
              {scanning && !success && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {/* Animated scanning frame */}
                  <div className="relative">
                    <div className="w-72 h-36 border-2 border-white border-dashed rounded-lg opacity-90 animate-pulse">
                      {/* Corner markers */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg animate-pulse"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg animate-pulse"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg animate-pulse"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg animate-pulse"></div>
                      
                      {/* Scanning line animation */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-green-400 animate-[slide-down_2s_ease-in-out_infinite]" 
                           style={{
                             animation: 'slide-down 2s ease-in-out infinite',
                             backgroundImage: 'linear-gradient(90deg, transparent, #4ade80, transparent)'
                           }}></div>
                    </div>
                  </div>
                  
                  {/* Enhanced instructions */}
                  <div className="absolute text-white text-center bottom-4 bg-black bg-opacity-80 px-4 py-3 rounded-lg mx-4">
                    <div className="text-sm font-medium">📱 כוון את הברקוד למסגרת</div>
                    <div className="text-xs mt-1 opacity-90">🔍 זיהוי אוטומטי - ללא צורך בלחיצה</div>
                    <div className="text-xs mt-1 opacity-75">💡 וודא תאורה טובה למיקוד מושלם</div>
                  </div>
                </div>
              )}

              {/* Success animation - like Open Food Facts */}
              {success && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-green-600 bg-opacity-30">
                  <div className="text-center animate-scale-in">
                    <div className="text-7xl mb-3 animate-bounce">✅</div>
                    <div className="text-white text-xl font-bold drop-shadow-lg">ברקוד זוהה בהצלחה!</div>
                    <div className="text-green-200 text-sm mt-2">מעבד מידע...</div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {error && (
            <div className="w-full h-80 bg-black rounded-lg flex items-center justify-center">
              <div className="text-center px-6 py-4">
                <div className="text-5xl mb-4">⚠️</div>
                <div className="text-red-400 text-base font-medium leading-6 mb-4">{error}</div>
                <div className="text-gray-400 text-sm">
                  💡 טיפים לסריקה מושלמת:
                  <ul className="text-right mt-2 space-y-1 text-xs">
                    <li>• וודא תאורה טובה ויציבה</li>
                    <li>• החזק את המכשיר יציב</li>
                    <li>• נקה את עדשת המצלמה</li>
                    <li>• הצמד את הברקוד למסגרת הירוקה</li>
                    <li>• נסה זוויות שונות אם הברקוד מעוקם</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-3 text-xs text-gray-600 text-center">
            {error 
              ? "בדוק הרשאות מצלמה בדפדפן ונסה שוב" 
              : success
              ? "🎉 ברקוד זוהה בהצלחה - מעבד נתונים..."
              : scanning
              ? "🔍 מחפש ברקוד - זיהוי אוטומטי פעיל"
              : "🚀 מכין סורק ברקוד מתקדם עם זיהוי מיידי..."
            }
          </div>
        </div>
        
        <DialogFooter className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>
            סגור
          </Button>
          {error && (
            <Button variant="default" onClick={startScanning}>
              🔄 נסה שוב
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScannerDialog;
