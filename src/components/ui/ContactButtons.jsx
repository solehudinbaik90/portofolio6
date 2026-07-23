import { useState, useRef, useEffect, useCallback } from 'react';

const CONTACTS = [
  { label: 'email', copyText: 'hello@hamzatariq.info', copiedLabel: 'copied', bg: '#3399FF', iconSrc: '/media/icons/MAIL.svg' },
  {
    label: 'instagram', href: 'https://instagram.com/msoleh321', bg: '#e1306c',
    Icon: ({ className }) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
        <path d="M17.256 5.668C16.589 5.668 16.089 6.168 16.089 6.835C16.089 7.502 16.589 8.003 17.256 8.003C17.923 8.003 18.423 7.502 18.423 6.835C18.423 6.168 17.923 5.668 17.256 5.668Z" fill="currentColor" />
        <path d="M12.004 7.169C9.253 7.169 7.085 9.42 7.085 12.088C7.085 14.755 9.336 17.006 12.004 17.006C14.672 17.006 16.923 14.755 16.923 12.088C16.923 9.42 14.755 7.169 12.004 7.169ZM12.004 15.256C10.253 15.256 8.836 13.838 8.836 12.088C8.836 10.337 10.253 8.92 12.004 8.92C13.755 8.92 15.172 10.337 15.172 12.088C15.172 13.838 13.755 15.256 12.004 15.256Z" fill="currentColor" />
        <path d="M16.006 2H8.086C4.668 2 2 4.668 2 8.003V15.922C2 19.257 4.668 21.925 8.003 21.925H15.922C19.257 21.925 21.925 19.257 21.925 15.922V8.003C22.008 4.668 19.341 2 16.006 2ZM20.091 16.006C20.091 18.257 18.257 20.174 15.922 20.174H8.003C5.752 20.174 3.834 18.34 3.834 16.006V8.086C3.834 5.835 5.668 3.917 8.003 3.917H15.922C18.173 3.917 20.091 5.752 20.091 8.086V16.006Z" fill="currentColor" />
      </svg>
    ),
  },
];

const BTN_CLASS = 'btn-interactive relative flex h-40 flex-1 items-end overflow-hidden rounded-lg p-3 text-white';
const COPIED_TIMEOUT = 2000;

export default function ContactButtons() {
  const [copied, setCopied] = useState(null);
  const timer = useRef(0);

  useEffect(() => () => clearTimeout(timer.current), []);

  const handleCopy = useCallback((text, label) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(label);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), COPIED_TIMEOUT);
  }, []);

  return (
    <div className="flex gap-4">
      {CONTACTS.map(({ label, bg, Icon, iconSrc, href, copyText, copiedLabel }) => {
        const content = (
          <>
            {Icon ? (
              <Icon className="absolute left-3 top-3" />
            ) : (
              <img src={iconSrc} alt="" draggable={false} className="absolute left-3 top-3 size-6" />
            )}
            <div className="flex flex-col" aria-live="polite">
              {copied === label && copiedLabel ? (
                <>
                  <span className="text-[24px] leading-none tracking-[-0.01em] text-white/35">{label}</span>
                  <span className="text-[24px] leading-none tracking-[-0.01em] text-white">{copiedLabel}</span>
                </>
              ) : (
                <>
                  <span className="text-[24px] leading-none tracking-[-0.01em] text-white/35">reach via</span>
                  <span className="text-[24px] leading-none tracking-[-0.01em] text-white">{label}</span>
                </>
              )}
            </div>
          </>
        );

        return copyText ? (
          <button key={label} type="button" onClick={() => handleCopy(copyText, label)}
            style={{ backgroundColor: bg }} className={`${BTN_CLASS} text-left`}>
            {content}
          </button>
        ) : (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer"
            style={{ backgroundColor: bg }} className={BTN_CLASS}>
            {content}
          </a>
        );
      })}
    </div>
  );
}
