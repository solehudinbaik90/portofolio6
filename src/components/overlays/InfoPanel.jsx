import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { usePopup } from '../../contexts/PopupContext';
import Clock from '../ui/Clock';
import ContactButtons from '../ui/ContactButtons';

const CLIENTS = [
  'Askari Air', 'EDN', 'Jadu AR Inc.', 'Kollegio AI', 'LOFT',
  'O2 Business', 'Sabato Studio', 'Sarmayacar', 'Sir Elton John',
  'UNESCO', 'Volkswagen',
];
const INDUSTRIES = [
  'Agency / Studio', 'AR/VR/XR', 'Artificial Intelligence', 'E-Commerce',
  'Aviation', 'Culture', 'Entertainment', 'Fashion', 'Finance',
  'Telecommunication', 'Venture Capital',
];
const RECOGNITION = [
  'Awwwards', 'Forbes', "It's Nice That", 'LogoArchive', 'TEDx', 'UNICEF',
  'Rolling Stone',
];

const labelCls   = 'text-[10px] leading-none tracking-[-0.01em] text-black/35';
const bodyCls    = 'text-[14px] leading-[120%] tracking-[-0.01em] text-black';
const mutedCls   = 'text-[14px] leading-[120%] tracking-[-0.01em] text-black/35';
const dividerCls = 'border-b border-black/15 pb-4';

export default function InfoPanel() {
  const { popup } = usePopup();
  const isOpen = popup === 'info';
  const ref  = useRef(null);
  const init = useRef(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!init.current) {
      init.current = true;
      gsap.set(el, { scale: +!!isOpen, opacity: +!!isOpen, y: isOpen ? 0 : -24 });
      return;
    }
    if (isOpen) {
      gsap.to(el, { scale: 1, y: 0, duration: 0.6, ease: 'power2.out' });
      gsap.to(el, { opacity: 1, duration: 0.3, ease: 'power2.out' });
    } else {
      gsap.to(el, { scale: 0, y: -24, duration: 0.6, ease: 'power2.out' });
      gsap.to(el, { opacity: 0, duration: 0.3, ease: 'power2.in' });
    }
  }, [isOpen]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[112px] top-[112px] z-20 flex justify-center px-4">
      <div
        ref={ref}
        role="dialog"
        aria-label="About Hamza Tariq"
        aria-hidden={!isOpen}
        inert={!isOpen}
        style={{
          transformOrigin: '50% 0%',
          transform: 'scale(0)',
          opacity: 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
        className="ui-shadow relative flex h-full w-full max-w-[367px] flex-col overflow-hidden rounded-2xl bg-white"
      >
        <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">

          <div className={`flex items-start justify-between gap-3 ${dividerCls}`}>
            <div className="flex items-center gap-3">
              <img
                src="/headshot.png"
                alt="Hamza Tariq"
                className="size-16 shrink-0 rounded-lg object-cover"
              />
              <div className="flex flex-col">
                <p className="text-[24px] leading-none tracking-[-0.01em] text-black">
                  Hamza Tariq
                </p>
                <p className="text-[24px] leading-none tracking-[-0.01em] text-black/35">
                  Design etc.
                </p>
              </div>
            </div>

            <svg width="24" height="24" viewBox="0 0 24 24" className="shrink-0" aria-hidden>
              <path
                d="M15.75 0C17.938 2.34742e-07 20.0366 0.869085 21.5837 2.41626C23.1309 3.96343 24 6.06196 24 8.25C24 10.438 23.1309 12.5366 21.5837 14.0837C21.2566 14.4109 20.9046 14.7076 20.5324 14.9722C20.3535 15.0994 20.33 15.3597 20.4851 15.5149C22.4395 17.4693 23.6502 20.0282 23.935 22.7522C24.0068 23.4388 23.4404 24 22.75 24H16.25C15.5596 24 15.0238 23.4167 14.744 22.7856C14.2778 21.7337 13.2246 21 12 21C10.7754 21 9.72218 21.7337 9.25598 22.7856C8.97624 23.4167 8.44036 24 7.75 24H1.25C0.559644 24 -0.00675183 23.4388 0.0650234 22.7522C0.349774 20.0282 1.56053 17.4693 3.51489 15.5149C3.66996 15.3598 3.64621 15.0994 3.4675 14.9723C3.09534 14.7077 2.74344 14.4109 2.41626 14.0837C0.869085 12.5366 6.955e-08 10.438 0 8.25C9.38188e-08 6.06196 0.869085 3.96343 2.41626 2.41626C3.96343 0.869085 6.06196 2.34742e-07 8.25 0C9.49264 0 10.5 1.00736 10.5 2.25C10.5 3.49264 9.49264 4.5 8.25 4.5C9.49264 4.5 10.5 5.50736 10.5 6.75C10.5 7.55705 10.0751 8.26486 9.43678 8.66192C8.85059 9.02656 8.25 9.55964 8.25 10.25V11.66C8.25 12.1239 8.70415 12.4526 9.15483 12.3428C9.28672 12.3107 9.41925 12.2808 9.55234 12.2531C9.67001 12.2286 9.75 12.1202 9.75 12C9.75 10.7574 10.7574 9.75 12 9.75C13.2426 9.75 14.25 10.7574 14.25 12C14.25 12.1202 14.3296 12.2286 14.4473 12.2531C14.5805 12.2808 14.713 12.3107 14.845 12.3428C15.2957 12.4526 15.75 12.1238 15.75 11.6598V10.25C15.75 9.55964 15.1494 9.02656 14.5632 8.66192C13.9249 8.26486 13.5 7.55705 13.5 6.75C13.5 5.50736 14.5074 4.5 15.75 4.5C14.5074 4.5 13.5 3.49264 13.5 2.25C13.5 1.00736 14.5074 0 15.75 0Z"
                fill="black"
                fillOpacity="0.33"
              />
            </svg>
          </div>

          <div>
            <p className={bodyCls}>
              I'm a multidisciplinary designer with 8+ years of experience crafting and solving for:
            </p>
          </div>

          <div className={`flex items-start gap-2 ${dividerCls}`}>
            {[
              ['#44AA43', 'Product'],
              ['#2384E6', 'Web'],
              ['#FC011C', 'Brand'],
            ].map(([bg, name]) => (
              <div
                key={name}
                className="flex aspect-square min-w-0 flex-1 flex-col items-center justify-center rounded-full"
                style={{ backgroundColor: bg }}
              >
                <span className="text-[20px] leading-none text-white">{name}</span>
              </div>
            ))}
          </div>

          <div className={`flex flex-col gap-1 ${dividerCls}`}>
            <div className="flex justify-left gap-[2px]">

              <svg width="24" height="24" viewBox="0 0 24 24" className="shrink-0" aria-hidden>
                <path
                  d="M2.39 18.098L10.615 3.892C11.07 3.107 11.297 2.714 11.594 2.582C11.852 2.467 12.147 2.467 12.406 2.582C12.703 2.714 12.93 3.107 13.384 3.892L21.609 18.098C22.066 18.886 22.294 19.28 22.26 19.604C22.23 19.886 22.083 20.142 21.853 20.309C21.59 20.5 21.135 20.5 20.225 20.5H3.775C2.864 20.5 2.409 20.5 2.146 20.309C1.917 20.142 1.769 19.886 1.74 19.604C1.706 19.28 1.934 18.886 2.39 18.098Z"
                  fill="#FFBF00"
                  stroke="#FFBF00"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 17V13M12 9H12.01"
                  fill="none"
                  stroke="#000000"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <svg width="24" height="24" viewBox="0 0 24 24" className="shrink-0" aria-hidden>
                <path d="M19 2L16 5V8H19L22 5L20 4L19 2Z" fill="#CCCCCC" />
                <path
                  d="M16 8L12 12Z"
                  fill="#FD011B"
                />
                <path
                  d="M16 8V5L19 2L20 4L22 5L19 8H16ZM16 8L12 12M22 12C22 17.523 17.523 22 12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2M17 12C17 14.761 14.761 17 12 17C9.239 17 7 14.761 7 12C7 9.239 9.239 7 12 7"
                  fill="none"
                  stroke="#CCCCCC"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <p className={bodyCls}>
                AI is reshaping how we all work (—) and how the world creates and consumes.
                I'm leaning into it, adapting my workflows to stay nimble, while staying
                thoughtful about where the lines should sit: what we think through ourselves,
                what we hand off, and how we iterate.
              </p>
              <p className={mutedCls}>
                This very website is a small example: designed entirely in Figma and Paper,
                then developed with Claude and a careful round of manual adjustments in VS Code.
              </p>
            </div>
          </div>

          <div className={`flex items-start gap-4 ${dividerCls}`}>
            <div className="flex flex-1 flex-col gap-1">
              <p className={labelCls}>Select Clients</p>
              <ul className={bodyCls}>
                {CLIENTS.map((c) => <li key={c}>{c}</li>)}
              </ul>
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <p className={labelCls}>All Industries</p>
              <ul className={bodyCls}>
                {INDUSTRIES.map((i) => <li key={i}>{i}</li>)}
              </ul>
            </div>
          </div>

          <div className={`flex flex-col gap-1 ${dividerCls}`}>
            <p className={labelCls}>Recognition</p>
            <ul className={bodyCls}>
              {RECOGNITION.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </div>

          <div className={`flex items-start gap-1 ${dividerCls}`}>
            <div className="flex flex-1 flex-col gap-1">
              <p className={labelCls}>Now Listening</p>
              <p className={bodyCls}>Heavy Metal, Cameron Winter</p>
            </div>
            <img
              src="/media/info/now-listening.png"
              alt=""
              draggable={false}
              className="size-8 shrink-0 rotate-[5deg] rounded-[4px] object-cover"
            />
          </div>

          <div className={`flex items-start gap-1 ${dividerCls}`}>
            <div className="flex flex-1 flex-col gap-1">
              <p className={labelCls}>Now Reading</p>
              <p className={bodyCls}>On Photography, Susan Sontag</p>
            </div>
            <img
              src="/media/info/now-reading.png"
              alt=""
              draggable={false}
              className="size-8 shrink-0 rotate-[-5deg] rounded-[4px] object-cover"
            />
          </div>

          <div className={dividerCls}>
            <img
              src="/meme.png"
              alt=""
              className="aspect-[335/330] w-full rounded-xl object-cover"
            />
          </div>

          <div className={`flex flex-col gap-1 ${dividerCls}`}>
            <p className={labelCls}>Hamza Tariq (b. 1999)</p>
            <p className={bodyCls}>Working Globally</p>
          </div>

          <div className="flex items-start gap-4">
            <Clock
              timeZone="Asia/Karachi"
              marker="(A)"
              region="Asia"
              ariaLabel="Current time in Pakistan"
            />
            <Clock
              timeZone="Europe/London"
              marker="(B)"
              region="Europe"
              ariaLabel="Current time in the UK"
            />
          </div>

          <div aria-hidden className="h-16 shrink-0" />
        </div>

        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-16">
          <div
            className="absolute inset-0"
            style={{
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              maskImage: 'linear-gradient(180deg, transparent 0%, black 100%)',
              WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, black 100%)',
            }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, transparent 0%, transparent 100%)' }}
          />
        </div>
      </div>
    </div>
  );
}
