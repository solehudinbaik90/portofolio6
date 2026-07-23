const ASPECT_RATIOS = { ws: 9/16, ls: 3/4, sq: 1, md: 4/3, lg: 5/4 };
const GAP = 16;

export function tileColumnHeight(tiles, colWidth) {
  return tiles.reduce((sum, t) => sum + ASPECT_RATIOS[t.size] * colWidth, 0) + GAP * tiles.length;
}

export function distributeToColumns(tiles, numCols) {
  const cols = Array.from({ length: numCols }, () => []);
  if (tiles.length === 0) return cols;
  const heights = Array(numCols).fill(0);
  for (const tile of tiles) {
    let col = 0;
    for (let i = 1; i < numCols; i++) if (heights[i] < heights[col]) col = i;
    cols[col].push(tile);
    heights[col] += ASPECT_RATIOS[tile.size];
  }

  for (let i = 0; i < numCols; i++) {
    if (cols[i].length > 0) continue;
    let src = 0;
    for (let j = 1; j < numCols; j++) if (cols[j].length > cols[src].length) src = j;
    const moved = cols[src].pop();
    if (moved) cols[i].push(moved);
  }
  return cols;
}

export const TILE_ASPECT_CLASSES = {
  ws: 'aspect-[16/9]', ls: 'aspect-[4/3]', sq: 'aspect-square',
  md: 'aspect-[3/4]', lg: 'aspect-[4/5]',
};

export const TILE_ASPECT_RATIOS_HW = {
  ws: 9/16, ls: 3/4, sq: 1, md: 4/3, lg: 5/4,
};
