
import DashboardCard from "@/components/DashboardCard";
import InventoryTable from "@/components/InventoryTable";
import StatsChart from "@/components/StatsChart";
import NotificationsPanel from "@/components/NotificationsPanel";
import { ArrowDown, ArrowUp } from "lucide-react";
import * as React from "react";
import HeadNav from "@/components/HeadNav";

const Index = () => {
  React.useEffect(() => {
    document.body.dir = "rtl";
    document.body.lang = "he";
  }, []);

  return (
    <main className="min-h-screen bg-background flex flex-col gap-10 px-8 py-8"  dir="rtl" lang="he">
      <HeadNav />
      {/* Header */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-2 select-none">
        <h1 className="text-4xl font-black tracking-tight text-primary mb-1">Quantix – ניהול מלאי חכם</h1>
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
          <InventoryTable />
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
