import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Input } from "./input";
import { Button } from "./button";
import { Search, X, SlidersHorizontal } from "lucide-react";

export interface FilterBarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  children?: React.ReactNode;
  hasActiveFilters?: boolean;
  onResetFilters?: () => void;
  className?: string;
}

export function FilterBar({
  searchPlaceholder = "Cari...",
  searchValue,
  onSearchChange,
  children,
  hasActiveFilters,
  onResetFilters,
  className,
}: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {children && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="h-9"
          >
            <SlidersHorizontal className="w-4 h-4 mr-1.5" />
            Filter
          </Button>
        )}

        {hasActiveFilters && onResetFilters && (
          <Button variant="ghost" size="sm" onClick={onResetFilters} className="h-9">
            <X className="w-4 h-4 mr-1.5" />
            Reset
          </Button>
        )}
      </div>

      <AnimatePresence>
        {showFilters && children && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-wrap gap-3 overflow-hidden"
          >
            <div className="pt-1 pb-2 flex flex-wrap gap-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
