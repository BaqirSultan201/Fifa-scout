import { useEffect, useRef, useState } from "react";

export default function AnimatedCounter({
  value = 0,
  duration = 1200,
  format = (v) => Math.round(v).toLocaleString(),
  className,
}) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef(null);
  const fromRef = useRef(0);

  useEffect(() => {
    fromRef.current = display;
    startRef.current = null;
    let raf;
    const step = (t) => {
      if (!startRef.current) startRef.current = t;
      const elapsed = t - startRef.current;
      const p = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(fromRef.current + (value - fromRef.current) * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line
  }, [value]);

  return <span className={className}>{format(display)}</span>;
}
