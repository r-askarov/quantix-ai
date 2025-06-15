
// טען את האצוות מהדטה בייס (עם טיפוס any ל-support זמני)
import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { InventoryBatch } from "@/types/inventory";

/**
 * Hook לטעינת/עדכון אצוות מלאי
 */
export function useInventoryBatches() {
  const [batches, setBatches] = React.useState<InventoryBatch[]>([]);
  const [loading, setLoading] = React.useState(true);

  // טען את האצוות מהדטה בייס
  const fetchBatches = async () => {
    setLoading(true);
    // טיפוס any כדי לעקוף את בעיית השדות שלא קיימים בסוגים הגנריים כרגע
    const { data, error } = await supabase
      .from<any>("inventory_batches")
      .select("*")
      .order("product_name")
      .order("expiry_date", { ascending: true });

    if (data) setBatches(data);
    setLoading(false);
  };

  React.useEffect(() => {
    fetchBatches();
  }, []);

  // פונקציה לחידוש
  const reload = fetchBatches;

  return { batches, loading, reload };
}
