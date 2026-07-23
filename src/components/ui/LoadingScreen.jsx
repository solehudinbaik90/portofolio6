import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { useTiles } from '../../contexts/TileContext';

export default function LoadingScreen() {
  const { progress, ready, revealChrome } = useTiles();
  const [gone, setGone] = useState(false);
  const overlayRef = useRef(null);
  const counterRef = useRef(null);
  const logoRef = useRef(null);
  const bootTime = useRef(performance.now());

  useLayoutEffect(() => {
    gsap.set([counterRef.current, logoRef.current], { scale: 0, opacity: 0 });
    const tl = gsap.timeline();
    tl.to([counterRef.current, logoRef.current], { scale: 1, opacity: 1, duration: 0.6, ease: 'expo.out' });
  }, []);

  useEffect(() => {
    if (counterRef.current) counterRef.current.textContent = `${Math.round(progress * 100)}%`;
  }, [progress]);

  useEffect(() => {
    if (!ready) return;
    const elapsed = performance.now() - bootTime.current;
    const delay = Math.max(0, 800 - elapsed);
    let tl = null;
    const id = setTimeout(() => {
      tl = gsap.timeline({ onComplete: () => setGone(true) });
      tl.to(counterRef.current, { scale: 0, opacity: 0, duration: 0.55, ease: 'expo.in' }, 0);
      tl.to(overlayRef.current, { autoAlpha: 0, duration: 0.35, ease: 'power2.in' }, '>-0.1');
      tl.call(revealChrome, [], '>-0.1');
    }, delay);
    return () => { clearTimeout(id); tl?.kill(); };
  }, [ready, revealChrome]);

  if (gone || true) return null;

  return (
    <>
      <div ref={overlayRef} className="fixed inset-0 z-5 bg-[#DDDDDD]" aria-hidden={ready}>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div ref={counterRef} className="text-center text-[96px] leading-none tracking-[-0.02em] text-black" style={{ willChange: 'transform, opacity' }}>
            0%
          </div>
        </div>
      </div>
      <img ref={logoRef} src="/media/icons/logo.svg" alt="" className="fixed left-1/2 top-[52px] z-5 -translate-x-1/2" style={{ willChange: 'transform, opacity' }} />
    </>
  );
}
