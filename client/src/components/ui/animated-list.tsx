import * as React from "react";
import { motion } from "motion/react";
import {
  staggerContainerVariants,
  staggerItemVariants,
} from "../../hooks/useStaggerFade";

interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
}

function AnimatedList({ children, className }: AnimatedListProps) {
  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedListItemProps {
  children: React.ReactNode;
  className?: string;
}

function AnimatedListItem({ children, className }: AnimatedListItemProps) {
  return (
    <motion.div variants={staggerItemVariants} className={className}>
      {children}
    </motion.div>
  );
}

export { AnimatedList, AnimatedListItem };
