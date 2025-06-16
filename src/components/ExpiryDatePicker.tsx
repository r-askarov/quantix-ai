
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Camera } from "lucide-react";
import ExpiryDateScannerDialog from "./ExpiryDateScannerDialog";

interface ExpiryDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

const ExpiryDatePicker: React.FC<ExpiryDatePickerProps> = ({
  value,
  onChange,
  label = "תוקף",
  placeholder = "בחר תאריך תפוגה",
  required = false,
  className = ""
}) => {
  const [scannerOpen, setScannerOpen] = React.useState(false);

  const handleDateScanned = (scannedDate: string) => {
    onChange(scannedDate);
  };

  return (
    <div className={className}>
      {label && (
        <Label className="block mb-2">
          {label} {!required && "(לא חובה)"}
        </Label>
      )}
      
      <div className="flex gap-2">
        <Input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="flex-1"
        />
        
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setScannerOpen(true)}
          className="shrink-0"
          title="סרוק תאריך תפוגה עם מצלמה"
        >
          <Camera className="w-4 h-4" />
        </Button>
      </div>
      
      <ExpiryDateScannerDialog
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={handleDateScanned}
      />
    </div>
  );
};

export default ExpiryDatePicker;
