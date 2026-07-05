import * as React from "react";
import { motion } from "motion/react";
import { pageVariants, pageTransition } from "../../hooks/usePageTransition";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export { PageTransition };
