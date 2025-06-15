
-- יצירת טבלת ספקים עם הגדרות ימי אספקה ודדליינים
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  delivery_days TEXT[], -- מערך של ימי השבוע (monday, tuesday, etc.)
  deadline_hour TIME NOT NULL DEFAULT '10:00', -- שעת דדליין להזמנה
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- יצירת טבלת הזמנות רכש
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  supplier_id UUID REFERENCES public.suppliers(id) NOT NULL,
  delivery_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'received', 'partially_received')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- יצירת טבלת פריטי הזמנה
CREATE TABLE public.purchase_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT NOT NULL,
  ordered_quantity INTEGER NOT NULL DEFAULT 0,
  received_quantity INTEGER DEFAULT 0,
  unit_price DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- יצירת טבלת תיעוד קליטת סחורה
CREATE TABLE public.delivery_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID REFERENCES public.purchase_orders(id) NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  received_by TEXT,
  delivery_notes TEXT,
  attached_documents TEXT[], -- מערך של קישורים לקבצים מצורפים
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- יצירת טבלת לוג פעולות לקליטה
CREATE TABLE public.receiving_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID REFERENCES public.purchase_orders(id) NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('quantity_change', 'item_added', 'item_removed')),
  product_name TEXT NOT NULL,
  original_quantity INTEGER,
  new_quantity INTEGER,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- הוספת אינדקסים לביצועים טובים יותר
CREATE INDEX idx_purchase_orders_delivery_date ON public.purchase_orders(delivery_date);
CREATE INDEX idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX idx_purchase_orders_supplier ON public.purchase_orders(supplier_id);
CREATE INDEX idx_suppliers_delivery_days ON public.suppliers USING GIN(delivery_days);

-- הוספת RLS (Row Level Security) לטבלאות
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receiving_logs ENABLE ROW LEVEL SECURITY;

-- יצירת מדיניות גישה (כרגע ללא אימות - לצורך פיתוח)
CREATE POLICY "Allow all operations on suppliers" ON public.suppliers FOR ALL USING (true);
CREATE POLICY "Allow all operations on purchase_orders" ON public.purchase_orders FOR ALL USING (true);
CREATE POLICY "Allow all operations on purchase_order_items" ON public.purchase_order_items FOR ALL USING (true);
CREATE POLICY "Allow all operations on delivery_receipts" ON public.delivery_receipts FOR ALL USING (true);
CREATE POLICY "Allow all operations on receiving_logs" ON public.receiving_logs FOR ALL USING (true);

-- הוספת נתוני דוגמה לספקים
INSERT INTO public.suppliers (name, contact_email, contact_phone, delivery_days, deadline_hour, notes) VALUES 
('ספק הירקות', 'vegetables@supplier.com', '050-1234567', ARRAY['sunday', 'tuesday', 'thursday'], '09:00', 'ספק ירקות טריים'),
('ספק המשקאות', 'drinks@supplier.com', '050-2345678', ARRAY['monday', 'wednesday'], '10:30', 'משקאות קלים וחמים'),
('ספק המוצרים היבשים', 'dry@supplier.com', '050-3456789', ARRAY['sunday', 'wednesday'], '11:00', 'דגנים וקטניות');
