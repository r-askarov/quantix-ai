
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Tesseract from 'tesseract.js';

interface ExpiryDateScannerDialogProps {
  open: boolean;
  onClose: () => void;
  onDateDetected: (date: string) => void;
}

const ExpiryDateScannerDialog: React.FC<ExpiryDateScannerDialogProps> = ({
  open,
  onClose,
  onDateDetected,
}) => {
  const [scanning, setScanning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [detectedDates, setDetectedDates] = React.useState<string[]>([]);
  const [showDateSelection, setShowDateSelection] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const stopScanning = () => {
    console.log("Stopping date scanner...");
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setScanning(false);
    setError(null);
    setDetectedDates([]);
    setShowDateSelection(false);
  };

  const startScanning = async () => {
    console.log("=== STARTING DATE SCANNER ===");
    setError(null);
    setScanning(true);
    setDetectedDates([]);
    setShowDateSelection(false);

    try {
      if (!videoRef.current) {
        throw new Error("Video element not found");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      console.log("Camera started for date scanning");
      
    } catch (err: any) {
      console.error("=== DATE SCANNER ERROR ===", err);
      setScanning(false);
      
      let errorMessage = "שגיאה בהפעלת המצלמה";
      
      if (err.name === 'NotAllowedError') {
        errorMessage = "נדרשת הרשאה לגישה למצלמה. אנא אפשר גישה בדפדפן ונסה שוב.";
      } else if (err.name === 'NotFoundError') {
        errorMessage = "לא נמצאה מצלמה במכשיר. בדוק שהמצלמה פועלת כראוי.";
      }
      
      setError(errorMessage);
    }
  };

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setScanning(true);
    
    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) throw new Error("Cannot get canvas context");

      // Capture frame from video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      console.log("Captured image, starting OCR...");

      // Convert canvas to blob for Tesseract
      const imageData = canvas.toDataURL('image/png');

      // Run OCR
      const { data: { text } } = await Tesseract.recognize(imageData, 'eng', {
        logger: m => console.log('OCR Progress:', m)
      });

      console.log("OCR Result:", text);

      // Extract dates using regex patterns
      const datePatterns = [
        // dd/mm/yyyy or dd-mm-yyyy
        /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g,
        // yyyy-mm-dd
        /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/g,
        // dd.mm.yyyy
        /(\d{1,2})\.(\d{1,2})\.(\d{4})/g
      ];

      const foundDates: string[] = [];
      
      datePatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          let dateStr = '';
          
          // Check if it's yyyy-mm-dd format
          if (match[0].match(/^\d{4}/)) {
            // yyyy-mm-dd format - convert to dd/mm/yyyy
            const year = match[1];
            const month = match[2].padStart(2, '0');
            const day = match[3].padStart(2, '0');
            dateStr = `${day}/${month}/${year}`;
          } else {
            // dd/mm/yyyy or dd-mm-yyyy format
            const day = match[1].padStart(2, '0');
            const month = match[2].padStart(2, '0');
            const year = match[3];
            dateStr = `${day}/${month}/${year}`;
          }
          
          // Validate date
          const [d, m, y] = dateStr.split('/').map(Number);
          const date = new Date(y, m - 1, d);
          
          if (date.getFullYear() === y && 
              date.getMonth() === m - 1 && 
              date.getDate() === d &&
              y >= 2020 && y <= 2035 && // Reasonable year range
              m >= 1 && m <= 12 &&
              d >= 1 && d <= 31) {
            foundDates.push(dateStr);
          }
        }
      });

      // Remove duplicates
      const uniqueDates = [...new Set(foundDates)];

      console.log("Found dates:", uniqueDates);

      if (uniqueDates.length === 0) {
        toast({
          title: "לא זוהה תאריך תקף",
          description: "נא להזין ידנית או לנסות שוב עם תאורה טובה יותר",
          variant: "destructive"
        });
      } else if (uniqueDates.length === 1) {
        // Single date found - use it directly
        const selectedDate = uniqueDates[0];
        // Convert dd/mm/yyyy to yyyy-mm-dd for input
        const [day, month, year] = selectedDate.split('/');
        const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        
        stopScanning();
        onDateDetected(isoDate);
        onClose();
        
        toast({
          title: "תאריך זוהה בהצלחה!",
          description: `תאריך תפוגה: ${selectedDate}`
        });
      } else {
        // Multiple dates found - let user choose
        setDetectedDates(uniqueDates);
        setShowDateSelection(true);
      }

    } catch (error) {
      console.error("OCR Error:", error);
      toast({
        title: "שגיאה בזיהוי התאריך",
        description: "נסה שוב או הזן ידנית",
        variant: "destructive"
      });
    }
    
    setScanning(false);
  };

  const selectDate = (dateStr: string) => {
    // Convert dd/mm/yyyy to yyyy-mm-dd for input
    const [day, month, year] = dateStr.split('/');
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    
    stopScanning();
    onDateDetected(isoDate);
    onClose();
    
    toast({
      title: "תאריך נבחר בהצלחה!",
      description: `תאריך תפוגה: ${dateStr}`
    });
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

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  if (showDateSelection) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>בחר תאריך תפוגה</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              זוהו מספר תאריכים. אנא בחר את התאריך הנכון:
            </p>
            
            {detectedDates.map((date, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full text-lg p-4"
                onClick={() => selectDate(date)}
              >
                📅 {date}
              </Button>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="secondary" onClick={handleClose}>
              ביטול
            </Button>
            <Button variant="outline" onClick={() => setShowDateSelection(false)}>
              חזור לסריקה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle>סריקת תאריך תפוגה</DialogTitle>
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
              
              <canvas
                ref={canvasRef}
                className="hidden"
              />
              
              {/* Scanning overlay */}
              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="w-64 h-32 border-2 border-white border-dashed rounded-lg opacity-90 animate-pulse mb-4">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-green-400 rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-green-400 rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-green-400 rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-green-400 rounded-br-lg"></div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Instructions */}
              <div className="absolute text-white text-center bottom-4 bg-black bg-opacity-80 px-4 py-3 rounded-lg mx-4">
                <div className="text-sm font-medium">📅 כוון את תאריך התפוגה למסגרת</div>
                <div className="text-xs mt-1 opacity-90">🔍 וודא שהתאריך קריא ובתאורה טובה</div>
              </div>
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
                    <li>• הצמד את התאריך למסגרת</li>
                    <li>• ודא שהטקסט קריא ולא מטושטש</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-3 text-xs text-gray-600 text-center">
            {error 
              ? "בדוק הרשאות מצלמה בדפדפן ונסה שוב" 
              : scanning
              ? "🔍 מחפש תאריכי תפוגה..."
              : "🚀 מכין סורק תאריכים מתקדם..."
            }
          </div>
        </div>
        
        <DialogFooter className="flex gap-2">
          <Button variant="secondary" onClick={handleClose}>
            ביטול
          </Button>
          {!error && !scanning && (
            <Button 
              variant="default" 
              onClick={captureAndScan}
              className="gap-2"
            >
              <Camera className="w-4 h-4" />
              סרוק תאריך
            </Button>
          )}
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

export default ExpiryDateScannerDialog;
