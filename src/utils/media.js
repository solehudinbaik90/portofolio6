function withTimeout(promise, ms, fallbackValue) {
  let timer;
  const timeoutPromise = new Promise((resolve) => {
    timer = setTimeout(() => {
      console.warn(`[MediaUtil] Deteksi ukuran timeout setelah ${ms}ms.`);
      resolve(fallbackValue);
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

function detectImageSize(src) {
  // Tambahkan validasi jika src kosong/null
  if (!src) return Promise.resolve(null);
  
  const img = new Image();
  img.decoding = 'sync';
  img.src = src;
  
  const decodePromise = img.decode()
    .then(() => ({ width: img.naturalWidth, height: img.naturalHeight }))
    .catch((err) => {
      console.error(`[MediaUtil] Gagal decode gambar: ${src}`, err);
      return null;
    });

  // Amankan dengan timeout 4 detik jika koneksi lambat/aset rusak
  return withTimeout(decodePromise, 4000, null);
}

function detectVideoSize(media) {
  if (!media || (!media.src && !media.posterSrc)) return Promise.resolve(null);
  if (media.posterSrc) return detectImageSize(media.posterSrc);
  
  const videoPromise = new Promise((resolve) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.muted = true;
    
    v.onloadedmetadata = () => {
      resolve({ width: v.videoWidth, height: v.videoHeight });
      // Bersihkan elemen untuk menghemat memori
      v.onloadedmetadata = null;
      v.onerror = null;
    };
    
    v.onerror = (err) => {
      console.error(`[MediaUtil] Gagal load metadata video: ${media.src}`, err);
      resolve(null);
    };
    
    v.src = media.src;
  });

  // Amankan dengan timeout 5 detik untuk pemuatan metadata video
  return withTimeout(videoPromise, 5000, null);
}

const SIZE_THRESHOLDS = [
  [0.656, 'ws'], [0.875, 'ls'], [1.125, 'sq'], [1.292, 'lg'],
];

function aspectToSize(width, height) {
  if (!width || !height) return 'sq'; // Tambahan proteksi pembagian dengan nol (NaN)
  const ratio = height / width;
  for (const [threshold, size] of SIZE_THRESHOLDS) {
    if (ratio < threshold) return size;
  }
  return 'md';
}

export async function detectSize(media) {
  if (!media) return 'sq';
  const dims = media.kind === 'video' ? await detectVideoSize(media) : await detectImageSize(media.src);
  return dims ? aspectToSize(dims.width, dims.height) : 'sq';
}

export function primeVideo(el) {
  if (!el || el.dataset.primed) return;
  el.dataset.primed = '1';
  const load = () => { try { el.currentTime = 0.001; } catch {} };
  if (el.readyState >= 1) load();
  else {
    el.addEventListener('loadedmetadata', load, { once: true });
    el.preload = 'metadata';
    el.load();
  }
}
