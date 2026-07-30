import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { useTiles } from '../../contexts/TileContext';

const MIN_DISPLAY_MS = 800;

const NAME_ROWS = [
  ['Hamza', 'Tariq'],
  ['Design', 'etc.'],
];

export default function LoadingScreen() {
  const { progress, ready, revealChrome } = useTiles();
  const [gone, setGone] = useState(false);

  const overlayRef = useRef(null);
  const counterRef = useRef(null);
  const nameRef = useRef(null);
  const logoRef = useRef(null);
  const bootTime = useRef(performance.now());

  useLayoutEffect(() => {
    gsap.set([counterRef.current, logoRef.current], { scale: 0, opacity: 0 });
    gsap.set(logoRef.current, { xPercent: -50 });
    gsap.set(nameRef.current, { scale: 0, opacity: 0 });

    const tl = gsap.timeline();
    tl.to([counterRef.current, logoRef.current], {
      scale: 1,
      duration: 1,
      ease: 'expo.out',
    }, 0);
    tl.to([counterRef.current, logoRef.current], {
      opacity: 1,
      duration: 1,
      ease: 'power2.out',
    }, 0);
    tl.to(nameRef.current, {
      scale: 1,
      opacity: 1,
      duration: 0.4,
      ease: 'power2.out',
    }, 0);

    return () => tl.kill();
  }, []);

  useEffect(() => {
    if (counterRef.current) {
      counterRef.current.textContent = `${Math.round(progress * 100)}%`;
    }
  }, [progress]);

  useEffect(() => {
    if (!ready) return;

    const elapsed = performance.now() - bootTime.current;
    const delay = Math.max(0, MIN_DISPLAY_MS - elapsed);
    let tl = null;

    const timerId = window.setTimeout(() => {
      tl = gsap.timeline({ onComplete: () => setGone(true) });

      tl.to(nameRef.current, { scale: 0, opacity: 0, duration: 0.3, ease: 'power2.in' }, 0);

      tl.to(counterRef.current, { scale: 0, duration: 0.55, ease: 'expo.in' }, 0);
      tl.to(counterRef.current, { opacity: 0, duration: 0.55, ease: 'power2.out' }, 0);

      tl.to(overlayRef.current, {
        autoAlpha: 0,
        duration: 0.35,
        ease: 'power2.in',
      }, '>-0.1');

      tl.call(revealChrome, [], '>-0.1');
    }, delay);

    return () => {
      window.clearTimeout(timerId);
      tl?.kill();
    };
  }, [ready, revealChrome]);

  if (gone) return null;

  return (
    <>

      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 bg-[#DDDDDD]"
        aria-hidden={ready}
      >

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            ref={counterRef}
            className="text-center text-[96px] leading-none tracking-[-0.02em] text-black"
            style={{ willChange: 'transform, opacity' }}
          >
            0%
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div
            ref={nameRef}
            className="text-center text-[20px] leading-none text-black"
            style={{ willChange: 'transform, opacity' }}
          >
            {NAME_ROWS.map((row, ri) => (
              <div key={ri} className="flex justify-center gap-[0.25em]">
                {row.map((word, wi) => (
                  <span key={wi} className="inline-block">
                    {word}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <img
        ref={logoRef}
        src="/media/icons/logo.svg"
        alt=""
        className="fixed left-1/2 top-[52px] z-50"
        style={{ willChange: 'transform, opacity' }}
      />
    </>
  );
}
