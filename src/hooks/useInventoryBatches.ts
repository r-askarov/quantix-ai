
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
    /**
     * Because inventory_batches is NOT in the generated Supabase types yet,
     * we must explicitly cast the query and results to 'any'.
     * TODO: After types are regenerated, remove these casts and update types properly.
     */
    const { data } = await ((supabase as any)
      .from("inventory_batches")
      .select("*")
      .order("product_name")
      .order("expiry_date", { ascending: true }));

    // Explicitly cast to InventoryBatch[]
    if (data) setBatches(data as InventoryBatch[]);
    setLoading(false);
  };

  React.useEffect(() => {
    fetchBatches();
  }, []);

  // פונקציה לחידוש
  const reload = fetchBatches;

  return { batches, loading, reload };
}
