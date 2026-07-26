/**
 * `useReducedMotion` — whether the OS "reduce motion" accessibility setting is
 * on. Cross-platform: backed by `AccessibilityInfo`, which react-native-web maps
 * to the `prefers-reduced-motion` media query. Components use it to skip or
 * shorten entrance/layout animations.
 */
import * as React from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduced(value);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  return reduced;
}
