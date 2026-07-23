import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { usePopup } from '../../contexts/PopupContext';
import ContactButtons from '../ui/ContactButtons';
import Clock from '../ui/Clock';

const CLIENTS = ['Askari Air','EDN','Jadu AR Inc.','Kollegio AI','LOFT','O2 Business','Sabato Studio','Sarmayacar','Sir Elton John','UNESCO','Volkswagen'];
const INDUSTRIES = ['Agency / Studio','AR/VR/XR','Artificial Intelligence','E-Commerce','Aviation','Culture','Entertainment','Fashion','Finance','Telecommunication','Venture Capital'];
const RECOGNITION = ['Awwwards','Forbes','It\'s Nice That','LogoArchive','TEDx','UNICEF','Rolling Stone'];

const label = 'text-[10px] leading-none tracking-[-0.01em] text-black/35';
const body  = 'text-[14px] leading-[120%] tracking-[-0.01em] text-black';
const muted = 'text-[14px] leading-[120%] tracking-[-0.01em] text-black/35';
const divider = 'border-b border-black/15 pb-4';

export default function InfoPanel() {
  const { popup } = usePopup();
  const isOpen = popup === 'info';
  const ref = useRef(null);
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
    <div className="pointer-events-none fixed inset-x-0 bottom-[112px] top-[112px] z-10 flex justify-center px-4">
      <div
        ref={ref}
        role="dialog"
        aria-label="About Hamza Tariq"
        aria-hidden={!isOpen}
        inert={!isOpen}
        style={{ transformOrigin: '50% 0%', transform: 'scale(0)', opacity: 0, pointerEvents: isOpen ? 'auto' : 'none' }}
        className="ui-shadow relative flex h-full w-full max-w-[367px] flex-col overflow-hidden rounded-2xl bg-white"
      >
        <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">

          <div className={`flex items-start justify-between gap-3 ${divider}`}>
            <div className="flex items-center gap-3">
              <img src="/headshot.png" alt="Hamza Tariq" className="size-16 shrink-0 rounded-lg object-cover" />
              <div className="flex flex-col">
                <p className="text-[24px] leading-none tracking-[-0.01em] text-black">Hamza Tariq</p>
                <p className="text-[24px] leading-none tracking-[-0.01em] text-black/35">Design etc.</p>
              </div>
            </div>
            <svg width="24" height="24" viewBox="0 0 24 24" className="shrink-0" aria-hidden>
              <path d="M15.75 0C17.938 2.34742e-07 20.0366 0.869085 21.5837 2.41626C23.1309 3.96343 24 6.06196 24 8.25C24 10.438 23.1309 12.5366 21.5837 14.0837C21.2566 14.4109 20.9046 14.7076 20.5324 14.9722C20.3535 15.0994 20.33 15.3597 20.4851 15.5149C22.4395 17.4693 23.6502 20.0282 23.935 22.7522C24.0068 23.4388 23.4404 24 22.75 24H16.25C15.5596 24 15.0238 23.4167 14.744 22.7856C14.2778 21.7337 13.2246 21 12 21C10.7754 21 9.72218 21.7337 9.25598 22.7856C8.97624 23.4167 8.44036 24 7.75 24H1.25C0.559644 24 -0.00675183 23.4388 0.0650234 22.7522C0.349774 20.0282 1.56053 17.4693 3.51489 15.5149C3.66996 15.3598 3.64621 15.0994 3.4675 14.9723C3.09534 14.7077 2.74344 14.4109 2.41626 14.0837C0.869085 12.5366 6.955e-08 10.438 0 8.25C9.38188e-08 6.06196 0.869085 3.96343 2.41626 2.41626C3.96343 0.869085 6.06196 2.34742e-07 8.25 0C9.49264 0 10.5 1.00736 10.5 2.25C10.5 3.49264 9.49264 4.5 8.25 4.5C9.49264 4.5 10.5 5.50736 10.5 6.75C10.5 7.55705 10.0751 8.26486 9.43678 8.66192C8.85059 9.02656 8.25 9.55964 8.25 10.25V11.66C8.25 12.1239 8.70415 12.4526 9.15483 12.3428C9.28672 12.3107 9.41925 12.2808 9.55234 12.2531C9.67001 12.2286 9.75 12.1202 9.75 12C9.75 10.7574 10.7574 9.75 12 9.75C13.2426 9.75 14.25 10.7574 14.25 12C14.25 12.1202 14.3296 12.2286 14.4473 12.2531C14.5805 12.2808 14.713 12.3107 14.845 12.3428C15.2957 12.4526 15.75 12.1238 15.75 11.6598V10.25C15.75 9.55964 15.1494 9.02656 14.5632 8.66192C13.9249 8.26486 13.5 7.55705 13.5 6.75C13.5 5.50736 14.5074 4.5 15.75 4.5C14.5074 4.5 13.5 3.49264 13.5 2.25C13.5 1.00736 14.5074 0 15.75 0Z" fill="black" fillOpacity="0.33" />
            </svg>
          </div>

          <div>
            <p className={body}>I'm a multidisciplinary designer with 8+ years of experience crafting and solving for:</p>
          </div>

          <div className={`flex items-start gap-2 ${divider}`}>
            {[['#44AA43','Product'],['#2384E6','Web'],['#FC011C','Brand']].map(([bg, label]) => (
              <div key={label} className="flex aspect-square min-w-0 flex-1 flex-col items-center justify-center rounded-full" style={{ backgroundColor: bg }}>
                <span className="text-[20px] leading-none text-white">{label}</span>
              </div>
            ))}
          </div>

          <div className={`flex flex-col gap-1 ${divider}`}>
            <p className={body}>AI is reshaping how we all work (—) and how the world creates and consumes. I'm leaning into it, adapting my workflows to stay nimble, while staying thoughtful about where the lines should sit.</p>
            <p className={muted}>This very website is a small example: designed entirely in Figma and Paper, then developed with Claude and a careful round of manual adjustments in VS Code.</p>
          </div>

          <div className={`flex items-start gap-4 ${divider}`}>
            <div className="flex flex-1 flex-col gap-1">
              <p className={label}>Select Clients</p>
              <ul className={body}>{CLIENTS.map((c) => <li key={c}>{c}</li>)}</ul>
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <p className={label}>All Industries</p>
              <ul className={body}>{INDUSTRIES.map((i) => <li key={i}>{i}</li>)}</ul>
            </div>
          </div>

          <div className={`flex flex-col gap-1 ${divider}`}>
            <p className={label}>Recognition</p>
            <ul className={body}>{RECOGNITION.map((r) => <li key={r}>{r}</li>)}</ul>
          </div>

          <div className={`flex items-start gap-1 ${divider}`}>
            <div className="flex flex-1 flex-col gap-1">
              <p className={label}>Now Listening</p>
              <p className={body}>Heavy Metal, Cameron Winter</p>
            </div>
            <img src="/media/info/now-listening.png" alt="" draggable={false} className="size-8 shrink-0 rotate-[5deg] rounded-[4px] object-cover" />
          </div>

          <div className={`flex items-start gap-1 ${divider}`}>
            <div className="flex flex-1 flex-col gap-1">
              <p className={label}>Now Reading</p>
              <p className={body}>On Photography, Susan Sontag</p>
            </div>
            <img src="/media/info/now-reading.png" alt="" draggable={false} className="size-8 shrink-0 rotate-[-5deg] rounded-[4px] object-cover" />
          </div>

          <div className={divider}>
            <img src="/meme.png" alt="" className="aspect-[335/330] w-full rounded-xl object-cover" />
          </div>

          <div className={`flex flex-col gap-1 ${divider}`}>
            <p className={label}>Hamza Tariq (b. 1999)</p>
            <p className={body}>Working Globally</p>
          </div>

          <div className="flex items-start gap-4">
            <Clock timeZone="Asia/Karachi" marker="(A)" region="Asia" ariaLabel="Current time in Pakistan" />
            <Clock timeZone="Europe/London" marker="(B)" region="Europe" ariaLabel="Current time in the UK" />
          </div>

          <div aria-hidden className="h-16 shrink-0" />
        </div>

        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-16">
          <div className="absolute inset-0" style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', maskImage: 'linear-gradient(transparent 0%, black 100%)', WebkitMaskImage: 'linear-gradient(transparent 0%, black 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(transparent 0%, transparent 100%)' }} />
        </div>
      </div>
    </div>
  );
}
