import { useRef, useState, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { usePopup } from '../../contexts/PopupContext';
import { useTiles } from '../../contexts/TileContext';
import { useFocus } from '../../contexts/FocusContext';

const CATEGORIES = [
  { category: 'everything', label: 'All', icon: '/media/icons/ALL.svg' },
  { category: 'product', label: 'Product', icon: '/media/icons/PRODUCT.svg' },
  { category: 'brand', label: 'Brand', icon: '/media/icons/BRAND.svg' },
  { category: 'web', label: 'Web', icon: '/media/icons/WEB.svg' },
];

export default function CategoryPicker() {
  const { popup, category, setCategory } = usePopup();
  const { focusedId, isClosing } = useFocus();
  const { transitioning } = useTiles();

  const focusActive = focusedId !== null && !isClosing;
  const isVisible = !focusActive && !(popup === 'info' || popup === 'contact' || popup === 'complete');

  const [activeIdx, setActiveIdx] = useState(() => {
    const i = CATEGORIES.findIndex((c) => c.category === category);
    return i === -1 ? 0 : i;
  });

  useLayoutEffect(() => {
    const i = CATEGORIES.findIndex((c) => c.category === category);
    if (i !== -1) setActiveIdx(i);
  }, [category]);

  const pillRef = useRef(null);
  const labelRef = useRef(null);
  const iconGroupRef = useRef(null);
  const pillInit = useRef(false);

  useLayoutEffect(() => {
    const el = pillRef.current;
    if (!el) return;
    if (!pillInit.current) {
      pillInit.current = true;
      gsap.set(el, { scale: +!!isVisible, opacity: +!!isVisible });
      return;
    }
    gsap.to(el, { scale: +!!isVisible, duration: isVisible ? 0.4 : 0.3, ease: isVisible ? 'power2.out' : 'power2.in' });
    gsap.to(el, { opacity: +!!isVisible, duration: isVisible ? 0.3 : 0.2, ease: isVisible ? 'power2.out' : 'power2.in' });
  }, [isVisible]);

  const [displayIdx, setDisplayIdx] = useState(activeIdx);
  const transRef = useRef(transitioning);
  useLayoutEffect(() => {
    if (transRef.current && !transitioning) {
      setDisplayIdx(activeIdx);
    }
    transRef.current = transitioning;
  }, [transitioning, activeIdx]);

  const cycle = () => {
    const next = (activeIdx + 1) % CATEGORIES.length;
    setActiveIdx(next);
    setCategory(CATEGORIES[next].category);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-8 z-10 flex justify-center">
      <ul className="pointer-events-none flex">
        <li>
          <button
            ref={pillRef}
            type="button"
            aria-label={`Category: ${CATEGORIES[activeIdx].label}. Tap to change`}
            aria-hidden={!isVisible}
            onClick={cycle}
            style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
            className="btn-interactive flex h-16 w-[200px] items-center justify-center rounded-full bg-white px-5 text-black"
          >
            <div className="flex w-full items-center justify-between">
              <span ref={labelRef} className="text-[20px] leading-[120%]" style={{ transformOrigin: '0% 50%' }}>
                {CATEGORIES[displayIdx].label}
              </span>
              <span ref={iconGroupRef} className="flex shrink-0 items-center gap-1" style={{ transformOrigin: '100% 50%' }}>
                <img src="/media/icons/FOLDER.svg" alt="" draggable={false} className="size-6 shrink-0" />
                <span className="relative size-6 shrink-0">
                  {CATEGORIES.map((c, i) => (
                    <img
                      key={c.category}
                      src={c.icon}
                      alt=""
                      draggable={false}
                      className="absolute inset-0 size-6"
                      style={{ opacity: +(i === displayIdx) }}
                    />
                  ))}
                </span>
              </span>
            </div>
          </button>
        </li>
      </ul>
    </div>
  );
}
