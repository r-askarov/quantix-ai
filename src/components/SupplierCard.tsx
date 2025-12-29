
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Edit, ArrowRight, Package } from "lucide-react";

interface SupplierCardProps {
  supplierName: string;
  deliveryDays?: string[];
  deadlineHour?: string;
  onNewOrder: (supplierName: string) => void;
  onViewSupplier: (supplierName: string) => void;
  onViewProducts?: (supplierName: string) => void;
  orderStatus?: string;
  nextDeliveryDate?: string;
}

const weekdayLabels: Record<string, string> = {
  sunday: "ראשון",
  monday: "שני",
  tuesday: "שלישי",
  wednesday: "רביעי",
  thursday: "חמישי",
  friday: "שישי",
  saturday: "שבת"
};

const SupplierCard: React.FC<SupplierCardProps> = ({
  supplierName,
  deliveryDays = [],
  deadlineHour,
  onNewOrder,
  onViewSupplier,
  onViewProducts,
  orderStatus,
  nextDeliveryDate
}) => {
  return (
    <div className="bg-card border rounded-xl p-6 flex flex-col gap-4 shadow transition hover:shadow-lg">
      <div className="flex gap-3 items-center justify-between">
        <div>
          <h2 className="font-bold text-xl">{supplierName}</h2>
          <div className="text-sm text-muted-foreground flex flex-wrap gap-2 mt-1">
            {deliveryDays.length > 0 && (
              <span>
                ימי אספקה: {deliveryDays.map(day => weekdayLabels[day] ?? day).join(", ")}
              </span>
            )}
            {deadlineHour && (
              <span className="inline-block mr-4 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                דדליין: עד {deadlineHour}
              </span>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="font-medium"
          onClick={() => onNewOrder(supplierName)}
        >
          <Edit className="w-4 h-4 ml-1" />
          הזמנה חדשה
        </Button>
      </div>

      <div className="flex items-center justify-between gap-2 text-sm mt-2">
        <div>
          {orderStatus ? (
            <>
              סטטוס הזמנה: <span className="font-bold">{orderStatus}</span>
              {nextDeliveryDate && (
                <span className="ml-2 flex items-center">
                  <Calendar className="w-4 h-4 inline-block mr-1" />
                  {nextDeliveryDate}
                </span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">לא הוזמנו הזמנות לאחרונה</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="inline-flex items-center gap-1 text-blue-700 font-semibold"
            onClick={() => onViewSupplier(supplierName)}
          >
            מעבר לספק <ArrowRight className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            className="inline-flex items-center gap-1 text-gray-700"
            onClick={() => onViewProducts(supplierName)}
          >
            <Package className="w-4 h-4 ml-1" />
            הצג מוצרים
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SupplierCard;
