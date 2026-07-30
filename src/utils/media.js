const _imgCache = [];

{Promise<{width: number, height: number} | null>}

function detectImageDims(src) {
  const img = new Image();
  img.decoding = 'sync';
  img.src = src;
  return img
    .decode()
    .then(() => {
      _imgCache.push(img);
      return { width: img.naturalWidth, height: img.naturalHeight };
    })
    .catch(() => null);
}

{Promise<{width: number, height: number} | null>}

function detectVideoDims(media) {
  if (media.posterSrc) return detectImageDims(media.posterSrc);
  return new Promise((resolve) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.muted = true;
    v.onloadedmetadata = () => resolve({ width: v.videoWidth, height: v.videoHeight });
    v.onerror = () => resolve(null);
    v.src = media.src;
  });
}

const SIZE_MAP = [
  [0.656, 'ws'],
  [0.875, 'ls'],
  [1.125, 'sq'],
  [1.292, 'lg'],
];

export function dimsToSize(width, height) {
  if (!width || !height) return 'sq';
  const ratio = height / width;
  for (const [threshold, size] of SIZE_MAP) {
    if (ratio < threshold) return size;
  }
  return 'md';
}

{Promise<string>}

export async function detectSize(media) {
  const dims =
    media.kind === 'video'
      ? await detectVideoDims(media)
      : await detectImageDims(media.src);
  return dims ? dimsToSize(dims.width, dims.height) : 'sq';
}

export function primeVideo(el) {
  if (el.dataset.primed) return;
  el.dataset.primed = '1';
  const load = () => {
    try { el.currentTime = 0.001; } catch {}
  };
  if (el.readyState >= 1) {
    load();
  } else {
    el.addEventListener('loadedmetadata', load, { once: true });
    el.preload = 'metadata';
    el.load();
  }
}


export function playTileVideo(tileEl) {
  const v = tileEl?.querySelector('video');
  if (v && v.paused) v.play().catch(() => {});
}


export function pauseTileVideo(tileEl) {
  const v = tileEl?.querySelector('video');
  if (v && !v.paused) {
    v.pause();
    v.currentTime = 0;
  }
}
