import { useEffect, useRef, useState } from "react";

import { motionSeconds } from "@/lib/motion";

/**
 * Counts up to `target` (eased, over --motion-draw), from 0 on mount and from
 * the shown value when the target changes. Instant when motion is reduced.
 */
export function useCountUp(target: number) {
  const [value, setValue] = useState(() =>
    motionSeconds("--motion-draw") ? 0 : target,
  );
  const shown = useRef(value);

  useEffect(() => {
    const from = shown.current;
    const duration = motionSeconds("--motion-draw") * 1000;
    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const progress = duration ? Math.min(1, (now - start) / duration) : 1;
      shown.current = from + (target - from) * (1 - (1 - progress) ** 3);
      setValue(shown.current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return value;
}
