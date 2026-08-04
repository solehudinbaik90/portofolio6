import { useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import gsap from 'gsap';
import { useFocus } from '../../contexts/FocusContext';
import { useTiles } from '../../contexts/TileContext';
import { useHoverDevice } from '../../hooks/useHoverDevice';
import { TILE_ASPECT_CLASSES, TILE_ASPECT_RATIOS_WH } from '../../utils/layout';
import { tileColor } from '../../utils/color';

const OPEN_DUR   = 0.7;
const OPEN_EASE  = 'power2.inOut';
const CLOSE_DUR  = 0.7;
const CLOSE_EASE = 'power2.inOut';

const CHROME_PADDING        = 224;
const SIDE_PAD              = 64;
const MOBILE_BREAKPOINT     = 768;
const MOBILE_HIDDEN_OPACITY = 0.001;
const VIDEO_DELAY_MS        = 120;

const WHEEL_HEIGHT_PADDING = 256;
const WHEEL_SCALE_SPEED    = 0.002;
const MIN_SCALE             = 1;
const SNAP_DUR               = 0.9;
const SNAP_EASE              = 'elastic.out(1, 0.5)';

function shakeX(target) {
  return gsap
    .timeline()
    .set(target, { x: 0 })
    .to(target, { x: -16, duration: 0.06, ease: 'power2.out' })
    .to(target, { x: 16, duration: 0.08, ease: 'power2.inOut' })
    .to(target, { x: -8, duration: 0.08, ease: 'power2.inOut' })
    .to(target, { x: 8, duration: 0.08, ease: 'power2.inOut' })
    .to(target, { x: 0, duration: 0.1, ease: 'power2.out' });
}

export default function FocusView() {
  const { focusedId, source, isClosing, setFocusedId, finishClose } = useFocus();
  const { tilesById } = useTiles();
  const isHover = useHoverDevice();

  const containerRef = useRef(null);
  const innerRef      = useRef(null);
  const videoRef      = useRef(null);
  const videoTimerRef = useRef(0);

  const closeReadyRef = useRef(false);
  const isMobileRef    = useRef(false);
  const dimsRef        = useRef(null);
  const scaleRef       = useRef(1);
  const openDoneRef    = useRef(false);
  const scaleAnimRef   = useRef(null);
  const snapAnimRef    = useRef(null);

  const isMobileNow = typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT;

  const playVideo = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const sourceVideo = source?.querySelector('video');
    if (sourceVideo && Number.isFinite(sourceVideo.currentTime)) {
      try { v.currentTime = sourceVideo.currentTime; } catch {}
    }
    v.play().catch(() => {});
  }, [source]);

  const schedulePlay = useCallback(() => {
    if (isHover) {
      playVideo();
    } else {
      videoTimerRef.current = window.setTimeout(playVideo, VIDEO_DELAY_MS);
    }
  }, [isHover, playVideo]);

  // ── OPEN ──────────────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (!focusedId || !source) return;
    const inner = innerRef.current;
    if (!inner) return;

    const mobile = window.innerWidth < MOBILE_BREAKPOINT;
    isMobileRef.current = mobile;
    closeReadyRef.current = !mobile;
    dimsRef.current = null;
    scaleRef.current = 1;
    openDoneRef.current = false;

    if (mobile) {
      gsap.killTweensOf(source);
      gsap.set(source, { x: 0, y: 0, scale: 1 });

      const srcRect = source.getBoundingClientRect();
      const dstRect = inner.getBoundingClientRect();
      const dx = dstRect.left + dstRect.width / 2 - (srcRect.left + srcRect.width / 2);
      const dy = dstRect.top + dstRect.height / 2 - (srcRect.top + srcRect.height / 2);
      const sx = dstRect.width / srcRect.width;

      const tween = gsap.to(source, {
        x: dx, y: dy, scale: sx,
        duration: OPEN_DUR,
        ease: OPEN_EASE,
        overwrite: 'auto',
        onComplete: () => {
          source.style.visibility = 'hidden';
          gsap.set(source, { x: 0, y: 0, scale: 1 });
          gsap.set(inner, { opacity: 1 });
          if (containerRef.current) containerRef.current.style.pointerEvents = 'auto';
          closeReadyRef.current = true;
          schedulePlay();
        },
      });

      return () => {
        tween.kill();
        clearTimeout(videoTimerRef.current);
        gsap.killTweensOf(source);
        gsap.set(source, { x: 0, y: 0, scale: 1 });
        source.style.visibility = '';
      };
    }

    const srcRect = source.getBoundingClientRect();
    const dstRect = inner.getBoundingClientRect();
    const dx = srcRect.left + srcRect.width / 2 - (dstRect.left + dstRect.width / 2);
    const dy = srcRect.top + srcRect.height / 2 - (dstRect.top + dstRect.height / 2);
    const sx = srcRect.width / dstRect.width;
    const prevVisibility = source.style.visibility;

    source.style.visibility = 'hidden';
    if (isHover) playVideo();

    const tween = gsap.fromTo(
      inner,
      { x: dx, y: dy, scale: sx },
      {
        x: 0, y: 0, scale: 1,
        duration: OPEN_DUR,
        ease: OPEN_EASE,
        overwrite: 'auto',
        onComplete: () => {
          if (!isHover) schedulePlay();
          scaleRef.current = 1;
          openDoneRef.current = true;
          const rect = inner.getBoundingClientRect();
          dimsRef.current = { w: rect.width, h: rect.height };
        },
      }
    );

    return () => {
      tween.kill();
      clearTimeout(videoTimerRef.current);
      gsap.killTweensOf(source);
      gsap.set(inner, { scale: 1 });
      source.style.visibility = prevVisibility;
    };
  }, [focusedId, source, isHover, playVideo, schedulePlay]);

  // ── CLOSE ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isClosing) return;
    clearTimeout(videoTimerRef.current);

    const inner = innerRef.current;
    if (!inner || !source) {
      finishClose();
      return;
    }

    if (closeReadyRef.current) {
      openDoneRef.current = false;
      gsap.killTweensOf(inner);

      const currentScale = Number(gsap.getProperty(inner, 'scale')) || 1;

      gsap.killTweensOf(source);
      gsap.set(source, { x: 0, y: 0, scale: 1 });

      const srcRect = source.getBoundingClientRect();
      const dstRect = inner.getBoundingClientRect();
      const dx = srcRect.left + srcRect.width / 2 - (dstRect.left + dstRect.width / 2);
      const dy = srcRect.top + srcRect.height / 2 - (dstRect.top + dstRect.height / 2);
      const sx = srcRect.width / (dstRect.width / currentScale);

      const tween = gsap.to(inner, {
        x: dx, y: dy, scale: sx,
        duration: CLOSE_DUR,
        ease: CLOSE_EASE,
        overwrite: 'auto',
        onComplete: finishClose,
      });
      return () => tween.kill();
    }

    gsap.killTweensOf(source);
    const tween = gsap.to(source, {
      x: 0, y: 0, scale: 1,
      duration: CLOSE_DUR,
      ease: CLOSE_EASE,
      overwrite: 'auto',
      onComplete: finishClose,
    });
    return () => tween.kill();
  }, [isClosing, source, finishClose]);

  // ── Keyboard dismiss ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!focusedId || isClosing) return;
    const handler = (e) => { if (e.key === 'Escape') setFocusedId(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focusedId, isClosing, setFocusedId]);

  // ── Wheel zoom (hanya perangkat hover) ────────────────────────────────────
  useEffect(() => {
    if (!focusedId || !isHover) return;
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;

    const onWheel = (e) => {
      const dims = dimsRef.current;
      if (!openDoneRef.current || !dims) return;
      e.preventDefault();

      const maxH = (window.innerHeight - WHEEL_HEIGHT_PADDING) / dims.h;
      const maxW = (window.innerWidth - SIDE_PAD) / dims.w;
      const maxScale = Math.max(MIN_SCALE, Math.min(maxH, maxW));
      const next = Math.min(maxScale, Math.max(MIN_SCALE, scaleRef.current - e.deltaY * WHEEL_SCALE_SPEED));

      if (next === scaleRef.current) {
        const atMax = e.deltaY < 0 && next >= maxScale - 0.001;
        const atMin = e.deltaY > 0 && next <= MIN_SCALE + 0.001;
        if ((atMax || atMin) && !snapAnimRef.current?.isActive() && !scaleAnimRef.current?.isActive()) {
          snapAnimRef.current = shakeX(inner);
        }
        return;
      }

      scaleRef.current = next;
      scaleAnimRef.current?.kill();
      scaleAnimRef.current = gsap.to(inner, {
        scale: next,
        duration: SNAP_DUR,
        ease: SNAP_EASE,
        overwrite: 'auto',
      });
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [focusedId, isHover]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (!focusedId) return null;
  const tile = tilesById.get(focusedId);
  if (!tile) return null;

  const aspectWH = TILE_ASPECT_RATIOS_WH[tile.size];
  const isLandscape = tile.size === 'ws' || tile.size === 'ls';
  const focusVar = isLandscape ? 'var(--tile-focus-w-landscape)' : 'var(--tile-focus-w)';

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={tile.title ?? tile.id}
      onClick={() => setFocusedId(null)}
      className="fixed inset-0 z-10 flex items-center justify-center"
      style={isMobileNow ? { pointerEvents: 'none' } : undefined}
    >
      <div
        ref={innerRef}
        onClick={(e) => e.stopPropagation()}
        className={`${TILE_ASPECT_CLASSES[tile.size]} relative overflow-hidden rounded-lg will-change-transform`}
        style={{
          width: `min(${focusVar}, calc(100vw - ${SIDE_PAD}px), calc((100dvh - ${CHROME_PADDING}px) * ${aspectWH}))`,
          backgroundColor: tileColor(tile),
          ...(isMobileNow ? { opacity: MOBILE_HIDDEN_OPACITY } : undefined),
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
                decoding={isMobileNow ? 'sync' : undefined}
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
            decoding={isMobileNow ? 'sync' : undefined}
            className="size-full object-cover"
          />
        )}
      </div>
    </div>
  );
}
