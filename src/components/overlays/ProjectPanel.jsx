import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { usePopup } from '../../contexts/PopupContext';
import { useFocus } from '../../contexts/FocusContext';
import { getProject } from '../../data/projects';
import { ALL_TILES } from '../../data/tiles';

const MAX_HEIGHT = 224;

function getTile(id) {
  return ALL_TILES.find((t) => t.id === id) ?? null;
}

export default function ProjectPanel() {
  const { popup, setPopup } = usePopup();
  const { focusedId } = useFocus();
  const isOpen = popup === 'project' && focusedId !== null;

  const panelRef = useRef(null);
  const init = useRef(false);
  const lastProject = useRef(null);

  const tile = focusedId ? getTile(focusedId) : null;
  const project = tile?.projectSlug ? getProject(tile.projectSlug) : null;
  if (project) lastProject.current = project;
  const displayProject = project ?? lastProject.current;

  useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    if (!init.current) {
      init.current = true;
      gsap.set(el, { scale: +!!isOpen, opacity: +!!isOpen, y: isOpen ? 0 : 24 });
      return;
    }
    if (isOpen) {
      gsap.to(el, { scale: 1, y: 0, duration: 0.6, ease: 'power2.out' });
      gsap.to(el, { opacity: 1, duration: 0.3, ease: 'power2.out' });
    } else {
      gsap.to(el, { scale: 0, y: 24, duration: 0.6, ease: 'power2.out' });
      gsap.to(el, { opacity: 0, duration: 0.3, ease: 'power2.in' });
    }
  }, [isOpen]);

  if (!displayProject) return null;

  const { title, subtitle, icon, stats, bio, collaborators, tools, scope } = displayProject;

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close project details"
          onClick={() => setPopup(null)}
          className="fixed inset-0 z-10 cursor-default"
        />
      )}
      <div className="pointer-events-none fixed inset-x-0 bottom-[112px] z-10 flex justify-center px-4">
        <div
          ref={panelRef}
          role="dialog"
          aria-label={title}
          aria-hidden={!isOpen}
          inert={!isOpen}
          style={{
            transformOrigin: '50% 100%',
            transform: 'scale(0)',
            opacity: 0,
            maxHeight: `calc(100dvh - ${MAX_HEIGHT}px)`,
            pointerEvents: isOpen ? 'auto' : 'none',
          }}
          className="ui-shadow relative flex w-full max-w-[400px] flex-col overflow-hidden rounded-2xl bg-white"
        >
          <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">

            <div className="flex items-center gap-3 border-b border-black/15 pb-4">
              <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-white" style={{ border: '1px solid rgba(0,0,0,0.1)' }}>
                <img src={icon} alt="" className="size-full object-cover" />
              </div>
              <div className="flex flex-col">
                <p className="text-[24px] leading-none tracking-[-0.01em] text-black">{title}</p>
                {subtitle && <p className="text-[24px] leading-none tracking-[-0.01em] text-black/35">{subtitle}</p>}
              </div>
            </div>

            {stats?.length > 0 && (
              <div className="flex items-start justify-between gap-2 border-b border-black/15 pb-4">
                {stats.map((s) => (
                  <div key={s.label} className="flex flex-1 flex-col items-center">
                    <p className="text-[32px] leading-none tracking-[-0.01em] text-black">{s.value}</p>
                    <p className="text-[10px] leading-none tracking-[-0.01em] text-black/35">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {bio && (
              <div className="border-b border-black/15 pb-4">
                <p className="text-[14px] leading-[120%] tracking-[-0.01em] text-black/65">{bio}</p>
              </div>
            )}

            {(collaborators || tools || scope) && (
              <div className="flex items-start gap-4">
                {(collaborators || tools) && (
                  <div className="flex flex-1 flex-col gap-1">
                    <p className="text-[10px] leading-none tracking-[-0.01em] text-black/35">
                      {collaborators ? 'Collaborators' : 'Tools + Tech'}
                    </p>
                    <ul className="text-[14px] leading-[120%] tracking-[-0.01em] text-black">
                      {(collaborators ?? tools)?.map((c) => <li key={c}>{c}</li>)}
                    </ul>
                  </div>
                )}
                {scope && (
                  <div className="flex flex-1 flex-col gap-1">
                    <p className="text-[10px] leading-none tracking-[-0.01em] text-black/35">Scope</p>
                    <ul className="text-[14px] leading-[120%] tracking-[-0.01em] text-black">
                      {scope.map((s) => <li key={s}>{s}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div aria-hidden className="h-8 shrink-0" />
          </div>

          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-8">
            <div
              className="absolute inset-0"
              style={{
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                maskImage: 'linear-gradient(transparent 0%, black 100%)',
                WebkitMaskImage: 'linear-gradient(transparent 0%, black 100%)',
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
