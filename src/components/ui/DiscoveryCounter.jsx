import { useRef, useState, useLayoutEffect, useCallback } from 'react';
import gsap from 'gsap';
import { useDiscoveryProgress } from '../../contexts/DiscoveryContext';
import { usePopup } from '../../contexts/PopupContext';
import { useFocus } from '../../contexts/FocusContext';
import { useHoverDevice } from '../../hooks/useHoverDevice';

const RADIUS = 9;
const STROKE = 6;
const SIZE = 24;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GREEN = '#44AA44';
const HINT_DURATION = 2;
const COUNTER_WIDTH = 160;
const CLOSE_WIDTH = 64;

const HINTS = [
  (n) => `Only ${n} to go.`,
  (n) => `${n} more to find.`,
  (n) => `Just ${n} left.`,
  () => 'Try going East.',
  () => 'Have you looked left?',
  () => 'Could go righter.',
  () => 'Try changing categories.',
  () => 'Up is down, down is up.',
  () => 'So much to see.',
  () => 'Plenty more to uncover.',
];

function pickHint(remaining) {
  const fn = HINTS[Math.floor(Math.random() * HINTS.length)];
  return fn(remaining);
}

export default function DiscoveryCounter() {
  const isHover = useHoverDevice();
  const { count, total, progress } = useDiscoveryProgress();
  const { popup, setPopup } = usePopup();
  const { focusedId, isClosing } = useFocus();

  const isComplete = popup === 'complete';
  const focusActive = focusedId !== null && !isClosing;
  const infoOrContact = popup === 'info' || popup === 'contact';
  const visible = !focusActive && !infoOrContact;

  const wrapRef = useRef(null);
  const counterRef = useRef(null);
  const closeRef = useRef(null);
  const hintRef = useRef(null);
  const hintTlRef = useRef(null);
  const widthTlRef = useRef(null);
  const visibilityInit = useRef(false);
  const completeInit = useRef(false);

  const [hint, setHint] = useState('');

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (!visibilityInit.current) {
      visibilityInit.current = true;
      gsap.set(el, { scale: +!!visible, opacity: +!!visible });
      return;
    }
    gsap.to(el, { scale: +!!visible, duration: visible ? 0.4 : 0.3, ease: visible ? 'power2.out' : 'power2.in' });
    gsap.to(el, { opacity: +!!visible, duration: visible ? 0.3 : 0.2, ease: visible ? 'power2.out' : 'power2.in' });
  }, [visible]);

  useLayoutEffect(() => {
    if (!isHover) return;
    const counter = counterRef.current;
    const close = closeRef.current;
    const wrap = wrapRef.current;
    if (!counter || !close || !wrap) return;
    if (!completeInit.current) {
      completeInit.current = true;
      gsap.set(counter, { scale: +!isComplete, opacity: +!isComplete });
      gsap.set(close, { scale: +!!isComplete, opacity: +!!isComplete });
      gsap.set(wrap, { width: isComplete ? CLOSE_WIDTH : COUNTER_WIDTH });
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
      width: isComplete ? CLOSE_WIDTH : COUNTER_WIDTH,
      duration: 0.4,
      ease: 'power2.inOut',
    });
  }, [isComplete, isHover]);

  const showHint = useCallback((text) => {
    setHint(text);
    const el = hintRef.current;
    if (!el) return;
    hintTlRef.current?.kill();
    hintTlRef.current = gsap
      .timeline()
      .set(el, { scale: 0, opacity: 0 })
      .to(el, { scale: 1, opacity: 1, duration: 0.4, ease: 'power2.out' })
      .to(el, { scale: 0, opacity: 0, duration: 0.3, ease: 'power2.in' }, `+=${HINT_DURATION}`);
  }, []);

  const handleClick = useCallback(() => {
    if (isComplete) {
      setPopup(null);
      return;
    }
    if (progress >= 1) {
      setPopup('complete');
      return;
    }
    showHint(pickHint(total - count));
  }, [isComplete, progress, count, total, setPopup, showHint]);

  const offset = CIRCUMFERENCE * (1 - progress);

  if (!isHover) return null;

  return (
    <div className="pointer-events-none fixed bottom-8 right-8 z-20">

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
          style={{ width: COUNTER_WIDTH, pointerEvents: visible ? 'auto' : 'none', cursor: visible ? 'pointer' : 'default' }}
          className="btn-interactive relative h-16 overflow-hidden rounded-full bg-white"
        >

          <span
            ref={counterRef}
            style={{ transformOrigin: '50% 50%', width: COUNTER_WIDTH }}
            className="absolute inset-y-0 right-0 flex items-center pl-5 pr-4"
          >
            <span className="min-w-0 flex-1 overflow-hidden whitespace-nowrap text-[20px] leading-[120%] text-black tabular-nums">
              {count}/{total}
            </span>
            <span className="flex shrink-0 items-center gap-[2px]">

              <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden>
                <rect width={SIZE} height={SIZE} rx="12" fill="#000000" fillOpacity={0.1} />
                <path d="M2.268 12.713C2.13 12.498 2.061 12.39 2.022 12.223C1.993 12.098 1.993 11.902 2.022 11.777C2.061 11.61 2.13 11.502 2.268 11.287C3.411 9.505 6.814 5 12 5C17.186 5 20.589 9.505 21.732 11.287C21.87 11.502 21.939 11.61 21.978 11.777C22.007 11.902 22.007 12.098 21.978 12.223C21.939 12.39 21.87 12.498 21.732 12.713C20.589 14.495 17.186 19 12 19C6.814 19 3.411 14.495 2.268 12.713Z" fill="#FFFFFF" />
                <path d="M12 15C13.683 15 15.047 13.657 15.047 12C15.047 10.343 13.683 9 12 9C10.317 9 8.953 10.343 8.953 12C8.953 13.657 10.317 15 12 15Z" fill="#FFFFFF" />
                <circle cx="12" cy="12" r="5" fill="#000000" />
                <circle cx="12" cy="10.5" r="1.5" fill="#FFFFFF" />
              </svg>

              <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90 shrink-0" aria-hidden>
                <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="#000000" strokeOpacity={0.1} strokeWidth={STROKE} />
                <circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke={GREEN}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={offset}
                  style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
                />
              </svg>
            </span>
          </span>

          <span
            ref={closeRef}
            style={{ transformOrigin: '50% 50%' }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <img src="/media/icons/CLOSE.svg" alt="" draggable={false} className="size-6" />
          </span>
        </div>
      </div>
    </div>
  );
}
