import DashboardCard from "@/components/DashboardCard";
import InventoryTable from "@/components/InventoryTable";
import StatsChart from "@/components/StatsChart";
import NotificationsPanel from "@/components/NotificationsPanel";
import { ArrowDown, ArrowUp } from "lucide-react";
import * as React from "react";
import i18n from "../i18n";
import BarcodeScannerDialog from "@/components/BarcodeScannerDialog";
import EnhancedAddProductDialog from "@/components/EnhancedAddProductDialog";
import ActivityLogModal from "@/components/ActivityLogModal";
import ExcelImportDialog, {
  BarcodeDatabase,
} from "@/components/ExcelImportDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  ScanBarcode,
  ClipboardList,
  MoreHorizontal,
  ArrowDownCircle,
  DollarSign,
  CreditCard,
  LogOut,
  LogIn,
} from "lucide-react";
import { searchOpenFoodFacts } from "@/utils/barcodeSearch";

const RemoveProductDialog = ({
  open,
  onOpenChange,
  product,
  onRemove,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any | null;
  onRemove: (barcode: string, quantity: number) => void;
}) => {
  const [quantity, setQuantity] = React.useState(1);
  React.useEffect(() => {
    setQuantity(1);
  }, [product]);
  if (!product) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>הוצאת מוצר מהמלאי</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="block text-right text-xs mb-1">ברקוד</label>
            <input
              className="border rounded px-2 py-1"
              value={product.barcode}
              disabled
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="block text-right text-xs mb-1">תאריך תפוגה</label>
            <input
              className="border rounded px-2 py-1"
              value={product.expiryDate || "ללא"}
              disabled
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="block text-right text-xs mb-1">כמות להוצאה</label>
            <input
              className="border rounded px-2 py-1"
              type="number"
              min={1}
              max={product.quantity}
              value={quantity}
              onChange={(e) =>
                setQuantity(Number(e.target.value))
              }
            />
            <span className="text-xs text-muted-foreground">
              (מלאי נוכחי: {product.quantity})
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              onRemove(product.barcode, quantity);
              onOpenChange(false);
            }}
          >
            הוצא מהמלאי
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Index = () => {
  React.useEffect(() => {
    document.body.dir = "rtl";
    document.body.lang = "he";
  }, []);

  const [scannerOpen, setScannerOpen] = React.useState(false);
  const [scannedBarcode, setScannedBarcode] = React.useState("");
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [barcodeDatabase, setBarcodeDatabase] = React.useState<BarcodeDatabase>(
    {}
  );
  const [removeScannerOpen, setRemoveScannerOpen] = React.useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = React.useState(false);
  const [removeBarcode, setRemoveBarcode] = React.useState("");
  const [removeProduct, setRemoveProduct] = React.useState<any | null>(null);
  const [products, setProducts] = React.useState([]);
  const [activityLogOpen, setActivityLogOpen] = React.useState(false);
  const [activityLog, setActivityLog] = React.useState<any[]>([]);
  const [batches, setBatches] = React.useState<any[]>([]);
  const [visibleCards, setVisibleCards] = React.useState<string[]>(() => {
    const stored = localStorage.getItem("visibleCards");
    return stored ? JSON.parse(stored) : ["totalItems", "lowStockAlerts", "openOrders", "activeWarehouses"];
  });
  const [editCardsOpen, setEditCardsOpen] = React.useState(false);

  React.useEffect(() => {
    // Initialize with empty array if no products exist
    if (!localStorage.getItem("products")) {
      localStorage.setItem("products", JSON.stringify([]));
    }
    const savedDatabase = localStorage.getItem("barcodeDatabase");
    if (savedDatabase) {
      try {
        setBarcodeDatabase(JSON.parse(savedDatabase));
      } catch (error) {
        console.error("Error loading barcode database:", error);
      }
    }
  }, []);

  React.useEffect(() => {
    const stored = localStorage.getItem("products");
    if (stored) {
      setProducts(JSON.parse(stored));
    }
  }, [addDialogOpen, removeDialogOpen]); // update when dialogs close

  React.useEffect(() => {
    const storedLog = localStorage.getItem("activityLog");
    if (storedLog) setActivityLog(JSON.parse(storedLog));
  }, [addDialogOpen, removeDialogOpen]);

  React.useEffect(() => {
    const storedBatches = localStorage.getItem("inventoryBatches");
    if (storedBatches) {
      try {
        setBatches(JSON.parse(storedBatches));
      } catch (error) {
        console.error("Error loading batches:", error);
      }
    }
  }, []);

  // Calculate total items from products and batches
  const totalItems = React.useMemo(() => {
    const productTotal = products.reduce((sum: number, p: any) => sum + (p.quantity || 0), 0);
    const batchTotal = batches.reduce((sum: number, b: any) => sum + (b.quantity || 0), 0);
    return productTotal + batchTotal;
  }, [products, batches]);

  // Calculate low stock alerts
  const lowStockAlerts = React.useMemo(() => {
    return products.filter((p: any) => p.quantity <= p.minStock).length;
  }, [products]);

  const handleRemoveProduct = (barcode: string, quantity: number) => {
    const productsArr = JSON.parse(localStorage.getItem("products") || "[]");
    const idx = productsArr.findIndex((p: any) => p.barcode === barcode);
    if (idx !== -1) {
      if (quantity >= productsArr[idx].quantity) {
        // Remove product if all quantity is removed
        productsArr.splice(idx, 1);
      } else {
        // Subtract quantity
        productsArr[idx].quantity -= quantity;
      }
      localStorage.setItem("products", JSON.stringify(productsArr));
      setProducts(productsArr);
    }
  };

  const addLogEntry = (entry: any) => {
    const logArr = JSON.parse(localStorage.getItem("activityLog") || "[]");
    logArr.unshift(entry);
    localStorage.setItem("activityLog", JSON.stringify(logArr));
    setActivityLog(logArr);
  };

  const toggleCardVisibility = (card: string) => {
    const updatedCards = visibleCards.includes(card)
      ? visibleCards.filter((c) => c !== card)
      : [...visibleCards, card];
    setVisibleCards(updatedCards);
    localStorage.setItem("visibleCards", JSON.stringify(updatedCards));
  };

  const handleBarcodeDetected = async (barcode: string) => {
    console.log('🔍 Barcode scanned:', barcode);
    setScannedBarcode(barcode);
    setScannerOpen(false);

    // First check local database
    const localDb = JSON.parse(localStorage.getItem('barcodeDatabase') || '{}');
    if (localDb[barcode]) {
      console.log('✅ Found in local database:', localDb[barcode]);
      setAddDialogOpen(true);
      return;
    }
    console.log('❌ Not found in local database, trying OpenFoodFacts...');

    // If not in local database, try Open Food Facts
    const openFoodData = await searchOpenFoodFacts(barcode);
    if (openFoodData) {
      console.log('✅ Found in OpenFoodFacts:', openFoodData);
      // Store more detailed product data
      localStorage.setItem('tempProductData', JSON.stringify({
        barcode,
        name: openFoodData.name,
        supplier: openFoodData.brands || "",
        category: openFoodData.categories || "",
        quantity: 1, // Default quantity
        minStock: 0, // Default minStock
        price: 0, // Default price
        description: openFoodData.generic_name || "",
        packageSize: openFoodData.quantity || "",
        // Add any other relevant fields from the API response
      }));
    } else {
      console.log('❌ Product not found in OpenFoodFacts');
      // Store minimal data for manual entry
      localStorage.setItem('tempProductData', JSON.stringify({
        barcode,
        name: "",
        supplier: "",
        quantity: 1,
        minStock: 0,
        price: 0
      }));
    }

    setAddDialogOpen(true);
  };

  return (
    <main
      className="min-h-screen bg-background flex flex-col gap-10 px-8 py-8"
      dir="rtl"
      lang="he"
    >
      {/* Header */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-2 select-none">
        <h1 className="text-4xl font-black tracking-tight text-primary mb-1">
          RevAlto – ניהול מלאי חכם
        </h1>
        <button
          onClick={() => setEditCardsOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          ערוך כרטיסים
        </button>
      </header>

      {/* Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
        {visibleCards.includes("totalItems") && (
          <DashboardCard
            title="סה״כ פריטים"
            value={totalItems.toLocaleString("he-IL")}
            icon={<ArrowUp className="text-green-600" />}
            change="+8 (היום)"
            color="from-blue-500 via-cyan-500 to-green-400"
          />
        )}
        {visibleCards.includes("lowStockAlerts") && (
          <DashboardCard
            title="התראות מלאי נמוך"
            value={lowStockAlerts.toString()}
            icon={<ArrowDown className="text-red-600" />}
            change={lowStockAlerts > 0 ? `${lowStockAlerts} פריטים בעלויות נמוכות` : "בתוך הנורמה"}
            color="from-red-400 via-orange-400 to-yellow-300"
          />
        )}
        {visibleCards.includes("openOrders") && (
          <DashboardCard
            title="סך הזמנות פתוחות"
            value="13"
            icon={<ArrowUp className="text-green-700" />}
            change="+1 (שבוע אחרון)"
            color="from-fuchsia-500 via-indigo-400 to-sky-300"
          />
        )}
        {visibleCards.includes("activeWarehouses") && (
          <DashboardCard
            title="מחסנים פעילים"
            value="3"
            icon={<ArrowUp className="text-green-700" />}
            change="יציב"
            color="from-emerald-400 via-cyan-400 to-blue-300"
          />
        )}
      </section>

      {/* Edit Cards Modal */}
      {editCardsOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          style={{ zIndex: 1050 }} // Ensure the modal backdrop has a high z-index
        >
          <div className="bg-white p-6 rounded shadow w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">בחר כרטיסים להצגה</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={visibleCards.includes("totalItems")}
                  onChange={() => toggleCardVisibility("totalItems")}
                />
                <span>סה״כ פריטים</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={visibleCards.includes("lowStockAlerts")}
                  onChange={() => toggleCardVisibility("lowStockAlerts")}
                />
                <span>התראות מלאי נמוך</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={visibleCards.includes("openOrders")}
                  onChange={() => toggleCardVisibility("openOrders")}
                />
                <span>סך הזמנות פתוחות</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={visibleCards.includes("activeWarehouses")}
                  onChange={() => toggleCardVisibility("activeWarehouses")}
                />
                <span>מחסנים פעילים</span>
              </label>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setEditCardsOpen(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-row w-full gap-12 mb-6 items-center font-bold">
        <button className="flex flex-col items-center gap-1 text-primary hover:text-blue-700">
          <BarChart size={24} />
          <span className="text-xs">סטטיסטיקות</span>
        </button>
        <button onClick={() => setScannerOpen(true)} className="flex flex-col items-center gap-1 text-green-600 hover:text-green-800">
          <ScanBarcode size={24} />
          <span className="text-xs">סרוק</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-fuchsia-600 hover:text-fuchsia-800">
          <ClipboardList size={24} />
          <span className="text-xs">הזמנות</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-600 hover:text-gray-800" onClick={() => setActivityLogOpen(true)}>
          <MoreHorizontal size={24} />
          <span className="text-xs">פעולות</span>
        </button>
        <button onClick={() => setRemoveScannerOpen(true)} className="flex flex-col items-center gap-1 text-red-600 hover:text-red-800">
          <ArrowDownCircle size={24} />
          <span className="text-xs">משיכה</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-yellow-600 hover:text-yellow-800">
          <DollarSign size={24} />
          <span className="text-xs">עדכון מחיר</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-cyan-600 hover:text-cyan-800">
          <CreditCard size={24} />
          <span className="text-xs">קרדיטים</span>
        </button>
      </div>

      {/* Dashboard Main */}
      <section className="grid grid-cols-1 2xl:grid-cols-3 w-full">
        {/* Inventory table */}
        <div className="col-span-2 rounded-xl bg-card shadow border p-6 flex flex-col min-w-0">
          <h2 className="text-2xl font-semibold mb-4">מלאי נוכחי</h2>
          <BarcodeScannerDialog
            open={scannerOpen}
            onClose={() => setScannerOpen(false)}
            onDetected={handleBarcodeDetected}
          />
          <BarcodeScannerDialog
            open={removeScannerOpen}
            onClose={() => setRemoveScannerOpen(false)}
            onDetected={(barcode) => {
              const found = products.find((p: any) => p.barcode === barcode);
              if (!found) {
                alert(".לא ניתן למשוך מוצר זה כי אינו במלאי");
                setRemoveScannerOpen(false);
                return;
              }
              setRemoveBarcode(barcode);
              setRemoveProduct(found);
              setRemoveScannerOpen(false);
              setRemoveDialogOpen(true);
            }}
          />
          <EnhancedAddProductDialog
            open={addDialogOpen}
            onAdd={(product) => {
              // Save new product to localStorage
              const products = JSON.parse(
                localStorage.getItem("products") || "[]"
              );
              products.push(product);
              localStorage.setItem("products", JSON.stringify(products));
              
              // Clear any temporary product data
              localStorage.removeItem('tempProductData');
              
              addLogEntry({
                type: "insert",
                name: product.name,
                barcode: product.barcode,
                quantity: product.quantity,
                date: Date.now()
              });
              setAddDialogOpen(false);
              setScannedBarcode("");
            }}
            barcodeDatabase={barcodeDatabase}
            initialBarcode={scannedBarcode}
            onOpenChange={(open) => {
              setAddDialogOpen(open);
              if (!open) {
                localStorage.removeItem('tempProductData');
              }
            }}
          />
          <RemoveProductDialog
            open={removeDialogOpen}
            onOpenChange={setRemoveDialogOpen}
            product={removeProduct}
            onRemove={(barcode, quantity) => {
              handleRemoveProduct(barcode, quantity);
              addLogEntry({ type: "withdraw", name: removeProduct?.name, barcode, quantity, date: Date.now() });
              setRemoveDialogOpen(false);
              setRemoveBarcode("");
              setRemoveProduct(null);
            }}
          />
          <InventoryTable products={products.slice(0, 4)} />
        </div>
        {/* Side stats/charts/notifications */}
        <aside className="col-span-1 flex flex-col gap-6 min-w-0">
          <div className="bg-card shadow border rounded-xl p-6 flex-1">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ArrowUp size={20} className="text-primary" /> מגמות וסטטיסטיקות
            </h2>
            <StatsChart />
          </div>
          <div className="bg-card shadow border rounded-xl p-6">
            <NotificationsPanel />
          </div>
        </aside>
      </section>
      <ActivityLogModal open={activityLogOpen} onOpenChange={setActivityLogOpen} log={activityLog} />
    </main>
  );
};

export default Index;
