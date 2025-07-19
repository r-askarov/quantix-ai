import DashboardCard from "@/components/DashboardCard";
import InventoryTable from "@/components/InventoryTable";
import StatsChart from "@/components/StatsChart";
import NotificationsPanel from "@/components/NotificationsPanel";
import { ArrowDown, ArrowUp } from "lucide-react";
import * as React from "react";
import i18n from "../i18n";
import BarcodeScannerDialog from "@/components/BarcodeScannerDialog";
import EnhancedAddProductDialog from "@/components/EnhancedAddProductDialog";
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

// Shared initial products array
const initialProducts = [
  {
    barcode: "7290001234567",
    name: "מברגה בוש",
    quantity: 13,
    supplier: "חשמל יצחק",
    minStock: 5,
    price: 349,
  },
  {
    barcode: "7290009876541",
    name: "סרט מדידה 5 מטר",
    quantity: 34,
    supplier: "י.א. בניה",
    minStock: 10,
    price: 29,
  },
  {
    barcode: "7290001122445",
    name: "פלייר מקצועי",
    quantity: 28,
    supplier: "כלי-ברזל בע\"מ",
    minStock: 10,
    price: 55,
  },
  {
    barcode: "7290009988776",
    name: "מברשת צבע",
    quantity: 56,
    supplier: "ספק מבנים",
    minStock: 15,
    price: 19,
  },
  {
    barcode: "7290008765432",
    name: "מסור ידני",
    quantity: 2,
    supplier: "כלי-ברזל בע\"מ",
    minStock: 2,
    price: 99,
  },
];

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

  React.useEffect(() => {
    // Set initial products in localStorage if not already set
    if (!localStorage.getItem("products")) {
      localStorage.setItem("products", JSON.stringify(initialProducts));
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

  return (
    <main
      className="min-h-screen bg-background flex flex-col gap-10 px-8 py-8"
      dir="rtl"
      lang="he"
    >
      {/* Header */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-2 select-none">
        <h1 className="text-4xl font-black tracking-tight text-primary mb-1">
          Revalto – ניהול מלאי חכם
        </h1>
      </header>
      {/* Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
        <DashboardCard
          title="סה״כ פריטים"
          value="1,248"
          icon={<ArrowUp className="text-green-600" />}
          change="+8 (היום)"
          color="from-blue-500 via-cyan-500 to-green-400"
        />
        <DashboardCard
          title="התראות מלאי נמוך"
          value="5"
          icon={<ArrowDown className="text-red-600" />}
          change="2 התראות חדשות"
          color="from-red-400 via-orange-400 to-yellow-300"
        />
        <DashboardCard
          title="סך הזמנות פתוחות"
          value="13"
          icon={<ArrowUp className="text-blue-700" />}
          change="+1 (שבוע אחרון)"
          color="from-fuchsia-500 via-indigo-400 to-sky-300"
        />
        <DashboardCard
          title="מחסנים פעילים"
          value="3"
          icon={<ArrowUp className="text-green-700" />}
          change="יציב"
          color="from-emerald-400 via-cyan-400 to-blue-300"
        />
      </section>
      {/* Dashboard Main */}
      <section className="grid grid-cols-1 2xl:grid-cols-3 gap-8 mt-4 w-full">
        {/* Inventory table */}
        <div className="col-span-2 rounded-xl bg-card shadow border p-6 flex flex-col min-w-0">
          <h2 className="text-2xl font-semibold mb-4">מלאי נוכחי</h2>
          <button
            className="flex items-center gap-2 px-3 py-2 border rounded-md bg-green-500 text-white hover:bg-green-600 transition mb-4 self-start"
            onClick={() => setScannerOpen(true)}
          >
            + סרוק ברקוד והוסף מוצר
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 border rounded-md bg-red-500 text-white hover:bg-red-600 transition mb-4 self-start"
            onClick={() => setRemoveScannerOpen(true)}
          >
            - סרוק ברקוד ומשוך מוצר
          </button>
          <BarcodeScannerDialog
            open={scannerOpen}
            onClose={() => setScannerOpen(false)}
            onDetected={(barcode) => {
              setScannedBarcode(barcode);
              setScannerOpen(false);
              setAddDialogOpen(true);
            }}
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
              setAddDialogOpen(false);
              setScannedBarcode("");
            }}
            barcodeDatabase={barcodeDatabase}
            initialBarcode={scannedBarcode}
            onOpenChange={setAddDialogOpen}
          />
          <RemoveProductDialog
            open={removeDialogOpen}
            onOpenChange={setRemoveDialogOpen}
            product={removeProduct}
            onRemove={(barcode, quantity) => {
              handleRemoveProduct(barcode, quantity);
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
    </main>
  );
};

export default Index;
