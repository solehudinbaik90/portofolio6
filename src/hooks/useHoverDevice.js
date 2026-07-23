import { useState, useEffect } from 'react';

const MQ = '(hover: hover) and (pointer: fine)';

export function isHoverDevice() {
  return typeof window !== 'undefined' && window.matchMedia(MQ).matches;
}

export function useHoverDevice() {
  const [hover, setHover] = useState(isHoverDevice);
  useEffect(() => {
    const mq = window.matchMedia(MQ);
    const handler = () => setHover(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return hover;
}
