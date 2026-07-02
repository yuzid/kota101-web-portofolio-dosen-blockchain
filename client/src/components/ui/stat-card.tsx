import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const colorMap: Record<string, string> = {
  primary: "ring-primary/20 bg-primary/5",
  emerald: "ring-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/30",
  amber: "ring-amber-500/20 bg-amber-50 dark:bg-amber-950/30",
  purple: "ring-purple-500/20 bg-purple-50 dark:bg-purple-950/30",
  blue: "ring-blue-500/20 bg-blue-50 dark:bg-blue-950/30",
  rose: "ring-rose-500/20 bg-rose-50 dark:bg-rose-950/30",
};

function getRingIconColor(color: string): string {
  const map: Record<string, string> = {
    primary: "text-primary",
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    purple: "text-purple-600 dark:text-purple-400",
    blue: "text-blue-600 dark:text-blue-400",
    rose: "text-rose-600 dark:text-rose-400",
  };
  return map[color] || "text-primary";
}

export interface StatCardProps {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  color?: string;
  className?: string;
}

import { AnimatedCounter } from "./animated-counter";

export function StatCard({ icon, value, label, color = "primary", className }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={cn(
        "rounded-xl ring-1 p-4 transition-all duration-200 hover:shadow-md hover:shadow-primary/5",
        colorMap[color],
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn("shrink-0", getRingIconColor(color))}>{icon}</div>
        <div className="min-w-0">
          <p className="text-xl font-bold tabular-nums leading-none">
            <AnimatedCounter value={value} />
          </p>
          <p className="text-xs text-muted-foreground mt-1 truncate">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}
