
import * as React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "קופסת ברגים", quantity: 87 },
  { name: "פלאייר מקצועי", quantity: 38 },
  { name: "דבק אפוקסי", quantity: 17 },
  { name: "ארגז כלים", quantity: 4 },
  { name: "מברגת בוש", quantity: 0 },
];

const StatsChart = () => (
  <div className="w-full h-56 flex items-end">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" hide />
        <YAxis dataKey="name" type="category" width={90} />
        <Tooltip />
        <Bar dataKey="quantity" fill="#2563eb" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default StatsChart;
