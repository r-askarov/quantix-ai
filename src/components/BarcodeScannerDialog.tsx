
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface BarcodeScannerDialogProps {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}

declare global {
  interface Window {
    Html5Qrcode: any;
  }
}

const BarcodeScannerDialog: React.FC<BarcodeScannerDialogProps> = ({
  open,
  onClose,
  onDetected,
}) => {
  const scannerRef = React.useRef<HTMLDivElement | null>(null);
  const [scanning, setScanning] = React.useState(false);
  const html5QrCodeRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (open && scannerRef.current) {
      setScanning(true);
      import("html5-qrcode").then(({ Html5Qrcode }) => {
        const qr = new Html5Qrcode(scannerRef.current!.id);
        html5QrCodeRef.current = qr;
        qr.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: 250,
            formatsToSupport: [ "EAN_13", "EAN_8", "CODE_128", "CODE_39" ],
          },
          (decodedText: string) => {
            qr.stop().then(() => {
              setScanning(false);
              onDetected(decodedText);
              onClose();
            });
          },
          // onError:
          () => {}
        );
      });
    }
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current.clear().catch(() => {});
      }
      setScanning(false);
    };
    // eslint-disable-next-line
  }, [open]);

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
            {!scanning && (
              <span className="text-white text-center">מטעין סורק...</span>
            )}
          </div>
          <div className="mt-2 text-xs text-gray-700 text-center">
            ודא/י שהמצלמה פונה לברקוד.
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
