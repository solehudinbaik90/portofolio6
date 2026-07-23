import { useRef, useEffect, useCallback, useLayoutEffect, useState } from 'react';
import gsap from 'gsap';
import { useTiles } from '../../contexts/TileContext';
import { useFocus } from '../../contexts/FocusContext';
import { useDiscoveryActions } from '../../contexts/DiscoveryContext';
import { useHoverDevice, isHoverDevice } from '../../hooks/useHoverDevice';
import { tileColumnHeight } from '../../utils/layout';
import Tile from '../tiles/Tile';

const GAP = 16;
const DRAG_THRESHOLD = 5;
const COL_WIDTHS = { default: 216, md: 360, xl: 480 };
const VELOCITY_WINDOW = 100;
const INERTIA_FRICTION = 0.9;
const INERTIA_DURATION = 1.5;
const SCROLL_MULTIPLIER = 1.0125;
const LERP_FACTOR = 0.15;

function getColWidth() {
  if (typeof window === 'undefined') return COL_WIDTHS.default;
  if (window.innerWidth >= 1920) return COL_WIDTHS.xl;
  if (window.innerWidth >= 768) return COL_WIDTHS.md;
  return COL_WIDTHS.default;
}

function wrapDelta(value, range) {
  const mod = ((value % range) + range) % range;
  return mod > range / 2 ? mod - range : mod;
}

export default function Board() {
  const { columns, nonce, transitioning, chromeRevealed } = useTiles();
  const { focusedId, isClosing, openFocus } = useFocus();
  const { markDiscovered, isDiscovered } = useDiscoveryActions();
  const isHover = useHoverDevice();

  const wrapRef = useRef(null);
  const innerRef = useRef(null);
  const colRefs = useRef([]);
  const posRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(0);
  const colWidthRef = useRef(getColWidth());
  const colOffsets = useRef([]);
  const inertiaRef = useRef(null);
  const scaleAnimRef = useRef(null);
  const filterAnimRef = useRef(null);
  const hoveredEl = useRef(null);
  const isDragging = useRef(false);
  const revealed = useRef(false);

  const [repeatX, setRepeatX] = useState(3);
  const [repeatY, setRepeatY] = useState(3);

  const recomputeRepeat = useCallback(() => {
    const cw = colWidthRef.current;
    const numCols = columns.length;
    if (numCols === 0) return;
    const totalW = numCols * (cw + GAP);
    setRepeatX(Math.max(2, Math.ceil(window.innerWidth / totalW) + 1));
    let minH = Infinity;
    for (const col of columns) minH = Math.min(minH, tileColumnHeight(col, cw));
    setRepeatY(Math.max(2, Math.ceil(window.innerHeight / minH) + 1));
  }, [columns]);

  const applyPositions = useCallback(() => {
    const cw = colWidthRef.current;
    const numCols = columns.length;
    if (numCols === 0 || !innerRef.current) return;
    const totalW = numCols * (cw + GAP);
    const wrappedX = ((posRef.current.x % totalW) + totalW) % totalW;
    innerRef.current.style.transform = `translate(${-50 + (wrappedX / totalW) * 100}%, -50%)`;

    for (let ci = 0; ci < colRefs.current.length; ci++) {
      const el = colRefs.current[ci];
      if (!el) continue;
      const col = columns[ci % numCols];
      const colH = tileColumnHeight(col, cw);
      const offset = colOffsets.current[ci % numCols] ?? 0;
      const wrappedY = wrapDelta(posRef.current.y + offset * colH, colH);
      el.style.transform = `translate3d(0, ${wrappedY}px, 0)`;
    }
  }, [columns]);

  const startLerp = useCallback(() => {
    if (rafRef.current) return;
    const loop = () => {
      posRef.current.x += (targetRef.current.x - posRef.current.x) * LERP_FACTOR;
      posRef.current.y += (targetRef.current.y - posRef.current.y) * LERP_FACTOR;
      applyPositions();
      const dx = Math.abs(targetRef.current.x - posRef.current.x);
      const dy = Math.abs(targetRef.current.y - posRef.current.y);
      if (dx < 0.1 && dy < 0.1) {
        posRef.current.x = targetRef.current.x;
        posRef.current.y = targetRef.current.y;
        rafRef.current = 0;
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [applyPositions]);

  useEffect(() => {
    if (colOffsets.current.length !== columns.length) {
      colOffsets.current = columns.map(() => Math.random());
    }
    applyPositions();
  }, [columns, applyPositions]);

  useEffect(() => {
    recomputeRepeat();
  }, [columns, recomputeRepeat]);

  useEffect(() => {
    applyPositions();
  }, [repeatX, repeatY, applyPositions]);

  useEffect(() => {
    const handler = () => {
      colWidthRef.current = getColWidth();
      recomputeRepeat();
      applyPositions();
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [recomputeRepeat, applyPositions]);

  const BLUR_ON = 'blur(32px)';
  const BLUR_OFF = 'blur(0px)';

  useLayoutEffect(() => {
    const tiles = innerRef.current?.querySelectorAll('[data-tile-id]');
    if (tiles) gsap.set(tiles, { scale: 0, opacity: 0, filter: BLUR_ON });
  }, [columns]);

  useEffect(() => {
    if (!chromeRevealed || revealed.current) return;
    revealed.current = true;
    const tiles = innerRef.current?.querySelectorAll('[data-tile-id]');
    if (!tiles?.length) return;
    scaleAnimRef.current?.kill();
    filterAnimRef.current?.kill();
    scaleAnimRef.current = gsap.to(tiles, { scale: 1, opacity: 1, duration: 0.7, ease: 'power2.out', delay: 0.3, stagger: 0, overwrite: true });
    filterAnimRef.current = gsap.to(tiles, {
      filter: BLUR_OFF, duration: 0.7, ease: 'expo.out', delay: 0.3, overwrite: true,
      onComplete: () => gsap.set(tiles, { clearProps: 'filter' }),
    });
  }, [chromeRevealed]);

  useEffect(() => {
    if (!transitioning) return;
    const tiles = innerRef.current?.querySelectorAll('[data-tile-id]');
    if (!tiles?.length) return;
    scaleAnimRef.current?.kill();
    filterAnimRef.current?.kill();
    scaleAnimRef.current = gsap.to(tiles, { scale: 0, opacity: 0, duration: 0.6, ease: 'power3.inOut', overwrite: true });
    filterAnimRef.current = gsap.to(tiles, { filter: BLUR_ON, duration: 0.6, ease: 'power3.inOut', overwrite: true });
  }, [transitioning]);

  useLayoutEffect(() => {
    if (nonce === 0) return;
    const tiles = innerRef.current?.querySelectorAll('[data-tile-id]');
    if (!tiles?.length) return;
    scaleAnimRef.current?.kill();
    filterAnimRef.current?.kill();
    gsap.set(tiles, { scale: 0, opacity: 0, filter: BLUR_ON });
    scaleAnimRef.current = gsap.to(tiles, { scale: 1, opacity: 1, duration: 1, ease: 'power3.out', overwrite: true });
    filterAnimRef.current = gsap.to(tiles, {
      filter: BLUR_OFF, duration: 1, ease: 'expo.out', overwrite: true,
      onComplete: () => gsap.set(tiles, { clearProps: 'filter' }),
    });
  }, [nonce]);

  useEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;
    const tiles = Array.from(inner.querySelectorAll('[data-tile-id]'));
    if (focusedId && !isClosing) {
      const others = tiles.filter((el) => el !== null);
      gsap.to(others, { scale: 0, opacity: 0, duration: 0.7, ease: 'power2.inOut', overwrite: true });
    } else if (focusedId && isClosing) {
      gsap.to(tiles, { scale: 1, opacity: 1, duration: 0.7, ease: 'power2.out', overwrite: true });
    }
  }, [focusedId, isClosing]);

  useEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;
    const videos = inner.querySelectorAll('video');
    if (!videos.length) return;
    const obs = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const v = entry.target;
        if (entry.isIntersecting) {
          if (!v.dataset.primed) {
            v.dataset.primed = '1';
            v.preload = 'metadata';
            v.load();
          }
        } else if (!v.paused) {
          v.pause();
        }
      }
    }, { rootMargin: '200px' });
    videos.forEach((v) => obs.observe(v));
    return () => obs.disconnect();
  }, [columns, nonce, repeatX, repeatY]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    let capturing = false;
    let startX = 0, startY = 0;
    let originX = 0, originY = 0;
    let hasDragged = false;
    let vx = 0, vy = 0;
    let lastT = 0, lastX = 0, lastY = 0;
    let startEl = null;
    let captureId = null;

    const onDown = (e) => {
      if (e.pointerType !== 'mouse' && e.button !== 0) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      inertiaRef.current?.kill();
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = 0; }
      targetRef.current.x = posRef.current.x;
      targetRef.current.y = posRef.current.y;
      capturing = true;
      hasDragged = false;
      startX = e.clientX; startY = e.clientY;
      originX = posRef.current.x; originY = posRef.current.y;
      lastT = e.timeStamp; lastX = e.clientX; lastY = e.clientY;
      vx = 0; vy = 0;
      startEl = e.target;
      captureId = e.pointerId;
      wrap.setPointerCapture(e.pointerId);
      wrap.style.cursor = 'grabbing';
      const tiles = innerRef.current?.querySelectorAll('[data-tile-id]');
      if (tiles) gsap.to(tiles, { scale: 0.9, duration: 0.6, ease: 'expo.out', overwrite: 'auto' });
    };

    const onMove = (e) => {
      if (!capturing) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (!hasDragged && Math.hypot(dx, dy) > DRAG_THRESHOLD) hasDragged = true;
      posRef.current.x = originX + dx;
      posRef.current.y = originY + dy;
      const dt = e.timeStamp - lastT;
      if (dt > 0) {
        const alpha = Math.min(1, dt / VELOCITY_WINDOW);
        vx = vx * (1 - alpha) + ((e.clientX - lastX) / dt) * 1000 * alpha;
        vy = vy * (1 - alpha) + ((e.clientY - lastY) / dt) * 1000 * alpha;
        lastT = e.timeStamp; lastX = e.clientX; lastY = e.clientY;
      }
      applyPositions();
    };

    const onUp = (e) => {
      if (!capturing) return;
      capturing = false;
      if (captureId !== null) { try { wrap.releasePointerCapture(captureId); } catch {} captureId = null; }
      wrap.style.cursor = 'grab';

      const tiles = innerRef.current?.querySelectorAll('[data-tile-id]');
      if (tiles) gsap.to(tiles, { scale: 1, duration: 0.6, ease: 'expo.out', overwrite: 'auto' });

      if (!hasDragged && startEl) {
        const tileEl = startEl.closest('[data-tile-id]');
        if (tileEl?.dataset.tileId) openFocus(tileEl.dataset.tileId, tileEl);
      }

      const cw = colWidthRef.current;
      const snap = e.pointerType === 'mouse' ? Math.round((posRef.current.x + vx * 0.6) / (cw + GAP)) * (cw + GAP) : posRef.current.x + vx * 0.6;
      inertiaRef.current = gsap.to(posRef.current, {
        x: snap, y: posRef.current.y + vy * 0.6,
        duration: INERTIA_DURATION, ease: 'expo.out',
        onUpdate: applyPositions,
      });
    };

    const onWheel = (e) => {
      if (e.deltaX === 0 && e.deltaY === 0) return;
      const factor = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
      targetRef.current.x -= e.deltaX * factor * SCROLL_MULTIPLIER;
      targetRef.current.y -= e.deltaY * factor * SCROLL_MULTIPLIER;
      startLerp();
      if (e.cancelable) e.preventDefault();
    };

    const onPointerOver = (e) => {
      if (e.pointerType !== 'mouse' || focusedId) return;
      const el = e.target?.closest('[data-tile-id]');
      if (!el || el === hoveredEl.current) return;
      const prev = hoveredEl.current;
      hoveredEl.current = el;
      if (prev) { prev.querySelector('video')?.pause(); }
      el.querySelector('video')?.play().catch(() => {});
      const id = el.dataset.tileId;
      if (id && !isDiscovered(id)) {
        markDiscovered(id);
        innerRef.current?.querySelectorAll(`[data-tile-id="${id}"]`).forEach((el) => el.classList.add('discovered'));
      }
      if (!isDragging.current) gsap.to(el, { scale: SCROLL_MULTIPLIER, duration: 0.6, ease: 'expo.out', overwrite: 'auto' });
    };

    const onPointerOut = (e) => {
      if (e.pointerType !== 'mouse') return;
      const el = e.target?.closest('[data-tile-id]');
      if (!el || hoveredEl.current !== el) return;
      const related = e.relatedTarget;
      if (related && el.contains(related)) return;
      hoveredEl.current = null;
      el.querySelector('video')?.pause();
      if (!isDragging.current) gsap.to(el, { scale: 1, duration: 0.7, ease: 'expo.out', overwrite: 'auto' });
    };

    wrap.addEventListener('pointerdown', onDown);
    wrap.addEventListener('pointermove', onMove);
    wrap.addEventListener('pointerup', onUp);
    wrap.addEventListener('pointercancel', onUp);
    wrap.addEventListener('pointerover', onPointerOver);
    wrap.addEventListener('pointerout', onPointerOut);
    wrap.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      wrap.removeEventListener('pointerdown', onDown);
      wrap.removeEventListener('pointermove', onMove);
      wrap.removeEventListener('pointerup', onUp);
      wrap.removeEventListener('pointercancel', onUp);
      wrap.removeEventListener('pointerover', onPointerOver);
      wrap.removeEventListener('pointerout', onPointerOut);
      wrap.removeEventListener('wheel', onWheel);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      inertiaRef.current?.kill();
      scaleAnimRef.current?.kill();
      filterAnimRef.current?.kill();
    };
  }, [applyPositions, startLerp, openFocus, markDiscovered, isDiscovered, focusedId]);

  const totalCols = repeatX * columns.length;

  return (
    <div
      ref={wrapRef}
      className="fixed inset-0 z-0 cursor-grab touch-none select-none overflow-hidden"
      style={{ backgroundColor: '#f1f1f1' }}
    >
      <div
        ref={innerRef}
        className="absolute left-1/2 top-1/2 flex items-center gap-4"
        style={{ transform: 'translate(-50%, -50%)' }}
      >
        {Array.from({ length: totalCols }, (_, ci) => {
          const col = columns[ci % columns.length];
          return (
            <div
              key={ci}
              ref={(el) => { colRefs.current[ci] = el; }}
              className="flex w-[216px] shrink-0 flex-col gap-4 min-[768px]:w-[360px] min-[1920px]:w-[480px]"
            >
              {Array.from({ length: repeatY }).flatMap((_, ri) =>
                col.map((tile) => (
                  <Tile
                    key={`${ri}-${tile.id}`}
                    tile={tile}
                    isFocused={focusedId === tile.id}
                    isDiscovered={isDiscovered(tile.id)}
                  />
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
