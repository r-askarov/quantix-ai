
import * as React from "react";
import { cn } from "@/lib/utils";

type DashboardCardProps = {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: string;
  color?: string; // tailwind gradient string
};

const DashboardCard = ({ title, value, icon, change, color }: DashboardCardProps) => (
  <div
    className={cn(
      "rounded-xl bg-gradient-to-l shadow border border-border p-6 flex flex-col gap-2 h-full min-w-0",
      color ? `from-25% ${color}` : "from-primary to-secondary"
    )}
    style={{ minHeight: 135 }}
  >
    <div className="flex items-center justify-between mb-1">
      <span className="text-lg font-bold tracking-tight text-white">{title}</span>
      {icon && <span>{icon}</span>}
    </div>
    <span className="text-3xl font-extrabold text-white">{value}</span>
    {change && <span className="text-sm mt-2 text-white">{change}</span>}
  </div>
);

export default DashboardCard;
