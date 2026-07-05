import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      status: {
        active: "border-transparent bg-success text-success-foreground",
        inactive: "border-transparent bg-muted text-muted-foreground",
        pending: "border-transparent bg-warning text-warning-foreground",
        rejected: "border-transparent bg-destructive text-destructive-foreground",
        draft: "border-border bg-background text-muted-foreground",
        verified: "border-transparent bg-success/20 text-success dark:text-success",
        distributed: "border-transparent bg-info text-info-foreground",
        completed: "border-transparent bg-success text-success-foreground",
        cancelled: "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      status: "active",
    },
  }
);

const statusLabels: Record<string, string> = {
  active: "Aktif",
  inactive: "Nonaktif",
  pending: "Menunggu",
  rejected: "Ditolak",
  draft: "Draft",
  verified: "Terverifikasi",
  distributed: "Terdistribusi",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export interface StatusBadgeProps {
  status: string;
  className?: string;
  animated?: boolean;
}

export function StatusBadge({ status, className, animated }: StatusBadgeProps) {
  const normalized = status.toLowerCase();
  const badge = (
    <span className={cn(statusBadgeVariants({ status: normalized as any }), className)}>
      {animated && (
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current animate-pulse-soft" />
      )}
      {statusLabels[normalized] || status}
    </span>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="inline-flex"
      >
        {badge}
      </motion.div>
    );
  }

  return badge;
}
