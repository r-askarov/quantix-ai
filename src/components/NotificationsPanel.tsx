
import * as React from "react";
import { AlertCircle } from "lucide-react";

const notifications = [
  {
    title: "התראה: מלאי נמוך",
    desc: "מלאי של 'מברגת בוש' ירד לאפס. הזמנה מחדש נדרשת.",
    level: "error",
  },
  {
    title: "הצעה: הזמנה חוזרת",
    desc: "בתחזית החודשית – מומלץ לחדש את המלאי של דבק אפוקסי.",
    level: "info",
  },
];

const colorByLevel = {
  error: "bg-red-50 border-red-400 text-red-800",
  info: "bg-blue-50 border-blue-400 text-blue-900",
};

const NotificationsPanel = () => (
  <div className="flex flex-col gap-3 w-[50%]" aria-live="polite">
    <h3 className="text-lg font-bold mb-1 flex items-center gap-2"><AlertCircle size={18} className="text-primary" /> התראות אחרונות</h3>
    {notifications.map((n, idx) => (
      <div key={idx} className={`rounded-lg border-l-4 px-4 py-3 mb-1 shadow-sm transition ${colorByLevel[n.level as keyof typeof colorByLevel]} `}>
        <div className="flex flex-row items-center gap-2">
          <AlertCircle size={16} className={n.level === "error" ? "text-red-500" : "text-blue-500"} />
          <span className="font-semibold">{n.title}</span>
        </div>
        <div className="text-sm mt-1">{n.desc}</div>
      </div>
    ))}
  </div>
);

export default NotificationsPanel;
