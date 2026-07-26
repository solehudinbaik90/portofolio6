import { useRef, useEffect, useCallback, useLayoutEffect, useState } from 'react';
import gsap from 'gsap';
import { useTiles } from '../../contexts/TileContext';
import { useFocus } from '../../contexts/FocusContext';
import { useDiscoveryActions } from '../../contexts/DiscoveryContext';
import { useHoverDevice } from '../../hooks/useHoverDevice';
import { tileColumnHeight, TILE_ASPECT_CLASSES } from '../../utils/layout';
import { tileColor } from '../../utils/color';

const GAP              = 16;
const DRAG_THRESHOLD   = 5;
const VELOCITY_WINDOW  = 100;
const INERTIA_FRICTION = 0.6;
const INERTIA_DURATION = 1.5;
const SCROLL_MULT      = 1.0125;
const LERP_FACTOR      = 0.15;
const HOVER_SCALE      = 1.0125;
const DRAG_TILE_SCALE  = 0.9;
const BLUR_ON          = 'blur(56px)';
const BLUR_OFF         = 'blur(0px)';


function getColWidth() {
  if (typeof window === 'undefined') return 216;
  if (window.innerWidth >= 1920) return 480;
  if (window.innerWidth >= 768)  return 360;
  return 216;
}


const COL_WIDTH_CLASS =
  'flex w-[216px] shrink-0 flex-col gap-4 min-[768px]:w-[360px] min-[1920px]:w-[480px]';

const MEDIA_HOVER_CLASS =
  'pointer-events-none size-full rounded-[inherit] object-cover ' +
  'blur-[32px] scale-125 ' +
  'group-hover:blur-[0px] group-hover:scale-100 ' +
  'group-[.discovered]:blur-[0px] group-[.discovered]:scale-100';

const MEDIA_TOUCH_CLASS =
  'pointer-events-none size-full rounded-[inherit] object-cover';

function calcRepeatX(viewW, totalW) {
  return Math.max(2, Math.ceil(viewW / totalW) + 1);
}
function calcRepeatY(viewH, colH) {
  return Math.max(2, Math.ceil(viewH / colH) + 1);
}

export default function Board() {
  const { columns, nonce, transitioning, chromeRevealed } = useTiles();
  const { focusedId, source, isClosing, openFocus }        = useFocus();
  const { markDiscovered, isDiscovered }                   = useDiscoveryActions();
  const isHover                                            = useHoverDevice();

  const wrapRef     = useRef(null);
  const innerRef    = useRef(null);
  const colRefs     = useRef([]);
  const colsRef     = useRef(columns);
  colsRef.current   = columns;

  const posRef      = useRef({ x: 0, y: 0 });
  const targetRef   = useRef({ x: 0, y: 0 });
  const rafRef      = useRef(0);
  const colWidthRef = useRef(getColWidth());
  const colOffsets  = useRef([]);
  const inertiaRef  = useRef(null);
  const scaleAnim   = useRef(null);
  const filterAnim  = useRef(null);
  const hoveredEl   = useRef(null);
  const isDragging  = useRef(false);
  const revealed    = useRef(false);
  const willChange  = useRef(false);

  const [repeatX, setRepeatX] = useState(2);
  const [repeatY, setRepeatY] = useState(2);

  // ── will-change management ────────────────────────────────────────────────
  const setWillChange = useCallback((active) => {
    if (willChange.current === active) return;
    willChange.current = active;
    const val = active ? 'transform' : 'auto';
    if (innerRef.current) innerRef.current.style.willChange = val;
    for (const el of colRefs.current) {
      if (el) el.style.willChange = val;
    }
  }, []);

  // ── Apply positions (wrapped infinite scroll) ─────────────────────────────
  const applyPositions = useCallback(() => {
    const cw   = colWidthRef.current;
    const cols = colsRef.current;
    if (!cols.length || !innerRef.current) return;

    const numCols = cols.length;
    const stride  = cw + GAP;
    const totalW  = numCols * stride;
    const rawX    = posRef.current.x;
    const wrappedX = ((rawX % totalW) + totalW) % totalW;

    const totalRepCols = (repeatX ?? 2) * numCols;
    const centerOffset = totalRepCols % 2 === 0 ? stride / 2 : 0;

    innerRef.current.style.transform =
      `translate(-50%, -50%) translateX(${wrappedX + centerOffset}px)`;

    const totalCols = colRefs.current.length;
    for (let ci = 0; ci < totalCols; ci++) {
      const el = colRefs.current[ci];
      if (!el) continue;
      const col  = cols[ci % numCols];
      const colH = tileColumnHeight(col, cw);
      if (colH <= 0) continue;
      const offset   = colOffsets.current[ci % numCols] ?? 0;
      const raw      = posRef.current.y + offset * colH;
      const mod      = ((raw % colH) + colH) % colH;
      const wrappedY = mod > colH / 2 ? mod - colH : mod;
      el.style.transform = `translate3d(0, ${wrappedY}px, 0)`;
    }
  }, [repeatX]);

  // ── Lerp loop ─────────────────────────────────────────────────────────────
  const stopLerp = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    targetRef.current.x = posRef.current.x;
    targetRef.current.y = posRef.current.y;
  }, []);

  const startLerp = useCallback(() => {
    if (rafRef.current) return;
    setWillChange(true);
    const loop = () => {
      const dx = targetRef.current.x - posRef.current.x;
      const dy = targetRef.current.y - posRef.current.y;
      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
        posRef.current.x = targetRef.current.x;
        posRef.current.y = targetRef.current.y;
        rafRef.current = 0;
        applyPositions();
        setWillChange(false);
        return;
      }
      posRef.current.x += dx * LERP_FACTOR;
      posRef.current.y += dy * LERP_FACTOR;
      applyPositions();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [applyPositions, setWillChange]);

  // ── Hitung repeat tiles ───────────────────────────────────────────────────
  const recomputeRepeat = useCallback(() => {
    const cols = colsRef.current;
    const cw   = colWidthRef.current;
    if (!cols.length) return;

    const numCols = cols.length;
    const totalW  = numCols * (cw + GAP);
    const rx      = calcRepeatX(window.innerWidth, totalW);

    let minH = Infinity;
    for (const col of cols) {
      const h = tileColumnHeight(col, cw);
      if (h > 0) minH = Math.min(minH, h);
    }
    const ry = minH === Infinity ? 2 : calcRepeatY(window.innerHeight, minH);

    setRepeatX(rx);
    setRepeatY(ry);
  }, []);

  // ── Sync columns → layout ─────────────────────────────────────────────────
  useEffect(() => {
    if (colOffsets.current.length !== columns.length) {
      colOffsets.current = columns.map(() => Math.random());
    }
    applyPositions();
  }, [columns, applyPositions]);

  useEffect(() => { recomputeRepeat(); }, [columns, recomputeRepeat]);
  useEffect(() => { applyPositions(); }, [repeatX, repeatY, applyPositions]);

  // ── Resize handler ────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => {
      colWidthRef.current = getColWidth();
      recomputeRepeat();
      applyPositions();
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [recomputeRepeat, applyPositions]);

  useLayoutEffect(() => {
    if (innerRef.current) {
      gsap.set(innerRef.current, { xPercent: -50, yPercent: -50 });
    }
  }, []);

  // ── Tile reveal initial (hidden sebelum chrome siap) ─────────────────────
  const initHidden = useRef(false);
  useLayoutEffect(() => {
    if (!isHover) return;
    if (initHidden.current) return;
    const tiles = innerRef.current?.querySelectorAll('[data-tile-id]');
    if (tiles?.length) {
      gsap.set(tiles, { scale: 0, opacity: 0, filter: BLUR_ON });
      initHidden.current = true;
    }
  }, [columns, isHover]);

  // ── Reveal setelah loading selesai ────────────────────────────────────────
  useEffect(() => {
    if (!chromeRevealed || revealed.current) return;
    revealed.current = true;
    const tiles = innerRef.current?.querySelectorAll('[data-tile-id]');
    if (!tiles?.length) return;
    scaleAnim.current?.kill();
    filterAnim.current?.kill();

    if (isHover) {
      scaleAnim.current = gsap.to(tiles, {
        scale: 1, opacity: 1,
        duration: 0.7, ease: 'power2.out', delay: 0.3, overwrite: true,
      });
      filterAnim.current = gsap.to(tiles, {
        filter: BLUR_OFF,
        duration: 0.7, ease: 'expo.out', delay: 0.3, overwrite: true,
        onComplete: () => gsap.set(tiles, { clearProps: 'filter' }),
      });
    } else {
      scaleAnim.current = gsap.to(tiles, {
        scale: 1, opacity: 1,
        duration: 0.7, ease: 'power2.out', delay: 0.3, overwrite: true,
      });
    }
  }, [chromeRevealed, isHover]);

  // ── Transisi kategori (hide) ──────────────────────────────────────────────
  useEffect(() => {
    if (!transitioning) return;
    const tiles = innerRef.current?.querySelectorAll('[data-tile-id]');
    if (!tiles?.length) return;
    scaleAnim.current?.kill();
    filterAnim.current?.kill();
    scaleAnim.current = gsap.to(tiles, {
      scale: 0, opacity: 0,
      duration: 0.6, ease: 'power3.inOut', overwrite: true,
    });
    if (isHover) {
      filterAnim.current = gsap.to(tiles, {
        filter: BLUR_ON,
        duration: 0.6, ease: 'power3.inOut', overwrite: true,
      });
    }
  }, [transitioning, isHover]);

  // ── Nonce: kategori baru (reveal ulang) ───────────────────────────────────
  useLayoutEffect(() => {
    if (nonce === 0) return;
    const tiles = innerRef.current?.querySelectorAll('[data-tile-id]');
    if (!tiles?.length) return;
    scaleAnim.current?.kill();
    filterAnim.current?.kill();

    if (isHover) {
      gsap.set(tiles, { scale: 0, opacity: 0, filter: BLUR_ON });
      scaleAnim.current = gsap.to(tiles, {
        scale: 1, opacity: 1,
        duration: 1, ease: 'power3.out', overwrite: true,
      });
      filterAnim.current = gsap.to(tiles, {
        filter: BLUR_OFF,
        duration: 1, ease: 'expo.out', overwrite: true,
        onComplete: () => gsap.set(tiles, { clearProps: 'filter' }),
      });
    } else {
      gsap.set(tiles, { scale: 0, opacity: 0 });
      scaleAnim.current = gsap.to(tiles, {
        scale: 1, opacity: 1,
        duration: 1, ease: 'power3.out', overwrite: true,
      });
    }
  }, [nonce, isHover]);

  // ── Focus: sembunyikan/tampilkan tiles lain ───────────────────────────────
  useEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;
    const allTiles = Array.from(inner.querySelectorAll('[data-tile-id]'));

    if (focusedId && !isClosing) {
      const others = source ? allTiles.filter((el) => el !== source) : allTiles;
      gsap.to(others, {
        scale: 0, opacity: 0,
        duration: 0.7, ease: 'power2.inOut', overwrite: true,
      });
      if (isHover) {
        filterAnim.current?.kill();
        filterAnim.current = gsap.to(others, {
          filter: BLUR_ON,
          duration: 0.7, ease: 'power3.inOut', overwrite: true,
        });
      }
    } else if (focusedId && isClosing) {
      const others = source ? allTiles.filter((el) => el !== source) : allTiles;
      gsap.to(others, {
        scale: 1, opacity: 1,
        duration: 0.7, ease: 'power2.out', overwrite: true,
      });
      if (isHover) {
        filterAnim.current?.kill();
        filterAnim.current = gsap.to(others, {
          filter: BLUR_OFF,
          duration: 0.7, ease: 'expo.out', overwrite: true,
          onComplete: () => gsap.set(others, { clearProps: 'filter' }),
        });
      }
    }
  }, [focusedId, isClosing, source, isHover]);

  // ── Video IntersectionObserver ────────────────────────────────────────────
  useEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;
    const videos = inner.querySelectorAll('video');
    if (!videos.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const v = entry.target;
          if (entry.isIntersecting) {
            if (!v.dataset.primed) {
              v.dataset.primed = '1';
              const prime = () => { try { v.currentTime = 0.001; } catch {} };
              if (v.readyState >= 1) prime();
              else {
                v.addEventListener('loadedmetadata', prime, { once: true });
                v.preload = 'metadata';
                v.load();
              }
            }
          } else if (!v.paused) {
            v.pause();
          }
        }
      },
      { rootMargin: '200px' }
    );
    videos.forEach((v) => obs.observe(v));
    return () => obs.disconnect();
  }, [columns, nonce, isHover, repeatX, repeatY]);

  // ── Pointer & Wheel events ────────────────────────────────────────────────
  useEffect(() => {
    const wrap  = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return;

    let capturing  = false;
    let hasDragged = false;
    let startX = 0, startY = 0;
    let originX = 0, originY = 0;
    let vx = 0, vy = 0;
    let lastT = 0, lastX = 0, lastY = 0;
    let startEl   = null;
    let captureId = null;

    const squashTiles = () => {
      isDragging.current = true;
      const tiles = inner.querySelectorAll('[data-tile-id]');
      scaleAnim.current?.kill();
      scaleAnim.current = gsap.to(tiles, {
        scale: DRAG_TILE_SCALE,
        duration: 0.6, ease: 'expo.out', overwrite: 'auto',
      });
    };

    const restoreTiles = (duration = 0.9) => {
      isDragging.current = false;
      const tiles   = Array.from(inner.querySelectorAll('[data-tile-id]'));
      const hovered = hoveredEl.current;
      const others  = hovered ? tiles.filter((el) => el !== hovered) : tiles;
      scaleAnim.current?.kill();
      scaleAnim.current = gsap.to(others, {
        scale: 1, duration, ease: 'expo.out', overwrite: 'auto',
      });
      if (hovered && !isDragging.current) {
        gsap.to(hovered, {
          scale: HOVER_SCALE, duration, ease: 'expo.out', overwrite: 'auto',
        });
      }
    };

    const onDown = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      inertiaRef.current?.kill();
      stopLerp();
      capturing  = true;
      hasDragged = false;
      startX     = e.clientX;
      startY     = e.clientY;
      originX    = posRef.current.x;
      originY    = posRef.current.y;
      lastT      = e.timeStamp;
      lastX      = e.clientX;
      lastY      = e.clientY;
      vx = vy    = 0;
      startEl    = e.target;
      captureId  = e.pointerId;
      wrap.setPointerCapture(e.pointerId);
      wrap.style.cursor = 'grabbing';
      squashTiles();
    };

    const onMove = (e) => {
      if (!capturing) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!hasDragged && Math.hypot(dx, dy) > DRAG_THRESHOLD) hasDragged = true;
      posRef.current.x = originX + dx;
      posRef.current.y = originY + dy;

      const dt = e.timeStamp - lastT;
      if (dt > 0) {
        const alpha = Math.min(1, dt / VELOCITY_WINDOW);
        vx = vx * (1 - alpha) + ((e.clientX - lastX) / dt) * 1000 * alpha;
        vy = vy * (1 - alpha) + ((e.clientY - lastY) / dt) * 1000 * alpha;
        lastT = e.timeStamp;
        lastX = e.clientX;
        lastY = e.clientY;
      }
      applyPositions();
    };

    const onUp = (e) => {
      if (!capturing) return;
      capturing = false;
      if (captureId !== null) {
        try { wrap.releasePointerCapture(captureId); } catch {}
        captureId = null;
      }
      wrap.style.cursor = 'grab';

      if (e.pointerType === 'mouse' && !focusedId) {
        const el = document.elementFromPoint(e.clientX, e.clientY)
          ?.closest('[data-tile-id]') ?? null;
        hoveredEl.current = el;
        if (el && isHover) el.querySelector('video')?.play().catch(() => {});
      }
      restoreTiles(0.9);

      if (!hasDragged && startEl) {
        const tileEl = startEl.closest('[data-tile-id]');
        if (tileEl?.dataset.tileId) {
          openFocus(tileEl.dataset.tileId, tileEl);
        }
      }

      const cw     = colWidthRef.current;
      const stride = cw + GAP;
      const targetX = e.pointerType === 'mouse'
        ? Math.round((posRef.current.x + vx * INERTIA_FRICTION) / stride) * stride
        : posRef.current.x + vx * INERTIA_FRICTION;
      const targetY = posRef.current.y + vy * INERTIA_FRICTION;

      inertiaRef.current = gsap.to(posRef.current, {
        x: targetX, y: targetY,
        duration: INERTIA_DURATION, ease: 'expo.out',
        onUpdate: applyPositions,
        onComplete: () => setWillChange(false),
      });
      setWillChange(true);
    };

    const onPointerOver = (e) => {
      if (e.pointerType !== 'mouse' || focusedId) return;
      const el = e.target?.closest('[data-tile-id]');
      if (!el || el === hoveredEl.current) return;

      const prev = hoveredEl.current;
      hoveredEl.current = el;

      if (prev) {
        prev.querySelector('video')?.pause();
        if (!isDragging.current) {
          gsap.to(prev, { scale: 1, duration: 0.7, ease: 'expo.out', overwrite: 'auto' });
        }
      }

      if (isHover) el.querySelector('video')?.play().catch(() => {});

      const id = el.dataset.tileId;
      if (id && !isDiscovered(id)) {
        markDiscovered(id);
        inner.querySelectorAll(`[data-tile-id="${id}"]`)
          .forEach((node) => node.classList.add('discovered'));
      }

      if (!isDragging.current) {
        gsap.to(el, { scale: HOVER_SCALE, duration: 0.6, ease: 'expo.out', overwrite: 'auto' });
      }
    };

    const onPointerOut = (e) => {
      if (e.pointerType !== 'mouse') return;
      const el = e.target?.closest('[data-tile-id]');
      if (!el || hoveredEl.current !== el) return;
      const related = e.relatedTarget;
      if (related && el.contains(related)) return;
      hoveredEl.current = null;
      el.querySelector('video')?.pause();
      if (!isDragging.current) {
        gsap.to(el, { scale: 1, duration: 0.7, ease: 'expo.out', overwrite: 'auto' });
      }
    };

    const onWheel = (e) => {
      if (focusedId) return;
      if (e.deltaX === 0 && e.deltaY === 0) return;
      const factor = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
      const dx = (e.deltaX || 0) * factor * SCROLL_MULT;
      const dy = e.deltaY * factor * SCROLL_MULT;

      if (!rafRef.current) {
        targetRef.current.x = posRef.current.x;
        targetRef.current.y = posRef.current.y;
      }
      targetRef.current.x -= dx;
      targetRef.current.y -= dy;
      startLerp();
      if (e.cancelable) e.preventDefault();
    };

    wrap.addEventListener('pointerdown',   onDown);
    wrap.addEventListener('pointermove',   onMove);
    wrap.addEventListener('pointerup',     onUp);
    wrap.addEventListener('pointercancel', onUp);
    wrap.addEventListener('pointerover',   onPointerOver);
    wrap.addEventListener('pointerout',    onPointerOut);
    wrap.addEventListener('wheel',         onWheel, { passive: false });

    return () => {
      wrap.removeEventListener('pointerdown',   onDown);
      wrap.removeEventListener('pointermove',   onMove);
      wrap.removeEventListener('pointerup',     onUp);
      wrap.removeEventListener('pointercancel', onUp);
      wrap.removeEventListener('pointerover',   onPointerOver);
      wrap.removeEventListener('pointerout',    onPointerOut);
      wrap.removeEventListener('wheel',         onWheel);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      inertiaRef.current?.kill();
      scaleAnim.current?.kill();
      filterAnim.current?.kill();
    };
  }, [
    applyPositions, startLerp, stopLerp, setWillChange,
    openFocus, markDiscovered, isDiscovered,
    focusedId, isHover,
  ]);

  // ── Render ────────────────────────────────────────────────────────────────
  const numCols   = columns.length;
  const totalCols = repeatX * numCols;
  const mediaClass = isHover ? MEDIA_HOVER_CLASS : MEDIA_TOUCH_CLASS;

  return (
    <div
      ref={wrapRef}
      className="fixed inset-0 z-0 cursor-grab touch-none select-none overflow-hidden"
      style={{ backgroundColor: '#f1f1f1' }}
    >
      <div
        ref={innerRef}
        className={`absolute left-1/2 top-1/2 flex items-center gap-4${focusedId ? ' [&_.video-badge]:opacity-0' : ''}`}
        style={{ transform: 'translate(-50%, -50%)' }}
      >
        {Array.from({ length: totalCols }, (_, ci) => {
          const col = columns[ci % numCols];
          return (
            <div
              key={ci}
              ref={(el) => { colRefs.current[ci] = el; }}
              className={COL_WIDTH_CLASS}
            >
              {Array.from({ length: repeatY }).flatMap((_, ri) =>
                col.map((tile) => {
                  const aspectClass = TILE_ASPECT_CLASSES[tile.size] ?? 'aspect-square';
                  const isFocused   = focusedId === tile.id;
                  const discovered  = isDiscovered(tile.id);
                  const useVideo    = tile.media.kind === 'video' && (isHover || !tile.media.posterSrc);
                  const imgSrc      =
                    tile.media.kind === 'video'
                      ? (tile.media.posterSrc ?? tile.media.src)
                      : tile.media.src;

                  return (
                    <div
                      key={`${ri}-${tile.id}`}
                      className={`${aspectClass} relative shrink-0${isFocused ? '' : ' [content-visibility:auto]'}`}
                    >
                      <div
                        data-tile-id={tile.id}
                        style={{ backgroundColor: tileColor(tile) }}
                        className={`group absolute inset-0 overflow-hidden rounded-lg${discovered ? ' discovered' : ''}`}
                      >

                        {tile.media.kind === 'video' && (
                          <div
                            aria-hidden
                            className="video-badge pointer-events-none absolute left-2 top-2 z-10 flex items-center gap-[1px] rounded-[4px] bg-white px-[4px] border [border-color:rgba(0,0,0,0.1)] py-[2px] group-hover:opacity-0"
                            style={{ WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' }}
                          >
                            <svg width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                              <path d="M2.5 2.495C2.5 2.009 2.5 1.766 2.601 1.633C2.689 1.516 2.824 1.444 2.97 1.435C3.138 1.425 3.34 1.56 3.744 1.829L9.002 5.334C9.335 5.557 9.502 5.668 9.56 5.808C9.611 5.931 9.611 6.069 9.56 6.191C9.502 6.332 9.335 6.443 9.002 6.666L3.744 10.171C3.34 10.44 3.138 10.575 2.97 10.565C2.824 10.556 2.689 10.484 2.601 10.367C2.5 10.233 2.5 9.991 2.5 9.505V2.495Z" fill="#00000054" />
                              <path d="M2.955 1.186C3.111 1.176 3.256 1.236 3.388 1.308C3.522 1.38 3.685 1.489 3.883 1.621L9.141 5.126C9.303 5.234 9.439 5.325 9.541 5.407C9.643 5.49 9.738 5.585 9.791 5.713C9.867 5.897 9.867 6.103 9.791 6.287C9.738 6.415 9.643 6.509 9.541 6.592C9.439 6.674 9.304 6.765 9.141 6.874L3.883 10.379C3.685 10.511 3.522 10.62 3.388 10.692C3.256 10.764 3.111 10.824 2.955 10.815C2.736 10.801 2.535 10.693 2.402 10.519C2.308 10.394 2.277 10.241 2.264 10.091C2.25 9.939 2.25 9.743 2.25 9.505V2.495C2.25 2.257 2.25 2.061 2.264 1.909C2.277 1.759 2.308 1.606 2.402 1.481C2.535 1.307 2.736 1.199 2.955 1.186Z" fill="none" stroke="#00000054" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span style={{ color: '#000000A8', fontSize: 12, letterSpacing: '-0.02em', lineHeight: '120%' }}>
                              video
                            </span>
                          </div>
                        )}

                        {useVideo ? (
                          <video
                            src={tile.media.src}
                            poster={tile.media.posterSrc}
                            loop muted playsInline
                            preload="none"
                            className={mediaClass}
                          />
                        ) : (
                          <img
                            src={imgSrc}
                            alt=""
                            draggable={false}
                            decoding="async"
                            className={mediaClass}
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
