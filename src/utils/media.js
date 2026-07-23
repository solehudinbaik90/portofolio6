function detectImageSize(src) {
  const img = new Image();
  img.decoding = 'sync';
  img.src = src;
  return img.decode().then(() => ({ width: img.naturalWidth, height: img.naturalHeight })).catch(() => null);
}

function detectVideoSize(media) {
  if (media.posterSrc) return detectImageSize(media.posterSrc);
  return new Promise((resolve) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.muted = true;
    v.onloadedmetadata = () => resolve({ width: v.videoWidth, height: v.videoHeight });
    v.onerror = () => resolve(null);
    v.src = media.src;
  });
}

const SIZE_THRESHOLDS = [
  [0.656, 'ws'], [0.875, 'ls'], [1.125, 'sq'], [1.292, 'lg'],
];

function aspectToSize(width, height) {
  const ratio = height / width;
  for (const [threshold, size] of SIZE_THRESHOLDS) {
    if (ratio < threshold) return size;
  }
  return 'md';
}

export async function detectSize(media) {
  const dims = media.kind === 'video' ? await detectVideoSize(media) : await detectImageSize(media.src);
  return dims ? aspectToSize(dims.width, dims.height) : 'sq';
}

export function primeVideo(el) {
  if (el.dataset.primed) return;
  el.dataset.primed = '1';
  const load = () => { try { el.currentTime = 0.001; } catch {} };
  if (el.readyState >= 1) load();
  else {
    el.addEventListener('loadedmetadata', load, { once: true });
    el.preload = 'metadata';
    el.load();
  }
}
