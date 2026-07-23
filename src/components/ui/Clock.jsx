import { useState, useEffect } from 'react';

function getTimeParts(date, tz) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' }).formatToParts(date);
  const get = (type) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { hours: get('hour'), minutes: get('minute'), seconds: get('second') };
}

function getOffsetLabel(date, tz) {
  const tzName = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' }).formatToParts(date).find((p) => p.type === 'timeZoneName')?.value ?? '';
  const match = tzName.match(/GMT([+-]\d{1,2})(?::?(\d{2}))?/);
  if (!match) return 'UTC +0';
  const sign = parseInt(match[1], 10) < 0 ? '-' : '+';
  return `UTC ${sign}${Math.abs(parseInt(match[1], 10))}${match[2] ? `:${match[2]}` : ''}`;
}

export default function Clock({ timeZone, marker, region, ariaLabel }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const { hours, minutes, seconds } = getTimeParts(now, timeZone);
  const secDeg = (seconds / 60) * 360;
  const minDeg = (minutes / 60) * 360;
  const hrDeg = ((hours % 12) + minutes / 60) / 12 * 360;

  return (
    <div className="flex flex-1 items-end gap-2 overflow-hidden rounded-xl bg-[#F1F1F1] p-2">
      <svg width="64" height="64" viewBox="0 0 64 64" className="shrink-0" role="img" aria-label={ariaLabel}>
        <rect x="0.5" y="0.5" width="63" height="63" rx="31.5" fill="none" stroke="#000000" strokeOpacity="0.33" />
        <line x1="32" y1="32" x2="32" y2="0" stroke="#44AA44" transform={`rotate(${secDeg} 32 32)`} />
        <line x1="32" y1="32" x2="32" y2="0" stroke="#000000" strokeOpacity="1" transform={`rotate(${minDeg} 32 32)`} />
        <line x1="32" y1="32" x2="32" y2="16" stroke="#000000" transform={`rotate(${hrDeg} 32 32)`} />
        <circle cx="32" cy="32" r="4" fill="#FD011B" />
      </svg>
      <div className="flex h-16 flex-1 flex-col items-start justify-between gap-2">
        <p className="text-[10px] leading-none tracking-[-0.01em] text-black/35">{marker}</p>
        <div className="flex flex-col">
          <p className="text-[10px] leading-none tracking-[-0.01em] text-black/35">({getOffsetLabel(now, timeZone)})</p>
          <p className="text-[14px] leading-[120%] tracking-[-0.01em] text-black">{region}</p>
        </div>
      </div>
    </div>
  );
}
