import { useRef, useState, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { usePopup } from '../../contexts/PopupContext';
import { useFocus } from '../../contexts/FocusContext';
import { useTiles } from '../../contexts/TileContext';
import { useHoverDevice } from '../../hooks/useHoverDevice';
import { useAnimatedToggle } from '../../hooks/useAnimatedToggle';

const ITEM_SIZE = 72;

function offsetsForVisible(visibilities) {
  const total = visibilities.length;
  const half = (total - 1) / 2;
  const active = visibilities.map((v, i) => (v ? i : -1)).filter((i) => i >= 0);
  if (active.length === 0) return visibilities.map(() => 0);
  const activeHalf = (active.length - 1) / 2;
  return visibilities.map((v, i) => {
    if (!v) return 0;
    const activeIdx = active.indexOf(i);
    return (activeIdx - activeHalf) * ITEM_SIZE - (i - half) * ITEM_SIZE;
  });
}

export default function NavBar() {
  const { popup, setPopup } = usePopup();
  const { focusedId, isClosing, setFocusedId } = useFocus();
  const { chromeRevealed } = useTiles();
  const isHover = useHoverDevice();

  const focusActive = focusedId !== null && !isClosing;
  const infoOpen = popup === 'info';
  const contactOpen = popup === 'contact';
  const completeOpen = popup === 'complete';
  const projectOpen = popup === 'project';

  const infoVisible = !focusActive && !contactOpen && !completeOpen;
  const homeVisible = !contactOpen && !completeOpen;
  const contactVisible = !infoOpen && !completeOpen;

  const infoRef = useRef(null);
  const homeRef = useRef(null);
  const contactRef = useRef(null);
  const hintRef = useRef(null);
  const navInit = useRef(false);

  const hint = isHover ? 'Hover, drag, and click to explore.' : 'Drag and tap to explore.';

  const hintInit = useRef(false);
  const hintDismissed = useRef(false);

  useLayoutEffect(() => {
    if (!chromeRevealed || !hintRef.current) return;
    if (!hintInit.current) {
      hintInit.current = true;
      gsap.set(hintRef.current, { scale: 0, opacity: 0 });
    }
    if (!hintDismissed.current) {
      gsap.to(hintRef.current, { scale: 1, opacity: 1, duration: 0.4, ease: 'power2.out' });
    }
    const dismiss = () => {
      if (hintDismissed.current) return;
      hintDismissed.current = true;
      gsap.to(hintRef.current, { scale: 0, opacity: 0, duration: 0.3, ease: 'power2.in' });
      window.removeEventListener('pointerdown', dismiss);
    };
    window.addEventListener('pointerdown', dismiss);
    return () => window.removeEventListener('pointerdown', dismiss);
  }, [chromeRevealed]);

  useLayoutEffect(() => {
    const refs = [infoRef.current, homeRef.current, contactRef.current];
    const visibles = [infoVisible, homeVisible, contactVisible];
    const offsets = offsetsForVisible(visibles);

    if (!navInit.current) {
      navInit.current = true;
      refs.forEach((el, i) => {
        if (el) gsap.set(el, { scale: +visibles[i], opacity: +visibles[i], x: offsets[i] });
      });
      return;
    }
    refs.forEach((el, i) => {
      if (!el) return;
      gsap.to(el, { scale: +visibles[i], duration: visibles[i] ? 0.4 : 0.3, ease: visibles[i] ? 'power2.out' : 'power2.in' });
      gsap.to(el, { opacity: +visibles[i], duration: visibles[i] ? 0.3 : 0.2, ease: visibles[i] ? 'power2.out' : 'power2.in' });
      gsap.to(el, { x: offsets[i], duration: 0.4, ease: 'power2.inOut' });
    });
  }, [infoVisible, homeVisible, contactVisible]);

  const handleHome = () => {
    if (focusActive) {
      setFocusedId(null);
      if (projectOpen) setPopup(null);
    }
  };

  return (
    <nav className="pointer-events-none fixed inset-x-0 top-8 z-10 flex justify-center">
      <ul className="pointer-events-none flex gap-2">

        <li ref={infoRef}>
          <button
            type="button"
            aria-label={infoOpen ? 'Close about' : 'About'}
            aria-pressed={infoOpen}
            aria-hidden={!infoVisible}
            onClick={() => setPopup(infoOpen ? null : 'info')}
            style={{ pointerEvents: infoVisible ? 'auto' : 'none' }}
            className="btn-interactive flex size-16 items-center justify-center rounded-full bg-[#ACD5FF] text-black"
          >
            <img src="/media/icons/INFO.svg" alt="" draggable={false} className="size-6" />
          </button>
        </li>

        <li ref={homeRef} className="relative">
          <button
            type="button"
            aria-label="Home"
            aria-hidden={!homeVisible}
            onClick={handleHome}
            style={{ pointerEvents: homeVisible ? 'auto' : 'none' }}
            className="btn-interactive flex size-16 items-center justify-center rounded-full bg-white"
          >
            <img src="/media/icons/logo.svg" alt="" draggable={false} className="size-6" />
          </button>

          <div className="pointer-events-none absolute left-1/2 top-full mt-4 -translate-x-1/2">
            <div
              ref={hintRef}
              style={{ border: 'none' }}
              className="ui-shadow whitespace-nowrap rounded-full bg-[#3399FF] px-3 py-1.5 text-[16px] leading-[20px] text-white"
            >
              {hint}
            </div>
          </div>
        </li>

        <li ref={contactRef}>
          <button
            type="button"
            aria-label={contactOpen ? 'Close contact' : 'Contact'}
            aria-pressed={contactOpen}
            aria-hidden={!contactVisible}
            onClick={() => setPopup(contactOpen ? null : 'contact')}
            style={{ pointerEvents: contactVisible ? 'auto' : 'none' }}
            className="btn-interactive flex size-16 items-center justify-center rounded-full bg-[#BFFF00] text-black"
          >
            <img src="/media/icons/CONTACT.svg" alt="" draggable={false} className="size-6" />
          </button>
        </li>
      </ul>
    </nav>
  );
}
