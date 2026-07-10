import { format, isToday, isThisWeek, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

export function formatTime(iso: string): string {
  try {
    const date = parseISO(iso);
    if (isToday(date))    return format(date, "h:mm a");
    if (isThisWeek(date)) return format(date, "EEE h:mm a");
    return                       format(date, "MMM d · h:mm a");
  } catch {
    return "";
  }
}

export function Timestamp({ value, align = "left" }: { value?: string; align?: "left" | "right" }) {
  if (!value) return null;
  return (
    <time
      dateTime={value}
      title={new Date(value).toLocaleString()}
      className={cn(
        "block text-[10px] text-muted-foreground select-none tabular-nums",
        align === "right" && "text-right",
      )}
    >
      {formatTime(value)}
    </time>
  );
}
