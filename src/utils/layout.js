export const TILE_ASPECT_RATIOS_HW = {
  ws: 9 / 16,
  ls: 3 / 4,
  sq: 1,
  md: 4 / 3,
  lg: 5 / 4,
};

export const TILE_ASPECT_RATIOS_WH = {
  ws: 16 / 9,
  ls: 4 / 3,
  sq: 1,
  md: 3 / 4,
  lg: 4 / 5,
};

export const TILE_ASPECT_CLASSES = {
  ws: 'aspect-[16/9]',
  ls: 'aspect-[4/3]',
  sq: 'aspect-square',
  md: 'aspect-[3/4]',
  lg: 'aspect-[4/5]',
};

export const TILE_GAP = 16;
export const NUM_COLS = 7;

const MIN_REPEAT = 2;
const COL_WIDTH_BASE = 216;
const COL_WIDTH_MD = 360;
const COL_WIDTH_XL = 480;
const BREAKPOINT_MD = 768;
const BREAKPOINT_XL = 1920;

export function tileColumnHeight(tiles, colWidth) {
  if (!tiles || tiles.length === 0) return 0;
  return (
    tiles.reduce((sum, t) => sum + TILE_ASPECT_RATIOS_HW[t.size ?? 'sq'] * colWidth, 0) +
    TILE_GAP * tiles.length
  );
}


export function distributeToColumns(tiles, numCols = NUM_COLS) {
  const cols = Array.from({ length: numCols }, () => []);
  if (!tiles || tiles.length === 0) return cols;

  const weights = Array(numCols).fill(0);

  for (const tile of tiles) {
    let shortest = 0;
    for (let i = 1; i < numCols; i++) {
      if (weights[i] < weights[shortest]) shortest = i;
    }
    cols[shortest].push(tile);
    weights[shortest] += TILE_ASPECT_RATIOS_HW[tile.size ?? 'sq'] || 1;
  }


  for (let i = 0; i < numCols; i++) {
    if (cols[i].length > 0) continue;
    let longest = 0;
    for (let j = 1; j < numCols; j++) {
      if (cols[j].length > cols[longest].length) longest = j;
    }
    const moved = cols[longest].pop();
    if (moved) cols[i].push(moved);
  }

  return cols;
}

export function getColWidth() {
  if (typeof window === 'undefined') return COL_WIDTH_BASE;
  if (window.innerWidth >= BREAKPOINT_XL) return COL_WIDTH_XL;
  if (window.innerWidth >= BREAKPOINT_MD) return COL_WIDTH_MD;
  return COL_WIDTH_BASE;
}

function repeatCount(viewportSize, unitSize) {
  if (unitSize <= 0) return MIN_REPEAT;
  return Math.max(MIN_REPEAT, Math.ceil(viewportSize / unitSize) + 1);
}

export function calcRepeatX(viewW, numCols, colWidth) {
  const totalW = numCols * (colWidth + TILE_GAP);
  return repeatCount(viewW, totalW);
}

export function calcRepeatY(viewH, colHeight) {
  return repeatCount(viewH, colHeight);
}

export function wrapMod(n, total) {
  return ((n % total) + total) % total;
}
