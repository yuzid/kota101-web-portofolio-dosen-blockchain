import { motion } from "motion/react";
import type { HTMLMotionProps } from "motion/react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const tableVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
};

export interface AnimatedTableProps extends HTMLMotionProps<"table"> {
  children: React.ReactNode;
}

export const AnimatedTable = forwardRef<HTMLTableElement, AnimatedTableProps>(
  ({ className, children, ...props }, ref) => (
    <motion.table
      ref={ref}
      variants={tableVariants}
      initial="hidden"
      animate="visible"
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    >
      {children}
    </motion.table>
  )
);

export interface AnimatedTableRowProps extends HTMLMotionProps<"tr"> {
  children: React.ReactNode;
}

export const AnimatedTableRow = forwardRef<HTMLTableRowElement, AnimatedTableRowProps>(
  ({ className, children, ...props }, ref) => (
    <motion.tr
      ref={ref}
      variants={rowVariants}
      whileHover={{ backgroundColor: "var(--muted)", transition: { duration: 0.15 } }}
      className={cn("transition-colors", className)}
      {...props}
    >
      {children}
    </motion.tr>
  )
);

export { tableVariants, rowVariants };
