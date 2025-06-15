
-- יצירת טבלת inventory_batches לאצוות המלאי
create table public.inventory_batches (
  id uuid not null default gen_random_uuid() primary key,
  barcode text not null,
  product_name text not null,
  expiry_date date,
  quantity integer not null default 0,
  supplier text,
  received_at timestamp with time zone not null default now(),
  unit_price numeric not null default 0,
  created_at timestamp with time zone not null default now()
);

-- הפעלת מדיניות Row-Level Security
alter table public.inventory_batches enable row level security;

-- מתן הרשאות קריאה לכל המשתמשים (ניתן לשנות זאת בעתיד)
create policy "Allow read to all users"
  on public.inventory_batches
  for select
  using (true);

-- מתן הרשאות כתיבה (ניתן לעדכן זאת בהמשך בהתאם לדרישות אבטחה)
create policy "Allow insert to all users"
  on public.inventory_batches
  for insert
  with check (true);

create policy "Allow update to all users"
  on public.inventory_batches
  for update
  using (true);

create policy "Allow delete to all users"
  on public.inventory_batches
  for delete
  using (true);
