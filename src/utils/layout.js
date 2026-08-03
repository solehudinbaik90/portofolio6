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

export function tileColumnHeight(tiles, colWidth) {
  if (!tiles || tiles.length === 0) return 0;
  return (
    tiles.reduce((sum, t) => sum + TILE_ASPECT_RATIOS_HW[t.size ?? 'sq'] * colWidth, 0) +
    TILE_GAP * tiles.length
  );
}

export function distributeToColumns(tiles, numCols) {
  const cols = Array.from({ length: numCols }, () => []);
  if (!tiles || tiles.length === 0) return cols;

  const currentCw = getColWidth();
  const heights = Array(numCols).fill(0);

  for (const tile of tiles) {
    let shortest = 0;
    for (let i = 1; i < numCols; i++) {
      if (heights[i] < heights[shortest]) shortest = i;
    }
    cols[shortest].push(tile);
    heights[shortest] += (TILE_ASPECT_RATIOS_HW[tile.size ?? 'sq'] * currentCw) + TILE_GAP;
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
  if (typeof window === 'undefined') return 216;
  if (window.innerWidth >= 1920) return 480;
  if (window.innerWidth >= 768) return 360;
  return 216;
}


export function calcRepeatX(viewW, numCols, colWidth) {
  const totalW = numCols * (colWidth + TILE_GAP);
  return Math.max(2, Math.ceil(viewW / totalW) + 1);
}

export function calcRepeatY(viewH, colHeight) {
  if (colHeight <= 0) return 2;
  return Math.max(2, Math.ceil(viewH / colHeight) + 1);
}

export function wrapMod(n, total) {
  return ((n % total) + total) % total;
}
