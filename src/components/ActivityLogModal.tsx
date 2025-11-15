import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  LogOut,
  LogIn,
} from "lucide-react";

const ActivityLogModal = ({ open, onOpenChange, log }: { open: boolean; onOpenChange: (open: boolean) => void; log: any[] }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent dir="rtl">
      <DialogHeader>
        <DialogTitle>יומן פעולות</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
        {log.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">אין פעולות להצגה</div>
        ) : (
          log.map((entry, i) => (
            <div key={i} className="flex items-center gap-3 border-b py-2">
              {entry.type === "withdraw" ? <LogOut className="text-red-600" size={20} /> : <LogIn className="text-green-600" size={20} />}
              <div className="flex flex-col text-sm">
                <span className="font-bold">{entry.type === "withdraw" ? "משיכה מהמלאי" : "הוספה למלאי"}</span>
                <span>מוצר: {entry.name || entry.barcode}</span>
                <span>כמות: {entry.quantity}</span>
                <span className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })} {new Date(entry.date).toLocaleDateString("he-IL")}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </DialogContent>
  </Dialog>
);

export default ActivityLogModal;
