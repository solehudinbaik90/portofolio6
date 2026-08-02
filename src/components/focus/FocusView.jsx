// name=src/components/focus/FocusView.jsx
import { useRef, useEffect, useLayoutEffect, useCallback, useState, useMemo } from 'react';
import gsap from 'gsap';
import { useFocus } from '../../contexts/FocusContext';
import { useTiles } from '../../contexts/TileContext';
import { useHoverDevice } from '../../hooks/useHoverDevice';
import { tileColor } from '../../utils/color';

const OPEN_DUR = 0.7;
const OPEN_EASE = 'power2.inOut';
const CLOSE_DUR = 0.7;
const CLOSE_EASE = 'power2.inOut';

const SIDE_PAD_DESKTOP = 64;
const SIDE_PAD_MOBILE = 24;
const V_PAD_DESKTOP = 48;
const V_PAD_MOBILE = 24;
const MOBILE_BREAKPOINT = 768;
const VIDEO_DELAY_MS = 120;
const WHEEL_SCALE_SPEED = 0.002;
const SNAP_EASE = 'elastic.out(1, 0.5)';
const MIN_SCALE = 1;

function getVisualViewportSize() {
  if (typeof window === 'undefined') return { w: 1024, h: 768, offsetTop: 0 };
  const vv = window.visualViewport;
  if (vv) return { w: vv.width, h: vv.height, offsetTop: vv.offsetTop || 0 };
  return { w: window.innerWidth, h: window.innerHeight, offsetTop: 0 };
}

export default function FocusView() {
  const { focusedId, source, isClosing, setFocusedId, finishClose } = useFocus();
  const { tilesById } = useTiles();
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
  const openDoneRef = useRef(false);
  const isMobileRef = useRef(false);

  const tile = focusedId ? tilesById.get(focusedId) : null;

  // viewport state driven from visualViewport when available
  const [vp, setVp] = useState(() => getVisualViewportSize());

  useEffect(() => {
    const vv = window.visualViewport;
    const handler = () => setVp(getVisualViewportSize());
    if (vv) {
      vv.addEventListener('resize', handler);
      vv.addEventListener('scroll', handler);
    } else {
      window.addEventListener('resize', handler);
      window.addEventListener('orientationchange', handler);
    }
    return () => {
      if (vv) {
        vv.removeEventListener('resize', handler);
        vv.removeEventListener('scroll', handler);
      } else {
        window.removeEventListener('resize', handler);
        window.removeEventListener('orientationchange', handler);
      }
    };
  }, []);

  // responsive paddings
  const isMobile = vp.w < MOBILE_BREAKPOINT;
  const SIDE_PAD = isMobile ? SIDE_PAD_MOBILE : SIDE_PAD_DESKTOP;
  const isLandscape = vp.w > vp.h;
  const V_PAD = isMobile ? V_PAD_MOBILE : (isLandscape ? V_PAD_DESKTOP : Math.round(V_PAD_DESKTOP / 2));

  // compute final numeric width/height using visual viewport size (so we avoid toolbar/addressbar cropping)
  const { finalWidth, finalHeight } = useMemo(() => {
    if (!tile) return { finalWidth: 0, finalHeight: 0 };

    const ratio =
      tile.ratio ||
      (tile.naturalWidth && tile.naturalHeight ? tile.naturalWidth / tile.naturalHeight : 1);

    const maxW = Math.max(0, vp.w - SIDE_PAD * 2);
    const maxH = Math.max(0, vp.h - V_PAD * 2);

    // fit by width first, then constrain by height
    let w = maxW;
    let h = Math.round(w / ratio);

    if (h > maxH) {
      h = maxH;
      w = Math.round(h * ratio);
    }

    // don't exceed natural width
    if (tile.naturalWidth && tile.naturalWidth > 0 && w > tile.naturalWidth) {
      w = tile.naturalWidth;
      h = Math.round(w / ratio);
    }

    return { finalWidth: Math.max(1, Math.round(w)), finalHeight: Math.max(1, Math.round(h)) };
  }, [tile, vp, SIDE_PAD, V_PAD]);

  // video helpers
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
    if (isHover) playVideo();
    else {
      clearTimeout(videoTimer.current);
      videoTimer.current = window.setTimeout(playVideo, VIDEO_DELAY_MS);
    }
  }, [isHover, playVideo]);

  // OPEN animation (same logic as before)
  useLayoutEffect(() => {
    if (!focusedId || !source || !innerRef.current) return;
    const inner = innerRef.current;

    openTlRef.current?.kill();
    closeTlRef.current?.kill();
    openDoneRef.current = false;
    scaleRef.current = 1;
    gsap.set(inner, { clearProps: 'all' });

    const mobile = vp.w < MOBILE_BREAKPOINT;
    isMobileRef.current = mobile;

    if (mobile) {
      gsap.set(inner, { opacity: 0 });
      source.style.visibility = '';
      gsap.killTweensOf(source);
      gsap.set(source, { x: 0, y: 0, scaleX: 1, scaleY: 1 });

      const srcRect = source.getBoundingClientRect();
      const dstRect = inner.getBoundingClientRect();
      const dx = dstRect.left + dstRect.width / 2 - (srcRect.left + srcRect.width / 2);
      const dy = dstRect.top + dstRect.height / 2 - (srcRect.top + srcRect.height / 2);
      const sx = dstRect.width / srcRect.width;
      const sy = dstRect.height / srcRect.height;

      openTlRef.current = gsap.to(source, {
        x: dx, y: dy, scaleX: sx, scaleY: sy,
        duration: OPEN_DUR, ease: OPEN_EASE, overwrite: 'auto',
        onComplete: () => {
          source.style.visibility = 'hidden';
          gsap.set(source, { x: 0, y: 0, scaleX: 1, scaleY: 1 });
          gsap.set(inner, { opacity: 1, x: 0, y: 0, scaleX: 1, scaleY: 1 });
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
      const scaleX = srcRect.width / dstRect.width;
      const scaleY = srcRect.height / dstRect.height;

      openTlRef.current = gsap.fromTo(
        inner,
        { x: dx, y: dy, scaleX, scaleY },
        {
          x: 0, y: 0, scaleX: 1, scaleY: 1,
          duration: OPEN_DUR, ease: OPEN_EASE, overwrite: 'auto',
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
  }, [focusedId, source, vp.w, vp.h, isHover, playVideo, schedulePlay]);

  // CLOSE animation
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

    const currentScaleX = Number(gsap.getProperty(inner, 'scaleX')) || 1;
    const currentScaleY = Number(gsap.getProperty(inner, 'scaleY')) || 1;

    const srcRect = source.getBoundingClientRect();
    const dstRect = inner.getBoundingClientRect();
    const dx = srcRect.left + srcRect.width / 2 - (dstRect.left + dstRect.width / 2);
    const dy = srcRect.top + srcRect.height / 2 - (dstRect.top + dstRect.height / 2);
    const sx = srcRect.width / (dstRect.width / currentScaleX);
    const sy = srcRect.height / (dstRect.height / currentScaleY);

    gsap.killTweensOf(source);
    gsap.set(source, { x: 0, y: 0, scaleX: 1, scaleY: 1 });

    closeTlRef.current = gsap.to(inner, {
      x: dx, y: dy, scaleX: sx, scaleY: sy,
      duration: CLOSE_DUR, ease: CLOSE_EASE, overwrite: 'auto',
      onComplete: () => {
        gsap.set([source, inner], { clearProps: 'all' });
        source.style.visibility = '';
        finishClose();
      },
    });

    return () => { closeTlRef.current?.kill(); };
  }, [isClosing, source, finishClose]);

  // keyboard dismiss
  useEffect(() => {
    if (!focusedId || isClosing) return;
    const handler = (e) => { if (e.key === 'Escape') setFocusedId(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focusedId, isClosing, setFocusedId]);

  // wheel zoom (desktop/hover)
  useEffect(() => {
    if (!focusedId || !isHover) return;
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;

    const onWheel = (e) => {
      if (!openDoneRef.current) return;
      e.preventDefault();

      const dims = scaleRef._dims ?? inner.getBoundingClientRect();
      const maxH = (vp.h - V_PAD_DESKTOP * 2) / dims.h;
      const maxW = (vp.w - SIDE_PAD_DESKTOP * 2) / dims.w;
      const maxScale = Math.max(MIN_SCALE, Math.min(maxH, maxW));
      const next = Math.min(maxScale, Math.max(MIN_SCALE, scaleRef.current - e.deltaY * WHEEL_SCALE_SPEED));

      if (next === scaleRef.current) {
        if (!snapAnimRef.current?.isActive() && !scaleAnimRef.current?.isActive()) {
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
        scaleX: next, scaleY: next, duration: 0.9, ease: SNAP_EASE, overwrite: 'auto',
      });
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [focusedId, isHover, vp]);

  if (!focusedId || !tile) return null;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={tile.description ?? tile.id}
      onClick={() => setFocusedId(null)}
      className="fixed inset-0 z-10 flex items-center justify-center"
      style={{
        pointerEvents: isMobileRef.current ? 'none' : 'auto',
        paddingLeft: SIDE_PAD,
        paddingRight: SIDE_PAD,
        paddingTop: V_PAD,
        paddingBottom: V_PAD,
      }}
    >
      <div
        ref={innerRef}
        onClick={(e) => e.stopPropagation()}
        className="relative overflow-hidden rounded-lg will-change-transform"
        style={{
          width: `${finalWidth}px`,
          height: `${finalHeight}px`,
          backgroundColor: tileColor(tile),
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
                decoding="async"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
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
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            />
          </>
        ) : (
          <img
            src={tile.media.src}
            alt=""
            draggable={false}
            decoding="async"
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
        )}
      </div>
    </div>
  );
}
