import * as React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import TodayOrdersBoard from "@/components/TodayOrdersBoard";
import TodayDeliveriesBoard from "@/components/TodayDeliveriesBoard";
import AllOrdersTable from "@/components/AllOrdersTable";
import PurchaseOrderDialog from "@/components/PurchaseOrderDialog";
import ReceivingDialog from "@/components/ReceivingDialog";
import OCRShippingDocumentDialog from "@/components/OCRShippingDocumentDialog";
import ShippingComparisonTable from "@/components/ShippingComparisonTable";
import SupplierSelectionDialog from "@/components/SupplierSelectionDialog";
import ProductSelectionOrderDialog from "@/components/ProductSelectionOrderDialog";
import OrderSummaryDialog from "@/components/OrderSummaryDialog";
import { Button } from "@/components/ui/button";
import { Plus, Truck, ClipboardList, Archive, Divide, DivideSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";

const RTL_LANGS = ["he", "ar", "fa", "ur"];

export interface ShippingItem {
  name: string;
  quantity: number;
  status: 'match' | 'missing' | 'extra';
  barcode?: string;
}

interface BarcodeProduct {
  barcode: string;
  name: string;
  supplier: string;
  unitPrice?: number;
  category?: string;
}

const Orders = () => {
  const [shippingItems, setShippingItems] = React.useState<ShippingItem[]>([]);
  const [showComparison, setShowComparison] = React.useState(false);
  const [showSupplierSelection, setShowSupplierSelection] = React.useState(false);
  const [showProductSelection, setShowProductSelection] = React.useState(false);
  const [showPurchaseOrder, setShowPurchaseOrder] = React.useState(false);
  const [showReceiving, setShowReceiving] = React.useState(false);
  const [showOrderSummary, setShowOrderSummary] = React.useState(false);
  const [selectedSupplier, setSelectedSupplier] = React.useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);
  const [barcodeDatabase, setBarcodeDatabase] = React.useState<Record<string, BarcodeProduct>>({});
  const [editingOrderId, setEditingOrderId] = React.useState<string | null>(null);
  const { i18n } = useTranslation();
  const dir = RTL_LANGS.includes(i18n.language) ? "rtl" : "ltr";

  // Update barcode database loading to refresh when localStorage changes
  React.useEffect(() => {
    const loadBarcodeDatabase = () => {
      const savedDatabase = localStorage.getItem('barcodeDatabase');
      if (savedDatabase) {
        try {
          const parsedDatabase = JSON.parse(savedDatabase);
          setBarcodeDatabase(parsedDatabase);
        } catch (error) {
          console.error('Error loading barcode database:', error);
        }
      }
    };

    loadBarcodeDatabase();

    // Listen for changes to barcodeDatabase in localStorage
    window.addEventListener('storage', (e) => {
      if (e.key === 'barcodeDatabase') {
        loadBarcodeDatabase();
      }
    });

    return () => {
      window.removeEventListener('storage', () => {});
    };
  }, []);

  const handleOCRResult = (items: ShippingItem[]) => {
    setShippingItems(items);
    setShowComparison(true);

    // Load barcode database and existing products
    const barcodeDatabase = JSON.parse(localStorage.getItem('barcodeDatabase') || '{}');
    const existingProducts = JSON.parse(localStorage.getItem('products') || '[]');
    const updatedProducts = [...existingProducts];

    // Process each scanned item
    items.forEach((item) => {
      if (item.barcode && barcodeDatabase[item.barcode]) {
        // If barcode exists in database, use that product info
        const dbProduct = barcodeDatabase[item.barcode];
        const existingIndex = updatedProducts.findIndex(p => p.barcode === item.barcode);

        if (existingIndex !== -1) {
          // Update existing product quantity
          updatedProducts[existingIndex].quantity += item.quantity;
        } else {
          // Add new product with database info
          updatedProducts.push({
            barcode: item.barcode,
            name: dbProduct.name,
            quantity: item.quantity,
            supplier: dbProduct.supplier || "Unknown",
            minStock: dbProduct.minStock || 0,
            price: 0,
            expiryDate: null,
          });
        }
      } else {
        // If no barcode match, add as new product with basic info
        const existingIndex = updatedProducts.findIndex(p => p.name === item.name);
        
        if (existingIndex !== -1) {
          updatedProducts[existingIndex].quantity += item.quantity;
        } else {
          updatedProducts.push({
            barcode: item.barcode || "",
            name: item.name,
            quantity: item.quantity,
            supplier: "Unknown",
            minStock: 0,
            price: 0,
            expiryDate: null,
          });
        }
      }
    });

    // Save updated products to localStorage
    localStorage.setItem('products', JSON.stringify(updatedProducts));
  };

  const handleCreatePurchaseOrder = (supplierId: string) => {
    setSelectedSupplier(supplierId);
    setShowPurchaseOrder(true);
  };

  const handleStartReceiving = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowReceiving(true);
  };

  const handleNewOrderClick = () => {
    setShowSupplierSelection(true);
  };

  const handleSupplierSelected = (supplierName: string) => {
    setSelectedSupplier(supplierName);
    setShowSupplierSelection(false);
    setShowProductSelection(true);
  };

  const handleViewOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowOrderSummary(true);
  };

  const handleEditOrder = (orderId: string) => {
    setEditingOrderId(orderId);
    setShowPurchaseOrder(true);
  };

  const handleClosePurchaseOrder = () => {
    setEditingOrderId(null);
    setShowPurchaseOrder(false);
    setSelectedSupplier(null);
  };

  return (
    <main className="min-h-screen bg-background px-8 py-8" dir={dir}>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary mb-2">ניהול רכש וקליטת סחורה</h1>
          <p className="text-muted-foreground">ניהול הזמנות רכש יומי וקליטת סחורה בזמן אמת.</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleNewOrderClick}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-4 h-4 ml-1" />
            הזמנה חדשה לספק
          </Button>
          <OCRShippingDocumentDialog onOCRResult={handleOCRResult} />
        </div>
      </div>

      <Tabs defaultValue="daily-management" dir="rtl">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily-management" className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            ניהול יומי
          </TabsTrigger>
          <TabsTrigger value="all-orders" className="flex items-center gap-2">
            <Archive className="w-4 h-4" />
            כל ההזמנות
          </TabsTrigger>
          <TabsTrigger value="shipping-documents" className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            תעודות משלוח
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily-management" className="space-y-6 mt-6">
          {/* דשבורד הזמנות שצריך לבצע היום */}
          <TodayOrdersBoard onCreateOrder={handleCreatePurchaseOrder} onViewOrder={handleViewOrder} />
          
          {/* דשבורד הזמנות שמיועדות להיקלט היום */}
          <TodayDeliveriesBoard onStartReceiving={handleStartReceiving} />
        </TabsContent>

        <TabsContent value="all-orders" className="mt-6">
          <AllOrdersTable onViewOrder={handleViewOrder} onEditOrder={handleEditOrder} />
        </TabsContent>

        <TabsContent value="shipping-documents" className="mt-6">
          {showComparison && shippingItems.length > 0 && (
            <div className="mb-8">
              <ShippingComparisonTable items={shippingItems} />
            </div>
          )}

          {!showComparison && (
            <div className="rounded-xl bg-card shadow border p-6 mt-8 text-center text-muted-foreground">
              <span>אין תעודות משלוח להצגה כרגע. השתמש בכלי OCR כדי לסרוק תעודת משלוח.</span>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <SupplierSelectionDialog
        open={showSupplierSelection}
        onClose={() => setShowSupplierSelection(false)}
        onSupplierSelected={handleSupplierSelected}
        barcodeDatabase={barcodeDatabase}
      />

      <ProductSelectionOrderDialog
        open={showProductSelection}
        onClose={() => setShowProductSelection(false)}
        supplierName={selectedSupplier}
        barcodeDatabase={barcodeDatabase}
      />

      <PurchaseOrderDialog
        open={showPurchaseOrder}
        onClose={handleClosePurchaseOrder}
        supplierId={selectedSupplier}
        editingOrderId={editingOrderId}
      />

      <ReceivingDialog
        open={showReceiving}
        onClose={() => setShowReceiving(false)}
        orderId={selectedOrderId}
      />

      <OrderSummaryDialog
        open={showOrderSummary}
        onClose={() => setShowOrderSummary(false)}
        orderId={selectedOrderId}
      />
    </main>
  );
};

export default Orders;
