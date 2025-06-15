
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import jsQR from "jsqr";

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
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const scanIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const stopScanning = () => {
    console.log("Stopping scanner...");
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
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
      
      // הגדרת הווידיאו
      videoRef.current.srcObject = stream;
      
      // המתנה לטעינת הווידיאו
      await new Promise<void>((resolve, reject) => {
        if (!videoRef.current) {
          reject(new Error("Video element disappeared"));
          return;
        }
        
        videoRef.current.onloadedmetadata = () => {
          console.log("Video metadata loaded");
          resolve();
        };
        
        videoRef.current.onerror = (e) => {
          console.error("Video error:", e);
          reject(new Error("Video loading failed"));
        };
        
        videoRef.current.play().catch(reject);
      });
      
      setLoading(false);
      setScanning(true);
      
      // התחלת סריקה
      const scanFrame = () => {
        if (!videoRef.current || !canvasRef.current || !scanning) {
          return;
        }
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
          return;
        }
        
        // הגדרת גודל הקנבס
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // ציור הפריים הנוכחי
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // קבלת נתוני התמונה
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // סריקת ברקוד
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          console.log("=== BARCODE DETECTED ===");
          console.log("Detected code:", code.data);
          
          // עצירת הסריקה והחזרת התוצאה
          stopScanning();
          onDetected(code.data);
          onClose();
        }
      };
      
      // התחלת סריקה במרווחים
      scanIntervalRef.current = setInterval(scanFrame, 100);
      console.log("=== SCANNER STARTED SUCCESSFULLY ===");
      
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
            
            {/* קנבס נסתר לעיבוד */}
            <canvas
              ref={canvasRef}
              className="hidden"
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
