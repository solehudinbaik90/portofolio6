import { useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react';
import gsap from 'gsap';
import { useDiscoveryProgress } from '../../contexts/DiscoveryContext';
import { usePopup } from '../../contexts/PopupContext';
import { useFocus } from '../../contexts/FocusContext';
import { useHoverDevice } from '../../hooks/useHoverDevice';
import { track } from '@vercel/analytics';
import { pickDiscoveryHint } from '../../utils/strings';

const RING_SIZE = 24;
const RING_STROKE = 6;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRC = 2 * Math.PI * RING_RADIUS;
const RING_GREEN = '#44AA44';

const WIDTH_COUNT = 160;
const WIDTH_CLOSE = 64;
const HINT_HOLD = 2;

export default function DiscoveryCounter() {
  const isHover = useHoverDevice();
  const { count, total, progress } = useDiscoveryProgress();
  const { popup, setPopup } = usePopup();
  const { focusedId, isClosing } = useFocus();

  const isComplete = popup === 'complete';
  const focusActive = focusedId !== null && !isClosing;
  const infoContact = popup === 'info' || popup === 'contact';
  const visible = !focusActive && !infoContact;

  const wrapRef = useRef(null);
  const counterRef = useRef(null);
  const closeRef = useRef(null);
  const hintRef = useRef(null);
  const hintTlRef = useRef(null);
  const widthTlRef = useRef(null);

  const visInit = useRef(false);
  const complInit = useRef(false);
  const autoCompleted = useRef(false);

  const [hint, setHint] = useState('');

  // ── Visibility ─────────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (!visInit.current) {
      visInit.current = true;
      gsap.set(el, { scale: +!!visible, opacity: +!!visible });
      return;
    }
    gsap.to(el, {
      scale: +!!visible,
      duration: visible ? 0.4 : 0.3,
      ease: visible ? 'power2.out' : 'power2.in',
    });
    gsap.to(el, {
      opacity: +!!visible,
      duration: visible ? 0.3 : 0.2,
      ease: visible ? 'power2.out' : 'power2.in',
    });
  }, [visible]);

  // ── Toggle counter ↔ close ─────────────────────────────────────────────────
  useLayoutEffect(() => {
    const counter = counterRef.current;
    const close = closeRef.current;
    const wrap = wrapRef.current;
    if (!counter || !close || !wrap) return;

    if (!complInit.current) {
      complInit.current = true;
      gsap.set(counter, { scale: +!isComplete, opacity: +!isComplete });
      gsap.set(close, { scale: +!!isComplete, opacity: +!!isComplete });
      gsap.set(wrap, { width: isComplete ? WIDTH_CLOSE : WIDTH_COUNT });
      return;
    }

    const show = isComplete ? close : counter;
    const hide = isComplete ? counter : close;
    gsap.to(hide, { scale: 0, duration: 0.3, ease: 'power2.in' });
    gsap.to(hide, { opacity: 0, duration: 0.2, ease: 'power2.in' });
    gsap.to(show, { scale: 1, duration: 0.4, ease: 'power2.out' });
    gsap.to(show, { opacity: 1, duration: 0.3, ease: 'power2.out' });
    widthTlRef.current?.kill();
    widthTlRef.current = gsap.to(wrap, {
      width: isComplete ? WIDTH_CLOSE : WIDTH_COUNT,
      duration: 0.4,
      ease: 'power2.inOut',
    });
  }, [isComplete]);

  // ── Hint tooltip init ──────────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (hintRef.current) gsap.set(hintRef.current, { scale: 0, opacity: 0 });
  }, []);

  const showHint = useCallback((text) => {
    setHint(text);
    const el = hintRef.current;
    if (!el) return;
    hintTlRef.current?.kill();
    hintTlRef.current = gsap
      .timeline()
      .set(el, { scale: 0, opacity: 0 })
      .to(el, { scale: 1, opacity: 1, duration: 0.4, ease: 'power2.out' })
      .to(el, { scale: 0, opacity: 0, duration: 0.3, ease: 'power2.in' }, `+=${HINT_HOLD}`);
  }, []);

  // ── Auto-complete saat semua discovered (hover only) ───────────────────────
  useEffect(() => {
    if (!isHover) return;
    if (progress >= 1 && !autoCompleted.current) {
      autoCompleted.current = true;
      setPopup('complete');
    }
  }, [progress, isHover, setPopup]);

  // ── Click handler ──────────────────────────────────────────────────────────
  const handleClick = useCallback(() => {
    track('progress_clicked', { count, total });
    if (isComplete) {
      setPopup(null);
      return;
    }
    if (progress >= 1) {
      setPopup('complete');
      return;
    }
    showHint(pickDiscoveryHint(total - count));
  }, [isComplete, progress, count, total, setPopup, showHint]);

  const offset = RING_CIRC * (1 - progress);

  return (
    <div className="pointer-events-none fixed bottom-8 right-8 z-20 hidden min-[768px]:block">
      <div className="pointer-events-none absolute bottom-full right-0 mb-4">
        <div
          ref={hintRef}
          aria-live="polite"
          style={{ border: 'none' }}
          className="ui-shadow whitespace-nowrap rounded-full bg-[#3399FF] px-3 py-1.5 text-[16px] leading-[20px] text-white"
        >
          {hint}
        </div>
      </div>

      <div ref={wrapRef} style={{ transformOrigin: '50% 50%' }}>
        <div
          role={visible ? 'button' : 'img'}
          aria-label={isComplete ? 'Close' : `${count} of ${total} discovered`}
          onClick={visible ? handleClick : undefined}
          style={{
            width: WIDTH_COUNT,
            pointerEvents: visible ? 'auto' : 'none',
            cursor: visible ? 'pointer' : 'default',
          }}
          className="btn-interactive relative h-16 overflow-hidden rounded-full bg-white"
        >

          <span
            ref={counterRef}
            style={{ transformOrigin: '50% 50%', width: WIDTH_COUNT }}
            className="absolute inset-y-0 right-0 flex items-center pl-5 pr-4"
          >
            <span className="min-w-0 flex-1 overflow-hidden whitespace-nowrap text-[20px] leading-[120%] text-black tabular-nums">
              {count}/{total}
            </span>
            <span className="flex shrink-0 items-center gap-[2px]">

              <svg
                width={RING_SIZE}
                height={RING_SIZE}
                viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
                className="shrink-0"
                aria-hidden
              >
                <rect
                  width={RING_SIZE}
                  height={RING_SIZE}
                  rx="12"
                  fill="#000000"
                  fillOpacity={0.1}
                />
                <path
                  d="M2.268 12.713C2.13 12.498 2.061 12.39 2.022 12.223C1.993 12.098 1.993 11.902 2.022 11.777C2.061 11.61 2.13 11.502 2.268 11.287C3.411 9.505 6.814 5 12 5C17.186 5 20.589 9.505 21.732 11.287C21.87 11.502 21.939 11.61 21.978 11.777C22.007 11.902 22.007 12.098 21.978 12.223C21.939 12.39 21.87 12.498 21.732 12.713C20.589 14.495 17.186 19 12 19C6.814 19 3.411 14.495 2.268 12.713Z"
                  fill="#FFFFFF"
                />
                <path
                  d="M12 15C13.683 15 15.047 13.657 15.047 12C15.047 10.343 13.683 9 12 9C10.317 9 8.953 10.343 8.953 12C8.953 13.657 10.317 15 12 15Z"
                  fill="#FFFFFF"
                />
                <circle cx="12" cy="12" r="5" fill="#000000" />
                <circle cx="12" cy="10.5" r="1.5" fill="#FFFFFF" />
              </svg>

              <svg
                width={RING_SIZE}
                height={RING_SIZE}
                viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
                className="-rotate-90 shrink-0"
                aria-hidden
              >
                <circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  fill="none"
                  stroke="#000000"
                  strokeOpacity={0.1}
                  strokeWidth={RING_STROKE}
                />
                <circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  fill="none"
                  stroke={RING_GREEN}
                  strokeWidth={RING_STROKE}
                  strokeLinecap="round"
                  strokeDasharray={RING_CIRC}
                  strokeDashoffset={offset}
                  style={{
                    transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </svg>
            </span>
          </span>

          <span
            ref={closeRef}
            style={{ transformOrigin: '50% 50%' }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <img
              src="/media/icons/CLOSE.svg"
              alt=""
              draggable={false}
              className="size-6"
            />
          </span>
        </div>
      </div>
    </div>
  );
}
