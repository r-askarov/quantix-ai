
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
  const html5QrCodeRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (open && scannerRef.current) {
      setScanning(true);
      setError(null);
      
      const startScanner = async () => {
        try {
          const { Html5Qrcode } = await import("html5-qrcode");
          const qr = new Html5Qrcode(scannerRef.current!.id);
          html5QrCodeRef.current = qr;
          
          await qr.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 200, height: 200 },
              formatsToSupport: ["EAN_13", "EAN_8", "CODE_128", "CODE_39", "QR_CODE"],
            },
            (decodedText: string) => {
              console.log("Barcode detected:", decodedText);
              qr.stop().then(() => {
                setScanning(false);
                onDetected(decodedText);
                onClose();
              }).catch(console.error);
            },
            (errorMessage: string) => {
              // Silent error handling for continuous scanning
              console.log("Scan error:", errorMessage);
            }
          );
        } catch (err) {
          console.error("Scanner initialization error:", err);
          setError("לא ניתן להפעיל את המצלמה. אנא בדוק הרשאות המצלמה.");
          setScanning(false);
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
      setError(null);
    };
  }, [open, onDetected, onClose]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>סרוק/י ברקוד עם המצלמה</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center">
          <div
            ref={scannerRef}
            id="barcode-scanner"
            className="w-full h-72 bg-black rounded flex items-center justify-center"
          >
            {error ? (
              <div className="text-red-400 text-center px-4">
                {error}
              </div>
            ) : !scanning ? (
              <span className="text-white text-center">מטעין סורק...</span>
            ) : null}
          </div>
          <div className="mt-2 text-xs text-gray-700 text-center">
            {error ? "נסה/י שוב או בדוק הרשאות מצלמה" : "ודא/י שהמצלמה פונה לברקוד."}
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
