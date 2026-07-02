import { useEffect, useState } from "react";
import { useMotionValue, useSpring, useTransform } from "motion/react";

interface AnimatedCounterProps {
  value: number | string;
  delay?: number;
}

export function AnimatedCounter({ value, delay = 0 }: AnimatedCounterProps) {
  const numericValue = typeof value === "number" ? value : parseFloat(value) || 0;
  
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 60, damping: 20 });
  const rounded = useTransform(spring, (v) => Math.round(v));
  
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      motionValue.set(numericValue);
    }, delay * 1000);
    return () => clearTimeout(timer);
  }, [numericValue, motionValue, delay]);

  useEffect(() => {
    return rounded.on("change", (v) => {
      setDisplayValue(v);
    });
  }, [rounded]);

  if (typeof value === "string" && isNaN(parseFloat(value))) {
    return <span>{value}</span>;
  }

  const suffix = typeof value === "string" && value.endsWith("%") ? "%" : "";

  return (
    <span>
      {displayValue}
      {suffix}
    </span>
  );
}
