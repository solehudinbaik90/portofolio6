import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { usePopup } from '../../contexts/PopupContext';
import ContactButtons from '../ui/ContactButtons';

export default function CompletePanel() {
  const { popup } = usePopup();
  const isOpen = popup === 'complete';
  const ref = useRef(null);
  const init = useRef(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!init.current) {
      init.current = true;
      gsap.set(el, { scale: +!!isOpen, opacity: +!!isOpen, y: isOpen ? 0 : 24 });
      return;
    }
    if (isOpen) {
      gsap.to(el, { scale: 1, y: 0, duration: 0.6, ease: 'power2.out' });
      gsap.to(el, { opacity: 1, duration: 0.3, ease: 'power2.out' });
    } else {
      gsap.to(el, { scale: 0, y: 24, duration: 0.6, ease: 'power2.out' });
      gsap.to(el, { opacity: 0, duration: 0.3, ease: 'power2.in' });
    }
  }, [isOpen]);

  return (
    <div className="pointer-events-none fixed bottom-[112px] right-8 z-10">
      <div
        ref={ref}
        role="dialog"
        aria-label="Thank you"
        aria-hidden={!isOpen}
        inert={!isOpen}
        style={{ transformOrigin: '100% 100%', transform: 'scale(0)', opacity: 0, pointerEvents: isOpen ? 'auto' : 'none' }}
        className="ui-shadow flex w-[367px] max-w-[calc(100vw-64px)] flex-col gap-4 overflow-hidden rounded-2xl bg-white p-4"
      >
        <div className="flex items-start justify-between gap-3 border-b border-black/15 pb-4">
          <p className="text-[24px] leading-none tracking-[-0.01em] text-black">Thanks for caring!</p>
          <svg width="24" height="24" viewBox="0 0 24 24" className="shrink-0" aria-hidden>
            <path d="M15.75 0C17.938 2.34742e-07 20.0366 0.869085 21.5837 2.41626C23.1309 3.96343 24 6.06196 24 8.25C24 10.438 23.1309 12.5366 21.5837 14.0837C21.2566 14.4109 20.9046 14.7076 20.5324 14.9722C20.3535 15.0994 20.33 15.3597 20.4851 15.5149C22.4395 17.4693 23.6502 20.0282 23.935 22.7522C24.0068 23.4388 23.4404 24 22.75 24H16.25C15.5596 24 15.0238 23.4167 14.744 22.7856C14.2778 21.7337 13.2246 21 12 21C10.7754 21 9.72218 21.7337 9.25598 22.7856C8.97624 23.4167 8.44036 24 7.75 24H1.25C0.559644 24 -0.00675183 23.4388 0.0650234 22.7522C0.349774 20.0282 1.56053 17.4693 3.51489 15.5149C3.66996 15.3598 3.64621 15.0994 3.4675 14.9723C3.09534 14.7077 2.74344 14.4109 2.41626 14.0837C0.869085 12.5366 6.955e-08 10.438 0 8.25C9.38188e-08 6.06196 0.869085 3.96343 2.41626 2.41626C3.96343 0.869085 6.06196 2.34742e-07 8.25 0C9.49264 0 10.5 1.00736 10.5 2.25C10.5 3.49264 9.49264 4.5 8.25 4.5C9.49264 4.5 10.5 5.50736 10.5 6.75C10.5 7.55705 10.0751 8.26486 9.43678 8.66192C8.85059 9.02656 8.25 9.55964 8.25 10.25V11.66C8.25 12.1239 8.70415 12.4526 9.15483 12.3428C9.28672 12.3107 9.41925 12.2808 9.55234 12.2531C9.67001 12.2286 9.75 12.1202 9.75 12C9.75 10.7574 10.7574 9.75 12 9.75C13.2426 9.75 14.25 10.7574 14.25 12C14.25 12.1202 14.3296 12.2286 14.4473 12.2531C14.5805 12.2808 14.713 12.3107 14.845 12.3428C15.2957 12.4526 15.75 12.1238 15.75 11.6598V10.25C15.75 9.55964 15.1494 9.02656 14.5632 8.66192C13.9249 8.26486 13.5 7.55705 13.5 6.75C13.5 5.50736 14.5074 4.5 15.75 4.5C14.5074 4.5 13.5 3.49264 13.5 2.25C13.5 1.00736 14.5074 0 15.75 0Z" fill="black" fillOpacity="0.33" />
          </svg>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-[14px] leading-[120%] tracking-[-0.01em] text-black">
            It means the world that you have spent your valuable time to go through this site.
            If you'd like to make an inquiry or say hello, please feel free to reach out:
          </p>
          <ContactButtons />
        </div>

        <img src="/thank-you.png" alt="" draggable={false} className="block h-[214px] w-full rounded-xl object-cover" />
      </div>
    </div>
  );
}
