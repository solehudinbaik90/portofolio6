import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { usePopup } from '../../contexts/PopupContext';
import ContactButtons from '../ui/ContactButtons';

export default function ContactPanel() {
  const { popup } = usePopup();
  const isOpen = popup === 'contact';
  const ref = useRef(null);
  const init = useRef(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!init.current) {
      init.current = true;
      gsap.set(el, { scale: +!!isOpen, opacity: +!!isOpen, y: isOpen ? 0 : -24 });
      return;
    }
    if (isOpen) {
      gsap.to(el, { scale: 1, y: 0, duration: 0.6, ease: 'power2.out' });
      gsap.to(el, { opacity: 1, duration: 0.3, ease: 'power2.out' });
    } else {
      gsap.to(el, { scale: 0, y: -24, duration: 0.6, ease: 'power2.out' });
      gsap.to(el, { opacity: 0, duration: 0.3, ease: 'power2.in' });
    }
  }, [isOpen]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[112px] z-20 flex justify-center px-4">
      <div
        ref={ref}
        role="dialog"
        aria-label="Contact"
        aria-hidden={!isOpen}
        inert={!isOpen}
        style={{ transformOrigin: '50% 0%', transform: 'scale(0)', opacity: 0, pointerEvents: isOpen ? 'auto' : 'none' }}
        className="ui-shadow flex w-full max-w-[367px] flex-col gap-4 rounded-2xl bg-white p-4"
      >
        <ContactButtons />
        <video
          src="/contact.mp4"
          autoPlay
          loop
          muted
          playsInline
          aria-hidden
          className="block h-auto w-full rounded-lg"
        />
      </div>
    </div>
  );
}
