import * as React from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Package, AlertCircle, X, Trash2 } from "lucide-react";
import { BarcodeDatabase as BarcodeDB } from "@/components/ExcelImportDialog";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";

const RTL_LANGS = ["he", "ar", "fa", "ur"];

type DeleteConfirmationSetter = React.Dispatch<
  React.SetStateAction<{ isOpen: boolean; barcode: string | null }>
>;

const ProductsList = React.memo(
  function ProductsList({
    barcodeDatabase,
    setDeleteConfirmation,
  }: {
    barcodeDatabase: BarcodeDB;
    setDeleteConfirmation: DeleteConfirmationSetter;
  }) {
    return (
      <>
        {Object.entries(barcodeDatabase).map(([barcode, product]) => (
          <div key={barcode} className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">{product.name}</p>
              <p className="text-sm text-muted-foreground">ברקוד: {barcode}</p>
              {product.supplier && (
                <p className="text-sm text-muted-foreground">ספק: {product.supplier}</p>
              )}
            </div>
            <button
              onClick={() => setDeleteConfirmation({ isOpen: true, barcode })}
              className="p-1 rounded hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors flex-shrink-0"
              aria-label={`Delete barcode ${barcode}`}
              title="Delete barcode"
            >
              <X className="w-5 h-5" />
            </button>
            {product.minStock !== undefined && (
              <Badge variant="outline">
                מלאי מינימום: {product.minStock}
              </Badge>
            )}
          </div>
        ))}
      </>
    );
  },
  (prevProps, nextProps) =>
    prevProps.barcodeDatabase === nextProps.barcodeDatabase &&
    prevProps.setDeleteConfirmation === nextProps.setDeleteConfirmation
);

const BarcodeDatabase = () => {
  const { i18n } = useTranslation();
  const dir = RTL_LANGS.includes(i18n.language) ? "rtl" : "ltr";
  const { toast } = useToast();
  const [searchBarcode, setSearchBarcode] = React.useState("");
  const [barcodeDatabase, setBarcodeDatabase] = React.useState<BarcodeDB>({});
  const [loading, setLoading] = React.useState(true);
  const [searchResult, setSearchResult] = React.useState<{
    found: boolean;
    product?: { name: string; supplier?: string; minStock?: number };
  } | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = React.useState<{
    isOpen: boolean;
    barcode: string | null;
  }>({ isOpen: false, barcode: null });
  const [clearConfirmationOpen, setClearConfirmationOpen] = React.useState(false);

  // טעינת מאגר ברקודים מ-localStorage אם קיים
  React.useEffect(() => {
    const savedDatabase = localStorage.getItem('barcodeDatabase');
    if (savedDatabase) {
      try {
        setBarcodeDatabase(JSON.parse(savedDatabase));
      } catch (error) {
        console.error('Error loading barcode database:', error);
      }
    }
    setLoading(false);
  }, []);

  const handleSearch = React.useCallback(() => {
    if (!searchBarcode.trim()) {
      setSearchResult(null);
      return;
    }

    const product = barcodeDatabase[searchBarcode.trim()];
    setSearchResult({
      found: !!product,
      product: product || undefined,
    });
  }, [searchBarcode, barcodeDatabase]);

  const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchBarcode(e.target.value);
  }, []);

  // Auto-search with 300ms debounce
  React.useEffect(() => {
    const debounceTimer = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchBarcode, handleSearch]);

  const handleDeleteBarcode = (barcodeToDelete: string) => {
    const updatedDatabase = { ...barcodeDatabase };
    delete updatedDatabase[barcodeToDelete];
    setBarcodeDatabase(updatedDatabase);
    localStorage.setItem('barcodeDatabase', JSON.stringify(updatedDatabase));
    
    // Dispatch storage event for other components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'barcodeDatabase',
      newValue: JSON.stringify(updatedDatabase)
    }));

    toast({
      title: "ברקוד נמחק",
      description: `הברקוד ${barcodeToDelete} הוסר מהמאגר בהצלחה`,
    });

    // Clear search result if the deleted barcode was being displayed
    if (searchResult?.product && searchBarcode === barcodeToDelete) {
      setSearchResult(null);
      setSearchBarcode("");
    }

    setDeleteConfirmation({ isOpen: false, barcode: null });
  };

  const handleClearDatabase = () => {
    const updatedDatabase: BarcodeDB = {};
    setBarcodeDatabase(updatedDatabase);
    localStorage.setItem('barcodeDatabase', JSON.stringify(updatedDatabase));

    // Dispatch storage event for other components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'barcodeDatabase',
      newValue: JSON.stringify(updatedDatabase)
    }));

    toast({
      title: 'מאגר נוקה',
      description: 'כל הברקודים הוסרו בהצלחה מהמאגר',
    });

    // Clear search state
    setSearchResult(null);
    setSearchBarcode('');

    setClearConfirmationOpen(false);
  };

  const databaseSize = Object.keys(barcodeDatabase).length;

  return (
    <main className="min-h-screen bg-background px-8 py-8" dir={dir}>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-primary mb-2">מאגר ברקודים</h1>
        <p className="text-muted-foreground">חיפוש ובדיקת קיומם של ברקודים ומוצרים במאגר.</p>
      </div>

      <div className="grid gap-6">
        {/* סטטיסטיקת המאגר */}
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              מידע על המאגר
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {databaseSize} מוצרים במאגר
              </Badge>
              <div className="ml-auto">
                <button
                  onClick={() => setClearConfirmationOpen(true)}
                  disabled={databaseSize === 0}
                  className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors disabled:opacity-50"
                >
                  נקה מאגר
                </button>
              </div>
              {databaseSize === 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>המאגר ריק. יש לייבא מאגר ברקודים דרך עמוד המוצרים.</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Two-column layout: Products list on left, Search on right */}
        <div className="grid grid-cols-2 gap-6">
          {/* רשימת מוצרים במאגר */}
          <Card>
            <CardHeader>
              <CardTitle>מוצרים במאגר</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                    <p className="text-sm text-muted-foreground">טוען מוצרים...</p>
                  </div>
                </div>
              ) : databaseSize === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>אין מוצרים במאגר</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <ProductsList barcodeDatabase={barcodeDatabase} setDeleteConfirmation={setDeleteConfirmation} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* חיפוש ברקוד */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                חיפוש ברקוד
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="search-barcode">ברקוד לחיפוש</Label>
                  <Input
                    id="search-barcode"
                    value={searchBarcode}
                    onChange={handleInputChange}
                    placeholder="הכנס ברקוד לחיפוש..."
                    className="text-right mt-1"
                  />
                </div>
              </div>

              {/* תוצאות חיפוש */}
              {searchResult && (
                <Card className={searchResult.found ? "border-green-500" : "border-red-500"}>
                  <CardContent className="pt-6">
                    {searchResult.found && searchResult.product ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="bg-green-500">
                            ✓ נמצא במאגר
                          </Badge>
                        </div>
                        <div className="grid gap-2">
                          <div>
                            <Label className="text-sm font-medium">שם המוצר:</Label>
                            <p className="text-lg font-semibold">{searchResult.product.name}</p>
                          </div>
                          {searchResult.product.supplier && (
                            <div>
                              <Label className="text-sm font-medium">ספק:</Label>
                              <p>{searchResult.product.supplier}</p>
                            </div>
                          )}
                          {searchResult.product.minStock !== undefined && (
                            <div>
                              <Label className="text-sm font-medium">מלאי מינימום:</Label>
                              <p>{searchResult.product.minStock}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">
                            ✗ לא נמצא במאגר
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">
                          הברקוד "{searchBarcode}" לא קיים במאגר הנוכחי.
                        </p>
                      </div>
                    )}
                    {searchResult.found && searchResult.product && (
                      <div className="mt-4 pt-4 border-t flex gap-2">
                        <button
                          onClick={() => setDeleteConfirmation({ isOpen: true, barcode: searchBarcode.trim() })}
                          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          מחק מוצר
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={deleteConfirmation.isOpen} onOpenChange={(isOpen) => 
        setDeleteConfirmation({ ...deleteConfirmation, isOpen })
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>אישור מחיקה</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את הברקוד {deleteConfirmation.barcode}? פעולה זו לא ניתנת לשחזור.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmation.barcode && handleDeleteBarcode(deleteConfirmation.barcode)}
              className="bg-red-600 hover:bg-red-700"
            >
              מחק
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={clearConfirmationOpen} onOpenChange={(isOpen) => setClearConfirmationOpen(isOpen)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>אישור ניקוי מאגר</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את כל הברקודים? פעולה זו לא ניתנת לשחזור.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearDatabase} className="bg-red-600 hover:bg-red-700">
              נקה מאגר
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};

export default BarcodeDatabase;

