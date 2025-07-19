import * as React from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Package, AlertCircle } from "lucide-react";
import { BarcodeDatabase as BarcodeDB } from "@/components/ExcelImportDialog";
import { useTranslation } from "react-i18next";

const RTL_LANGS = ["he", "ar", "fa", "ur"];

const BarcodeDatabase = () => {
  const [searchBarcode, setSearchBarcode] = React.useState("");
  const [barcodeDatabase, setBarcodeDatabase] = React.useState<BarcodeDB>({});
  const [searchResult, setSearchResult] = React.useState<{
    found: boolean;
    product?: { name: string; supplier?: string; minStock?: number };
  } | null>(null);
  const { i18n } = useTranslation();
  const dir = RTL_LANGS.includes(i18n.language) ? "rtl" : "ltr";

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
  }, []);

  const handleSearch = () => {
    if (!searchBarcode.trim()) {
      setSearchResult(null);
      return;
    }

    const product = barcodeDatabase[searchBarcode.trim()];
    setSearchResult({
      found: !!product,
      product: product || undefined,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
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
        <Card>
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
              {databaseSize === 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>המאגר ריק. יש לייבא מאגר ברקודים דרך עמוד המוצרים.</span>
                </div>
              )}
            </div>
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
                  onChange={(e) => setSearchBarcode(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="הכנס ברקוד לחיפוש..."
                  className="text-left"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleSearch}
                  className="h-10 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  חפש
                </button>
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
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* רשימת מוצרים במאגר */}
        {databaseSize > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>מוצרים במאגר</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {Object.entries(barcodeDatabase).map(([barcode, product]) => (
                  <div key={barcode} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">ברקוד: {barcode}</p>
                      {product.supplier && (
                        <p className="text-sm text-muted-foreground">ספק: {product.supplier}</p>
                      )}
                    </div>
                    {product.minStock !== undefined && (
                      <Badge variant="outline">
                        מלאי מינימום: {product.minStock}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
};

export default BarcodeDatabase;

