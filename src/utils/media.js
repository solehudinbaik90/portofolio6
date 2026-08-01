const _imgCache = new Map();

/** 
 * @param {string} src
 * @returns {Promise<{width: number, height: number} | null>} 
 */
function detectImageDims(src) {
  if (_imgCache.has(src)) return Promise.resolve(_imgCache.get(src));

  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'sync';
    
    img.onload = () => {
      const dims = { width: img.naturalWidth, height: img.naturalHeight };
      _imgCache.set(src, dims);
      resolve(dims);
    };

    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** 
 * @param {Object} media
 * @returns {Promise<{width: number, height: number} | null>} 
 */
function detectVideoDims(media) {
  if (media.posterSrc) return detectImageDims(media.posterSrc);
  
  return new Promise((resolve) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.muted = true;
    
    const cleanUp = () => {
      v.onloadedmetadata = null;
      v.onerror = null;
      v.src = '';
      v.load();
    };

    v.onloadedmetadata = () => {
      resolve({ width: v.videoWidth, height: v.videoHeight });
      cleanUp();
    };

    v.onerror = () => {
      resolve(null);
      cleanUp();
    };

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

/**
 * @typedef {Object} MediaSizeResult
 * @property {string} size
 * @property {number} ratio
 * @property {number} naturalWidth
 * @property {number} naturalHeight
 */

/** 
 * @param {Object} media
 * @returns {Promise<MediaSizeResult>} 
 */
export async function detectSize(media) {
  const dims =
    media.kind === 'video'
      ? await detectVideoDims(media)
      : await detectImageDims(media.src);
      
  if (!dims || !dims.width || !dims.height) {
    return { size: 'sq', ratio: 1, naturalWidth: 0, naturalHeight: 0 };
  }

  return {
    size: dimsToSize(dims.width, dims.height),
    ratio: dims.width / dims.height,
    naturalWidth: dims.width,
    naturalHeight: dims.height,
  };
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

export function clearImageCache() {
  _imgCache.clear();
}
