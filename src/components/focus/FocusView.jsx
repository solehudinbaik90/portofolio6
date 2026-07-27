import { useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import gsap from 'gsap';
import { useFocus } from '../../contexts/FocusContext';
import { useHoverDevice } from '../../hooks/useHoverDevice';
import { ALL_TILES } from '../../data/tiles';
import { TILE_ASPECT_CLASSES, TILE_ASPECT_RATIOS_HW } from '../../utils/layout';
import { tileColor } from '../../utils/color';

const OPEN_DUR = 0.7;
const OPEN_EASE = 'power2.inOut';
const CLOSE_DUR = 0.7;
const CLOSE_EASE = 'power2.inOut';
const PADDING = 224;
const SIDE_PAD = 64;
const MOBILE_BREAKPOINT = 768;
const MOBILE_OPACITY = 0.001;
const VIDEO_DELAY_MS = 120;
const WHEEL_SCALE_SPEED = 0.002;
const MIN_SCALE = 1;
const MAX_SCALE_FACTOR = 1;
const SNAP_BACK_DUR = 0.9;
const SNAP_EASE = 'elastic.out(1, 0.5)';

function getTile(id) {
  return ALL_TILES.find((t) => t.id === id) ?? null;
}

export default function FocusView() {
  const { focusedId, source, isClosing, setFocusedId, finishClose } = useFocus();
  const isHover = useHoverDevice();

  const containerRef = useRef(null);
  const innerRef = useRef(null);
  const videoRef = useRef(null);
  const scaleRef = useRef(1);
  const scaleAnimRef = useRef(null);
  const snapAnimRef = useRef(null);
  const openTlRef = useRef(null);
  const closeTlRef = useRef(null);
  const videoTimer = useRef(0);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT;

  const playVideo = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const sourceEl = source?.querySelector('video');
    if (sourceEl && Number.isFinite(sourceEl.currentTime)) {
      try { v.currentTime = sourceEl.currentTime; } catch {}
    }
    v.play().catch(() => {});
  }, [source]);

  const schedulePlay = useCallback(() => {
    if (isHover) {
      playVideo();
    } else {
      videoTimer.current = window.setTimeout(playVideo, VIDEO_DELAY_MS);
    }
  }, [isHover, playVideo]);

  // ── Open animation ──────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (!focusedId || !source) return;
    const inner = innerRef.current;
    if (!inner) return;

    const mobile = window.innerWidth < MOBILE_BREAKPOINT;
    scaleRef.current = 1;

    if (mobile) {
      gsap.killTweensOf(source);
      gsap.set(source, { x: 0, y: 0, scale: 1 });
      const srcRect = source.getBoundingClientRect();
      const dstRect = inner.getBoundingClientRect();
      const dx = dstRect.left + dstRect.width / 2 - (srcRect.left + srcRect.width / 2);
      const dy = dstRect.top + dstRect.height / 2 - (srcRect.top + srcRect.height / 2);
      const sx = dstRect.width / srcRect.width;
      openTlRef.current = gsap.to(source, {
        x: dx, y: dy, scale: sx,
        duration: OPEN_DUR, ease: OPEN_EASE,
        overwrite: 'auto',
        onComplete: () => {
          source.style.visibility = 'hidden';
          gsap.set(source, { x: 0, y: 0, scale: 1 });
          gsap.set(inner, { opacity: 1 });
          if (containerRef.current) containerRef.current.style.pointerEvents = 'auto';
          schedulePlay();
        },
      });
    } else {
      const srcRect = source.getBoundingClientRect();
      const dstRect = inner.getBoundingClientRect();
      const dx = srcRect.left + srcRect.width / 2 - (dstRect.left + dstRect.width / 2);
      const dy = srcRect.top + srcRect.height / 2 - (dstRect.top + dstRect.height / 2);
      const sx = srcRect.width / dstRect.width;

      source.style.visibility = 'hidden';
      if (isHover) playVideo();

      openTlRef.current = gsap.fromTo(
        inner,
        { x: dx, y: dy, scale: sx },
        {
          x: 0, y: 0, scale: 1,
          duration: OPEN_DUR, ease: OPEN_EASE,
          overwrite: 'auto',
          onComplete: () => {
            if (!isHover) schedulePlay();
            scaleRef.current = 1;
          },
        }
      );
    }

    return () => {
      openTlRef.current?.kill();
      window.clearTimeout(videoTimer.current);
    };

  }, [focusedId, source]);

  // ── Close animation ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isClosing) return;
    window.clearTimeout(videoTimer.current);
    const inner = innerRef.current;
    if (!inner || !source) { finishClose(); return; }

    const mobile = window.innerWidth < MOBILE_BREAKPOINT;
    const currentScale = Number(gsap.getProperty(inner, 'scale')) || 1;

    if (mobile) {
      gsap.killTweensOf(source);
      gsap.set(source, { x: 0, y: 0, scale: 1 });
      const srcRect = source.getBoundingClientRect();
      const dstRect = inner.getBoundingClientRect();
      const dx = srcRect.left + srcRect.width / 2 - (dstRect.left + dstRect.width / 2);
      const dy = srcRect.top + srcRect.height / 2 - (dstRect.top + dstRect.height / 2);
      const sx = srcRect.width / (dstRect.width / currentScale);
      closeTlRef.current = gsap.to(inner, {
        x: dx, y: dy, scale: sx,
        duration: CLOSE_DUR, ease: CLOSE_EASE,
        overwrite: 'auto',
        onComplete: finishClose,
      });
    } else {
      gsap.killTweensOf(source);
      gsap.set(source, { scale: 1 });
      closeTlRef.current = gsap.to(source, {
        x: 0, y: 0, scale: 1,
        duration: CLOSE_DUR, ease: CLOSE_EASE,
        overwrite: 'auto',
        onComplete: finishClose,
      });
    }

    return () => { closeTlRef.current?.kill(); };
  }, [isClosing, source, finishClose]);

  // ── Keyboard dismiss ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!focusedId || isClosing) return;
    const handler = (e) => { if (e.key === 'Escape') setFocusedId(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focusedId, isClosing, setFocusedId]);

  // ── Pinch-to-zoom on desktop ──────────────────────────────────────────────────
  useEffect(() => {
    if (!focusedId || !isHover) return;
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;

    const onWheel = (e) => {
      e.preventDefault();
      const rect = inner.getBoundingClientRect();
      const maxH = (window.innerHeight - PADDING) / rect.height * scaleRef.current;
      const maxW = (window.innerWidth - SIDE_PAD) / rect.width * scaleRef.current;
      const maxScale = Math.max(MIN_SCALE, Math.min(maxH, maxW));
      const next = Math.min(maxScale, Math.max(MIN_SCALE, scaleRef.current - e.deltaY * WHEEL_SCALE_SPEED));

      if (next === scaleRef.current) {
        if ((e.deltaY < 0 && next >= maxScale - 0.001) || (e.deltaY > 0 && next <= 1.001)) {
          if (!snapAnimRef.current?.isActive()) {
            snapAnimRef.current = gsap.timeline()
              .to(inner, { x: -16, duration: 0.06, ease: 'power2.out' })
              .to(inner, { x: 16, duration: 0.08, ease: 'power2.inOut' })
              .to(inner, { x: -8, duration: 0.08, ease: 'power2.inOut' })
              .to(inner, { x: 8, duration: 0.08, ease: 'power2.inOut' })
              .to(inner, { x: 0, duration: 0.1, ease: 'power2.out' });
          }
        }
        return;
      }
      scaleRef.current = next;
      scaleAnimRef.current?.kill();
      scaleAnimRef.current = gsap.to(inner, { scale: next, duration: 0.9, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' });
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [focusedId, isHover]);

  if (!focusedId) return null;
  const tile = getTile(focusedId);
  if (!tile) return null;

  const aspectHW = TILE_ASPECT_RATIOS_HW[tile.size];
  const width = `min(var(--tile-focus-w, calc(100vw - ${SIDE_PAD}px)), calc((100dvh - ${PADDING}px) * ${1 / aspectHW}))`;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={tile.description ?? tile.id}
      onClick={() => setFocusedId(null)}
      className="fixed inset-0 z-10 flex items-center justify-center"
      style={{ pointerEvents: isMobile ? 'none' : 'auto' }}
    >
      <div
        ref={innerRef}
        onClick={(e) => e.stopPropagation()}
        className={`${TILE_ASPECT_CLASSES[tile.size]} relative overflow-hidden rounded-lg will-change-transform`}
        style={{
          width,
          backgroundColor: tileColor(tile),
          ...(isMobile && { opacity: MOBILE_OPACITY }),
        }}
      >
        {tile.media.kind === 'video' ? (
          <>
            {tile.media.posterSrc && (
              <img
                src={tile.media.posterSrc}
                alt=""
                aria-hidden
                draggable={false}
                className="pointer-events-none absolute inset-0 size-full object-cover"
              />
            )}
            <video
              ref={videoRef}
              src={tile.media.src}
              autoPlay={isHover}
              preload="auto"
              loop
              muted
              playsInline
              className="relative size-full object-cover"
            />
          </>
        ) : (
          <img
            src={tile.media.src}
            alt=""
            draggable={false}
            className="size-full object-cover"
          />
        )}
      </div>
    </div>
  );
}
