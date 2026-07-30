import { useRef, useState, useLayoutEffect, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { usePopup } from '../../contexts/PopupContext';
import { useFocus } from '../../contexts/FocusContext';
import { useTiles } from '../../contexts/TileContext';
import { useHoverDevice } from '../../hooks/useHoverDevice';
import { track } from '@vercel/analytics';
import { MAGIC_8_YES, MAGIC_8_MAYBE, MAGIC_8_NO, pickRandom, HINT_HOVER, HINT_TOUCH } from '../../utils/strings';

const ITEM_OFFSET = 72;
const MAGIC_8_DISMISS = 2;

function computeOffsets(visibilities) {
  const activeIdx = visibilities
    .map((v, i) => (v ? i : -1))
    .filter((i) => i >= 0);
  if (activeIdx.length === 0) return visibilities.map(() => 0);

  const total = visibilities.length;
  const half = (total - 1) / 2;
  const activeHalf = (activeIdx.length - 1) / 2;

  return visibilities.map((_, i) => {
    const ai = activeIdx.indexOf(i);
    if (ai === -1) return 0;
    return (ai - activeHalf) * ITEM_OFFSET - (i - half) * ITEM_OFFSET;
  });
}

function shakeX(target) {
  return gsap
    .timeline({ onComplete: () => gsap.set(target, { clearProps: 'x' }) })
    .set(target, { x: 0 })
    .to(target, { x: -16, duration: 0.06, ease: 'power2.out' })
    .to(target, { x: 16, duration: 0.08, ease: 'power2.inOut' })
    .to(target, { x: -8, duration: 0.08, ease: 'power2.inOut' })
    .to(target, { x: 8, duration: 0.08, ease: 'power2.inOut' })
    .to(target, { x: 0, duration: 0.1, ease: 'power2.out' });
}

function shakeY(target) {
  return gsap
    .timeline({ onComplete: () => gsap.set(target, { clearProps: 'y' }) })
    .set(target, { y: 0 })
    .to(target, { y: -16, duration: 0.06, ease: 'power2.out' })
    .to(target, { y: 16, duration: 0.08, ease: 'power2.inOut' })
    .to(target, { y: -8, duration: 0.08, ease: 'power2.inOut' })
    .to(target, { y: 8, duration: 0.08, ease: 'power2.inOut' })
    .to(target, { y: 0, duration: 0.1, ease: 'power2.out' });
}

function shakeRotate(target) {
  return gsap
    .timeline({ onComplete: () => gsap.set(target, { clearProps: 'rotation' }) })
    .set(target, { rotation: 0 })
    .to(target, { rotation: -30, duration: 0.06, ease: 'power2.out' })
    .to(target, { rotation: 30, duration: 0.08, ease: 'power2.inOut' })
    .to(target, { rotation: -15, duration: 0.08, ease: 'power2.inOut' })
    .to(target, { rotation: 15, duration: 0.08, ease: 'power2.inOut' })
    .to(target, { rotation: 0, duration: 0.1, ease: 'power2.out' });
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
  const isAtHome = !focusActive && popup === null;

  const infoVisible = !focusActive && !contactOpen && !completeOpen;
  const homeVisible = !contactOpen && !completeOpen;
  const contactVisible = !infoOpen && !completeOpen;

  const infoRef = useRef(null);
  const homeRef = useRef(null);
  const contactRef = useRef(null);
  const logoBtnRef = useRef(null);
  const hintRef = useRef(null);
  const magic8Ref = useRef(null);
  const magic8TlRef = useRef(null);
  const hintDismissed = useRef(false);
  const navInit = useRef(false);
  const hintInit = useRef(false);

  const [magic8Text, setMagic8Text] = useState('');
  const hint = isHover ? HINT_HOVER : HINT_TOUCH;

  // ── Animasi visibility + x offset ─────────────────────────────────────────
  useLayoutEffect(() => {
    const refs = [infoRef.current, homeRef.current, contactRef.current];
    const visibles = [infoVisible, homeVisible, contactVisible];
    const offsets = computeOffsets(visibles);

    if (!navInit.current) {
      navInit.current = true;
      refs.forEach((el, i) => {
        if (!el) return;
        gsap.set(el, {
          scale: +visibles[i],
          opacity: +visibles[i],
          x: offsets[i],
        });
      });
      return;
    }

    refs.forEach((el, i) => {
      if (!el) return;
      const v = visibles[i];
      gsap.to(el, {
        scale: +v,
        duration: v ? 0.4 : 0.3,
        ease: v ? 'power2.out' : 'power2.in',
      });
      gsap.to(el, {
        opacity: +v,
        duration: v ? 0.3 : 0.2,
        ease: v ? 'power2.out' : 'power2.in',
      });
      gsap.to(el, {
        x: offsets[i],
        duration: 0.4,
        ease: 'power2.inOut',
      });
    });
  }, [infoVisible, homeVisible, contactVisible]);

  // ── Hint "Hover/Drag to explore" ─────────────────────────────────────────
  useLayoutEffect(() => {
    if (hintRef.current) gsap.set(hintRef.current, { scale: 0, opacity: 0 });
  }, []);

  useEffect(() => {
    const el = hintRef.current;
    if (!el || !chromeRevealed || hintDismissed.current) return;

    if (!hintInit.current) {
      hintInit.current = true;
    }

    gsap.to(el, { scale: 1, opacity: 1, duration: 0.4, ease: 'power2.out' });

    const dismiss = () => {
      if (hintDismissed.current) return;
      hintDismissed.current = true;
      gsap.to(el, { scale: 0, opacity: 0, duration: 0.3, ease: 'power2.in' });
      window.removeEventListener('pointerdown', dismiss);
    };

    window.addEventListener('pointerdown', dismiss);
    return () => window.removeEventListener('pointerdown', dismiss);
  }, [chromeRevealed]);

  // ── Magic 8-ball tooltip init ─────────────────────────────────────────────
  useLayoutEffect(() => {
    if (magic8Ref.current) gsap.set(magic8Ref.current, { scale: 0, opacity: 0 });
  }, []);

  const showMagic8 = useCallback((text) => {
    setMagic8Text(text);
    const el = magic8Ref.current;
    if (!el) return;
    magic8TlRef.current?.kill();
    magic8TlRef.current = gsap
      .timeline()
      .set(el, { scale: 0, opacity: 0 })
      .to(el, { scale: 1, opacity: 1, duration: 0.4, ease: 'power2.out' })
      .to(el, { scale: 0, opacity: 0, duration: 0.3, ease: 'power2.in' }, `+=${MAGIC_8_DISMISS}`);
  }, []);

  // ── Home button click ─────────────────────────────────────────────────────
  const handleHome = useCallback(() => {
    if (isAtHome) {
      const outcomes = ['yes', 'maybe', 'no'];
      const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
      const pool =
        outcome === 'yes' ? MAGIC_8_YES
        : outcome === 'maybe' ? MAGIC_8_MAYBE
        : MAGIC_8_NO;
      const response = pickRandom(pool);

      const btn = logoBtnRef.current;
      if (btn) {
        if (outcome === 'no') shakeX(btn);
        else if (outcome === 'yes') shakeY(btn);
        else shakeRotate(btn);
      }
      showMagic8(response);
      return;
    }

    if (focusActive) setFocusedId(null);
    if (projectOpen) setPopup(null);
  }, [isAtHome, focusActive, projectOpen, setFocusedId, setPopup, showMagic8]);

  return (
    <nav className="pointer-events-none fixed inset-x-0 top-8 z-20 flex justify-center">
      <ul className="pointer-events-none flex gap-2">

        <li ref={infoRef}>
          <button
            type="button"
            aria-label={infoOpen ? 'Close about' : 'About'}
            aria-pressed={infoOpen}
            aria-hidden={!infoVisible}
            onClick={() => {
              if (!infoOpen) track('info_opened');
              setPopup(infoOpen ? null : 'info');
            }}
            style={{ pointerEvents: infoVisible ? 'auto' : 'none' }}
            className="btn-interactive flex size-16 items-center justify-center rounded-full bg-[#ACD5FF] text-black"
          >
            <img src="/media/icons/INFO.svg" alt="" draggable={false} className="size-6" />
          </button>
        </li>

        <li ref={homeRef} className="relative">
          <button
            ref={logoBtnRef}
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

          <div className="pointer-events-none absolute left-1/2 top-full mt-4 -translate-x-1/2">
            <div
              ref={magic8Ref}
              aria-live="polite"
              style={{ border: 'none' }}
              className="ui-shadow whitespace-nowrap rounded-full bg-[#3399FF] px-3 py-1.5 text-[16px] leading-[20px] text-white"
            >
              {magic8Text}
            </div>
          </div>
        </li>

        <li ref={contactRef}>
          <button
            type="button"
            aria-label={contactOpen ? 'Close contact' : 'Contact'}
            aria-pressed={contactOpen}
            aria-hidden={!contactVisible}
            onClick={() => {
              if (!contactOpen) track('contact_opened');
              setPopup(contactOpen ? null : 'contact');
            }}
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
