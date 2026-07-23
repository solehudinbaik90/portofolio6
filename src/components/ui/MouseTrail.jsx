import { useRef, useEffect, useState } from 'react';
import { useHoverDevice } from '../../hooks/useHoverDevice';

const CURSOR_SIZE = 16;
const TRAIL_WINDOW = 100;
const LINE_WIDTH = 4;
const TRAIL_COLOR = '253, 1, 27';

export default function MouseTrail() {
  const isHover = useHoverDevice();
  const canvasRef = useRef(null);
  const dotRef = useRef(null);
  const trail = useRef([]);

  useEffect(() => {
    if (!isHover) return;
    const canvas = canvasRef.current;
    const dot = dotRef.current;
    if (!canvas || !dot) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    let cx = -100, cy = -100, visible = false;

    const onMove = (e) => {
      cx = e.clientX;
      cy = e.clientY;
      if (!visible) {
        visible = true;
        dot.style.opacity = '1';
      }
      trail.current.push({ x: cx, y: cy, t: performance.now() });
    };

    const onLeave = () => {
      visible = false;
      dot.style.opacity = '0';
    };

    window.addEventListener('pointermove', onMove);
    document.addEventListener('pointerleave', onLeave);

    let raf = 0;
    const draw = () => {
      const now = performance.now();
      trail.current = trail.current.filter((p) => now - p.t <= TRAIL_WINDOW);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.lineWidth = LINE_WIDTH;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let i = 1; i < trail.current.length; i++) {
        const prev = trail.current[i - 1];
        const curr = trail.current[i];
        const age = now - curr.t;
        ctx.strokeStyle = `rgba(${TRAIL_COLOR}, ${Math.max(0, 1 - age / TRAIL_WINDOW)})`;
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(curr.x, curr.y);
        ctx.stroke();
      }
      dot.style.transform = `translate3d(${cx - CURSOR_SIZE / 2}px, ${cy - CURSOR_SIZE / 2}px, 0)`;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, [isHover]);

  if (!isHover) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-[9998]"
      />
      <div
        ref={dotRef}
        className="ui-shadow pointer-events-none fixed left-0 top-0 z-[9999] rounded-full bg-white opacity-0"
        style={{
          width: CURSOR_SIZE,
          height: CURSOR_SIZE,
          willChange: 'transform',
        }}
      />
    </>
  );
}
