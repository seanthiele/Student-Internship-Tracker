import { Badge } from "@/components/ui/badge";

export function InternshipStatusBadge({ status, className }: { status: string, className?: string }) {
  const config: Record<string, { label: string, classes: string }> = {
    applied: { label: "Applied", classes: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800" },
    interviewing: { label: "Interviewing", classes: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800" },
    offered: { label: "Offered", classes: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800" },
    accepted: { label: "Accepted", classes: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800" },
    rejected: { label: "Rejected", classes: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800" },
    withdrawn: { label: "Withdrawn", classes: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700" },
  };

  const { label, classes } = config[status] || { label: status, classes: "" };

  return <Badge variant="outline" className={`${classes} ${className || ""}`}>{label}</Badge>;
}
