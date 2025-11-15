import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

export interface BarcodeDatabase {
  [barcode: string]: {
    name: string;
    supplier?: string;
    minStock?: number;
  };
}

interface ExcelImportDialogProps {
  onImport: (database: BarcodeDatabase) => void;
}

const ExcelImportDialog: React.FC<ExcelImportDialogProps> = ({ onImport }) => {
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (
        selectedFile.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        selectedFile.type === "application/vnd.ms-excel" ||
        selectedFile.name.endsWith(".xlsx") ||
        selectedFile.name.endsWith(".xls")
      ) {
        setFile(selectedFile);
      } else {
        toast({
          title: "שגיאה",
          description: "אנא בחר קובץ אקסל (.xlsx או .xls)",
          variant: "destructive",
        });
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "שגיאה",
        description: "אנא בחר קובץ לייבוא",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const database: BarcodeDatabase = {};
      let importedCount = 0;

      jsonData.forEach((row: any) => {
        const barcode =
          row["ברקוד"] ||
          row["barcode"] ||
          row["Barcode"] ||
          row["BARCODE"] ||
          row["קוד"] ||
          row["code"] ||
          row["Code"] ||
          row["CODE"];
        const name =
          row["שם"] ||
          row["שם מוצר"] ||
          row["name"] ||
          row["Name"] ||
          row["NAME"] ||
          row["product"] ||
          row["Product"] ||
          row["PRODUCT"];
        const supplier =
          row["מותג"] ||
          row["brand"] ||
          row["Brand"] ||
          row["BRAND"] ||
          row["ספק"] ||
          row["supplier"] ||
          row["Supplier"] ||
          row["SUPPLIER"];
        const minStock =
          row["מלאי מינימום"] ||
          row["min stock"] ||
          row["Min Stock"] ||
          row["MIN_STOCK"] ||
          row["minimum"] ||
          row["Minimum"];

        if (barcode && name) {
          database[String(barcode)] = {
            name: String(name),
            supplier: supplier ? String(supplier) : undefined,
            minStock: minStock ? Number(minStock) : undefined,
          };
          importedCount++;
        }
      });

      if (importedCount > 0) {
        onImport(database);
        toast({
          title: "הייבוא הושלם בהצלחה!",
          description: `יובאו ${importedCount} מוצרים למאגר הברקודים`,
        });
        setOpen(false);
        setFile(null);
      } else {
        toast({
          title: "לא נמצאו נתונים",
          description:
            "לא נמצאו עמודות של ברקוד ושם מוצר בקובץ. ודא שהעמודות נכונות.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Excel import error:", error);
      toast({
        title: "שגיאה בייבוא",
        description: "אירעה שגיאה בעת קריאת הקובץ.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Portal modal rendered into document.body so it's outside any page stacking context
  const modal = open
    ? createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 99999 }}
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            className="relative bg-white p-6 rounded shadow w-full max-w-md mx-4"
            dir="rtl"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">ייבוא מאגר ברקודים מאקסל</h2>
              <button
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="excel-file">בחר קובץ אקסל</Label>
                <Input
                  id="excel-file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="mt-1"
                />
              </div>
              {file && (
                <div className="text-sm text-gray-600">קובץ נבחר: {file.name}</div>
              )}
              <div className="text-xs text-gray-500">
                <p>הקובץ צריך להכיל עמודות עם הכותרות:</p>
                <ul className="list-disc pr-5 mt-1">
                  <li>
                    <strong>ברקוד</strong> - קוד הברקוד של המוצר
                  </li>
                  <li>
                    <strong>שם מוצר</strong> - שם המוצר
                  </li>
                  <li>
                    <strong>מותג</strong> - שם המותג/ספק (אופציונלי)
                  </li>
                  <li>
                    <strong>מלאי מינימום</strong> - כמות מלאי מינימום (אופציונלי)
                  </li>
                </ul>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  ביטול
                </Button>
                <Button onClick={handleImport} disabled={!file || loading}>
                  {loading ? "מייבא..." : "ייבא"}
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4 mr-2" />
        ייבוא מאגר ברקודים
      </Button>
      {modal}
    </>
  );
};

export default ExcelImportDialog;
