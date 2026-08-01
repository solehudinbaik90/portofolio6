const _imgCache = [];

/** @returns {Promise<{width: number, height: number} | null>} */
export async function detectImageDims(src) {
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
    await img.decode();
    _imgCache.push(img);
    return { width: img.naturalWidth, height: img.naturalHeight };
  } catch (err) {
    return null;
  }
}

/** @returns {Promise<{width: number, height: number} | null>} */
export function detectVideoDims(media) {
  // gunakan poster bila ada (lebih cepat)
  if (media.posterSrc) return detectImageDims(media.posterSrc);
  return new Promise((resolve) => {
    try {
      const v = document.createElement('video');
      v.preload = 'metadata';
      // pasang handler dulu
      v.addEventListener('loadedmetadata', () => {
        // some browsers might report 0 if CORS blocked; guard it
        const w = v.videoWidth || 0;
        const h = v.videoHeight || 0;
        resolve(w && h ? { width: w, height: h } : null);
      }, { once: true });
      v.addEventListener('error', () => resolve(null), { once: true });
      v.src = media.src;
      v.load();
    } catch (err) {
      resolve(null);
    }
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

/**
 * Detect size and return an object with useful metadata:
 * { size, ratio, naturalWidth, naturalHeight }
 */
export async function detectSize(media) {
  try {
    const dims =
      media.kind === 'video'
        ? await detectVideoDims(media)
        : await detectImageDims(media.src);

    if (!dims || !dims.width || !dims.height) {
      return { size: 'sq', ratio: 1, naturalWidth: null, naturalHeight: null };
    }

    return {
      size: dimsToSize(dims.width, dims.height),
      ratio: dims.width / dims.height,
      naturalWidth: dims.width,
      naturalHeight: dims.height,
    };
  } catch (err) {
    return { size: 'sq', ratio: 1, naturalWidth: null, naturalHeight: null };
  }
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
    try { v.currentTime = 0; } catch {}
  }
}
