import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { useFocus } from '../../contexts/FocusContext';
import { usePopup } from '../../contexts/PopupContext';
import { ALL_TILES } from '../../data/tiles';
import { getProject } from '../../data/projects';

function getTile(id) {
  return ALL_TILES.find((t) => t.id === id) ?? null;
}

export default function FocusBar() {
  const { focusedId, isClosing, setFocusedId } = useFocus();
  const { popup, setPopup } = usePopup();

  const isProject = popup === 'project';
  const focusActive = focusedId !== null && !isClosing;
  const barVisible = focusActive;
  const collapseVisible = focusActive;

  const lastTileRef = useRef(null);
  const tile = focusedId ? getTile(focusedId) : null;
  if (tile) lastTileRef.current = tile;
  const displayTile = tile ?? lastTileRef.current;

  const description = displayTile?.description ?? '';
  const projectSlug = displayTile?.projectSlug;
  const project = projectSlug ? getProject(projectSlug) : null;

  const barRef = useRef(null);
  const collapseRef = useRef(null);
  const barInit = useRef(false);

  useLayoutEffect(() => {
    const bar = barRef.current;
    const col = collapseRef.current;
    if (!bar || !col) return;

    const targetX = isProject ? -(bar.getBoundingClientRect().width + 8) / 2 : 0;

    if (!barInit.current) {
      barInit.current = true;
      gsap.set(bar, { scale: +!!barVisible, opacity: +!!barVisible, x: targetX });
      gsap.set(col, { scale: +!!collapseVisible, opacity: +!!collapseVisible });
      return;
    }
    gsap.to(bar, { scale: +!!barVisible, duration: barVisible ? 0.6 : 0.6, ease: barVisible ? 'power2.out' : 'power2.out' });
    gsap.to(bar, { opacity: +!!barVisible, duration: barVisible ? 0.3 : 0.3, ease: 'power2.out' });
    gsap.to(bar, { x: targetX, duration: 0.4, ease: 'power2.inOut' });
    gsap.to(col, { scale: +!!collapseVisible, duration: collapseVisible ? 0.4 : 0.3, ease: collapseVisible ? 'power2.out' : 'power2.in' });
    gsap.to(col, { opacity: +!!collapseVisible, duration: collapseVisible ? 0.3 : 0.2, ease: 'power2.out' });
  }, [barVisible, collapseVisible, isProject]);

  const closeLabel = isProject ? 'Collapse project details' : 'Close';

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-8 z-10 flex justify-center px-8">
      <div className="flex w-full max-w-[400px] items-center gap-2">

        <div ref={barRef} className="flex-1" style={{ transformOrigin: '50% 50%' }}>
          <button
            type="button"
            onClick={project ? () => setPopup('project') : undefined}
            aria-hidden={!barVisible}
            style={{ pointerEvents: barVisible && project ? 'auto' : 'none', cursor: project ? 'pointer' : 'default' }}
            className="btn-interactive flex h-16 w-full items-center gap-2 overflow-hidden rounded-lg bg-white pl-3 pr-6 py-[9px] text-left"
          >
            <div
              className="size-10 shrink-0 overflow-hidden rounded bg-white"
              style={{ border: '1px solid rgba(0, 0, 0, 0.1)' }}
            >
              {project && (
                <img src={project.icon} alt="" draggable={false} className="size-full object-cover" />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-start">
              <p className="line-clamp-2 w-full text-[12px] leading-[120%] tracking-[-0.01em] text-black/65">
                {description}
              </p>
              {project && (
                <span className="shrink-0 text-[12px] leading-[120%] tracking-[-0.01em] text-black underline underline-offset-2">
                  more info +
                </span>
              )}
            </div>
          </button>
        </div>

        <div ref={collapseRef} className="shrink-0">
          <button
            type="button"
            aria-label={closeLabel}
            aria-hidden={!collapseVisible}
            onClick={isProject ? () => setPopup(null) : () => setFocusedId(null)}
            style={{ pointerEvents: collapseVisible ? 'auto' : 'none' }}
            className="btn-interactive flex size-16 items-center justify-center rounded-full bg-white text-black"
          >
            <img
              src={isProject ? '/media/icons/COLLAPSE.svg' : '/media/icons/CLOSE.svg'}
              alt=""
              draggable={false}
              className="size-6"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
