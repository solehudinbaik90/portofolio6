import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';


export function useAnimatedToggle(visible, { showAnim, hideAnim } = {}) {
  const ref = useRef(null);
  const initialized = useRef(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!initialized.current) {
      initialized.current = true;
      gsap.set(el, { scale: visible ? 1 : 0, opacity: visible ? 1 : 0 });
      return;
    }
    if (visible) {
      gsap.to(el, { scale: 1, ...(showAnim || { duration: 0.4, ease: 'power2.out' }) });
      gsap.to(el, { opacity: 1, duration: 0.3, ease: 'power2.out' });
    } else {
      gsap.to(el, { scale: 0, ...(hideAnim || { duration: 0.3, ease: 'power2.in' }) });
      gsap.to(el, { opacity: 0, duration: 0.2, ease: 'power2.in' });
    }
  }, [visible]);

  return ref;
}
