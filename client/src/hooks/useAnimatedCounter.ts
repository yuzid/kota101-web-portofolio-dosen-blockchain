import { useEffect, useState } from "react";
import { useMotionValue, useSpring, useTransform } from "motion/react";

export function useAnimatedCounter(to: number, delay = 0) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 60, damping: 20 });
  const rounded = useTransform(spring, (v) => Math.round(v));
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsInView(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (isInView) motionValue.set(to);
  }, [isInView, to, motionValue]);

  return { count: rounded, isAnimating: isInView };
}
