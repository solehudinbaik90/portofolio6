
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

const GAP = 16;


export function tileColumnHeight(tiles, colWidth) {
  if (!tiles || tiles.length === 0) return 0;
  return (
    tiles.reduce((sum, t) => sum + TILE_ASPECT_RATIOS_HW[t.size] * colWidth, 0) +
    GAP * tiles.length
  );
}


export function distributeToColumns(tiles, numCols) {
  const cols = Array.from({ length: numCols }, () => []);
  if (!tiles || tiles.length === 0) return cols;

  const heights = Array(numCols).fill(0);

  for (const tile of tiles) {
    let shortest = 0;
    for (let i = 1; i < numCols; i++) {
      if (heights[i] < heights[shortest]) shortest = i;
    }
    cols[shortest].push(tile);
    heights[shortest] += TILE_ASPECT_RATIOS_HW[tile.size];
  }

  for (let i = 0; i < numCols; i++) {
    if (cols[i].length > 0) continue;
    let longest = 0;
    for (let j = 1; j < numCols; j++) {
      if (heights[j] > heights[longest]) longest = j;
    }
    const moved = cols[longest].pop();
    if (moved) {
      cols[i].push(moved);
      heights[longest] -= TILE_ASPECT_RATIOS_HW[moved.size];
      heights[i] += TILE_ASPECT_RATIOS_HW[moved.size];
    }
  }

  return cols;
}
