import { useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import gsap from 'gsap';
import { useFocus } from '../../contexts/FocusContext';
import { useTiles } from '../../contexts/TileContext';
import { useHoverDevice } from '../../hooks/useHoverDevice';
import { TILE_ASPECT_RATIOS_WH } from '../../utils/layout';
import { tileColor } from '../../utils/color';

const OPEN_DUR          = 0.7;
const OPEN_EASE         = 'power2.inOut';
const CLOSE_DUR         = 0.7;
const CLOSE_EASE        = 'power2.inOut';
const CHROME_PADDING    = 0;
const SIDE_PAD          = 64;
const MOBILE_BREAKPOINT = 768;
const VIDEO_DELAY_MS    = 120;
const WHEEL_SCALE_SPEED = 0.002;
const SNAP_EASE         = 'elastic.out(1, 0.5)';
const MIN_SCALE         = 1;

export default function FocusView() {
  const { focusedId, source, isClosing, setFocusedId, finishClose } = useFocus();
  const { tilesById } = useTiles();
  const isHover = useHoverDevice();

  const containerRef = useRef(null);
  const innerRef     = useRef(null);
  const videoRef     = useRef(null);
  const scaleRef     = useRef(1);
  const scaleAnimRef = useRef(null);
  const snapAnimRef  = useRef(null);
  const openTlRef    = useRef(null);
  const closeTlRef   = useRef(null);
  const videoTimer   = useRef(0);
  const openDoneRef  = useRef(false);
  const isMobileRef  = useRef(false);

  const tile = focusedId ? tilesById.get(focusedId) : null;

  // ── Video helpers ─────────────────────────────────────────────────────────
  const playVideo = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const sourceVid = source?.querySelector('video');
    if (sourceVid && Number.isFinite(sourceVid.currentTime)) {
      try { v.currentTime = sourceVid.currentTime; } catch {}
    }
    v.play().catch(() => {});
  }, [source]);

  const schedulePlay = useCallback(() => {
    if (isHover) {
      playVideo();
    } else {
      clearTimeout(videoTimer.current);
      videoTimer.current = window.setTimeout(playVideo, VIDEO_DELAY_MS);
    }
  }, [isHover, playVideo]);

  // ── OPEN ──────────────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (!focusedId || !source) return;
    const inner = innerRef.current;
    if (!inner) return;

    openTlRef.current?.kill();
    closeTlRef.current?.kill();
    openDoneRef.current = false;
    scaleRef.current = 1;

    gsap.set(inner, { clearProps: 'all' });

    const mobile = window.innerWidth < MOBILE_BREAKPOINT;
    isMobileRef.current = mobile;

    if (mobile) {
      gsap.set(inner, { opacity: 0 });
      source.style.visibility = '';
      gsap.killTweensOf(source);
      gsap.set(source, { x: 0, y: 0, scale: 1 });

      const srcRect = source.getBoundingClientRect();
      const dstRect = inner.getBoundingClientRect();
      const dx = dstRect.left + dstRect.width / 2 - (srcRect.left + srcRect.width / 2);
      const dy = dstRect.top + dstRect.height / 2 - (srcRect.top + srcRect.height / 2);
      const sx = dstRect.width / srcRect.width;

      openTlRef.current = gsap.to(source, {
        x: dx, y: dy, scale: sx,
        duration: OPEN_DUR,
        ease: OPEN_EASE,
        overwrite: 'auto',
        onComplete: () => {
          source.style.visibility = 'hidden';
          gsap.set(source, { x: 0, y: 0, scale: 1 });
          gsap.set(inner, { opacity: 1, x: 0, y: 0, scale: 1 });
          if (containerRef.current) containerRef.current.style.pointerEvents = 'auto';
          openDoneRef.current = true;
          schedulePlay();
        },
      });
    } else {
      source.style.visibility = 'hidden';
      if (isHover) playVideo();

      const srcRect = source.getBoundingClientRect();
      const dstRect = inner.getBoundingClientRect();
      const dx = srcRect.left + srcRect.width / 2 - (dstRect.left + dstRect.width / 2);
      const dy = srcRect.top + srcRect.height / 2 - (dstRect.top + dstRect.height / 2);
      const sx = srcRect.width / dstRect.width;

      openTlRef.current = gsap.fromTo(
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
            const r = inner.getBoundingClientRect();
            scaleRef._dims = { w: r.width, h: r.height };
          },
        }
      );
    }

    return () => {
      openTlRef.current?.kill();
      clearTimeout(videoTimer.current);
    };
  }, [focusedId, source]);

  // ── CLOSE ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isClosing) return;
    clearTimeout(videoTimer.current);

    const inner = innerRef.current;
    if (!inner || !source) {
      finishClose();
      return;
    }

    openTlRef.current?.kill();
    closeTlRef.current?.kill();

    source.style.visibility = '';
    void source.offsetWidth;

    const currentScale = Number(gsap.getProperty(inner, 'scale')) || 1;

    const srcRect = source.getBoundingClientRect();
    const dstRect = inner.getBoundingClientRect();

    const dx = srcRect.left + srcRect.width / 2 - (dstRect.left + dstRect.width / 2);
    const dy = srcRect.top + srcRect.height / 2 - (dstRect.top + dstRect.height / 2);
    const sx = srcRect.width / (dstRect.width / currentScale);

    gsap.killTweensOf(source);
    gsap.set(source, { x: 0, y: 0, scale: 1 });

    closeTlRef.current = gsap.to(inner, {
      x: dx,
      y: dy,
      scale: sx,
      duration: CLOSE_DUR,
      ease: CLOSE_EASE,
      overwrite: 'auto',
      onComplete: () => {
        gsap.set([source, inner], { clearProps: 'all' });
        source.style.visibility = '';
        finishClose();
      },
    });

    return () => { closeTlRef.current?.kill(); };
  }, [isClosing, source, finishClose]);

  // ── Keyboard dismiss ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!focusedId || isClosing) return;
    const handler = (e) => { if (e.key === 'Escape') setFocusedId(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focusedId, isClosing, setFocusedId]);

  // ── Wheel zoom ──────────────────────────────────────
  useEffect(() => {
    if (!focusedId || !isHover) return;
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;

    const onWheel = (e) => {
      if (!openDoneRef.current) return;
      e.preventDefault();

      const dims = scaleRef._dims ?? inner.getBoundingClientRect();
      const maxH = (window.innerHeight - 256) / dims.h;
      const maxW = (window.innerWidth - SIDE_PAD) / dims.w;
      const maxScale = Math.max(MIN_SCALE, Math.min(maxH, maxW));
      const next = Math.min(maxScale, Math.max(MIN_SCALE, scaleRef.current - e.deltaY * WHEEL_SCALE_SPEED));

      if (next === scaleRef.current) {
        const atMax = e.deltaY < 0 && next >= maxScale - 0.001;
        const atMin = e.deltaY > 0 && next <= MIN_SCALE + 0.001;
        if ((atMax || atMin) && !snapAnimRef.current?.isActive() && !scaleAnimRef.current?.isActive()) {
          snapAnimRef.current = gsap.timeline()
            .to(inner, { x: -16, duration: 0.06, ease: 'power2.out' })
            .to(inner, { x: 16, duration: 0.08, ease: 'power2.inOut' })
            .to(inner, { x: -8, duration: 0.08, ease: 'power2.inOut' })
            .to(inner, { x: 8, duration: 0.08, ease: 'power2.inOut' })
            .to(inner, { x: 0, duration: 0.1, ease: 'power2.out' });
        }
        return;
      }

      scaleRef.current = next;
      scaleAnimRef.current?.kill();
      scaleAnimRef.current = gsap.to(inner, {
        scale: next,
        duration: 0.9,
        ease: SNAP_EASE,
        overwrite: 'auto',
      });
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [focusedId, isHover]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (!focusedId || !tile) return null;

  const aspectWH    = TILE_ASPECT_RATIOS_WH[tile.size] ?? 1;
  const isLandscape = tile.size === 'ws' || tile.size === 'ls';
  const focusVar    = isLandscape ? 'var(--tile-focus-w-landscape)' : 'var(--tile-focus-w)';
  
  const width = `min(${focusVar}, calc(100vw - ${SIDE_PAD}px - env(safe-area-inset-left) - env(safe-area-inset-right) - env(safe-area-inset-left) - env(safe-area-inset-right) - env(safe-area-inset-left) - env(safe-area-inset-right) - env(safe-area-inset-left) - env(safe-area-inset-right) - env(safe-area-inset-left) - env(safe-area-inset-right) - env(safe-area-inset-left) - env(safe-area-inset-right)), calc((100dvh - ${CHROME_PADDING}px) * ${aspectWH} - env(safe-area-inset-top) - env(safe-area-inset-bottom)))`;
  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={tile.title ?? tile.id}
      onClick={() => setFocusedId(null)}
      className="fixed inset-0 z-10 flex items-center justify-center"
      style={{ pointerEvents: isMobileRef.current ? 'none' : 'auto' }}
    >
      <div
        ref={innerRef}
        onClick={(e) => e.stopPropagation()}
        className="relative overflow-hidden rounded-lg will-change-transform"
        style={{
          width,
          aspectRatio: `${aspectWH}`,
          backgroundColor: tileColor(tile),
          ...(isMobileRef.current ? { opacity: 0 } : undefined),
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
                decoding={isMobileRef.current ? 'sync' : undefined}
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
            decoding={isMobileRef.current ? 'sync' : undefined}
            className="size-full object-cover"
          />
        )}
      </div>
    </div>
  );
}
