
/**
 * רשומת מלאי לפי batch אחד
 */
export interface InventoryBatch {
  id: string; // מזהה פנימי
  barcode: string;
  product_name: string;
  expiry_date?: string | null; // תאריך תפוגה, ISO (אופציונלי)
  quantity: number;
  supplier?: string | null;
  received_at: string; // תאריך קבלה
  unit_price: number;
  created_at: string;
}
