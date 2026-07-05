import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const roleBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      role: {
        admin: "border-transparent bg-destructive text-destructive-foreground",
        staf_tu: "border-transparent bg-info text-info-foreground",
        dosen: "border-transparent bg-success text-success-foreground",
        kaprodi: "border-transparent bg-purple-500 text-white",
        kajur: "border-transparent bg-warning text-warning-foreground",
      },
    },
    defaultVariants: {
      role: "dosen",
    },
  }
);

const roleLabels: Record<string, string> = {
  admin: "Admin",
  staf_tu: "Staf TU",
  dosen: "Dosen",
  kaprodi: "Kaprodi",
  kajur: "Kajur",
};

export interface RoleBadgeProps {
  role: string;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const normalizedRole = role.toLowerCase().replace(/\s+/g, "_");
  return (
    <span className={cn(roleBadgeVariants({ role: normalizedRole as any }), className)}>
      {roleLabels[normalizedRole] || role}
    </span>
  );
}
