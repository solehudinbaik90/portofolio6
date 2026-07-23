export default function VideoBadge() {
  return (
    <div
      aria-hidden
      className="video-badge pointer-events-none absolute left-2 top-2 z-10 flex items-center gap-[1px] rounded-[4px] bg-white px-[4px] border [border-color:rgba(0,0,0,0.1)] py-[2px] group-hover:opacity-0"
      style={{ WebkitFontSmoothing: 'antialiased' }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
        <path d="M2.5 2.495C2.5 2.009 2.5 1.766 2.601 1.633C2.689 1.516 2.824 1.444 2.97 1.435C3.138 1.425 3.34 1.56 3.744 1.829L9.002 5.334C9.335 5.557 9.502 5.668 9.56 5.808C9.611 5.931 9.611 6.069 9.56 6.191C9.502 6.332 9.335 6.443 9.002 6.666L3.744 10.171C3.34 10.44 3.138 10.575 2.97 10.565C2.824 10.556 2.689 10.484 2.601 10.367C2.5 10.233 2.5 9.991 2.5 9.505V2.495Z" fill="#00000054" />
        <path d="M2.955 1.186C3.111 1.176 3.256 1.236 3.388 1.308C3.522 1.38 3.685 1.489 3.883 1.621L9.141 5.126C9.303 5.234 9.439 5.325 9.541 5.407C9.643 5.49 9.738 5.585 9.791 5.713C9.867 5.897 9.867 6.103 9.791 6.287C9.738 6.415 9.643 6.509 9.541 6.592C9.439 6.674 9.304 6.765 9.141 6.874L3.883 10.379C3.685 10.511 3.522 10.62 3.388 10.692C3.256 10.764 3.111 10.824 2.955 10.815C2.736 10.801 2.535 10.693 2.402 10.519C2.308 10.394 2.277 10.241 2.264 10.091C2.25 9.939 2.25 9.743 2.25 9.505V2.495C2.25 2.257 2.25 2.061 2.264 1.909C2.277 1.759 2.308 1.606 2.402 1.481C2.535 1.307 2.736 1.199 2.955 1.186Z" fill="none" stroke="#00000054" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{ color: 'rgba(0,0,0,0.66)', fontSize: 12, letterSpacing: '-0.02em', lineHeight: '120%' }}>
        video
      </span>
    </div>
  );
}
