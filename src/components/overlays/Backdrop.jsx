import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { usePopup } from '../../contexts/PopupContext';

export default function Backdrop() {
  const { popup, setPopup } = usePopup();
  const isOpen = popup === 'info' || popup === 'contact' || popup === 'complete';
  const ref = useRef(null);
  const init = useRef(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!init.current) {
      init.current = true;
      gsap.set(el, { opacity: +!!isOpen });
      return;
    }
    gsap.to(el, { opacity: +!!isOpen, duration: isOpen ? 0.3 : 0.3, ease: 'power2.out' });
  }, [isOpen]);

  return (
    <button
      ref={ref}
      type="button"
      aria-label="Close"
      aria-hidden={!isOpen}
      inert={!isOpen}
      onClick={() => setPopup(null)}
      className="fixed inset-0 z-10 cursor-default"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        opacity: 0,
        pointerEvents: isOpen ? 'auto' : 'none',
      }}
    />
  );
}
