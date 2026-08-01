import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ALL_TILES } from '../data/tiles';
import { usePopup } from './PopupContext';
import { detectSize, detectImageDims, detectVideoDims } from '../utils/media';
import { distributeToColumns, NUM_COLS } from '../utils/layout';

const TRANSITION_DURATION_MS = 480;

const TileContext = createContext(null);

function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function TileProvider({ children }) {
  const { category } = usePopup();

  const [tiles, setTiles] = useState([]);
  const [tilesById, setTilesById] = useState(new Map());
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [nonce, setNonce] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [activeCategory, setActiveCategory] = useState(category);
  const [chromeRevealed, setChromeRevealed] = useState(false);

  const categoryRef = useRef(category);
  categoryRef.current = category;
  const inTransition = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let loaded = 0;
    const total = ALL_TILES.length;

    if (total === 0) {
      setProgress(1);
      setReady(true);
      return;
    }

    ALL_TILES.map(async (tile) => {
  let dims = null;
  if (tile.media.kind === 'video') {
    dims = await detectVideoDims(tile.media);
  } else {
    dims = await detectImageDims(tile.media.src);
  }
  const ratio = dims ? (dims.width / dims.height) : (TILE_ASPECT_RATIOS_WH[tile.size] ?? 1);
  return { ...tile, size, naturalWidth: dims?.width, naturalHeight: dims?.height, ratio };
    })
    ).then((result) => {
      if (!cancelled) {
        setTiles(shuffled(result));
        setTilesById(new Map(result.map((t) => [t.id, t])));
        setReady(true);
      }
    });

    return () => { cancelled = true; };
  }, []);

  const triggerTransition = useCallback(() => {
    if (inTransition.current) return;
    inTransition.current = true;
    setTransitioning(true);
    window.setTimeout(() => {
      setActiveCategory(categoryRef.current);
      setNonce((n) => n + 1);
      setTransitioning(false);
      inTransition.current = false;
    }, TRANSITION_DURATION_MS);
  }, []);

  useEffect(() => {
    if (category !== activeCategory) triggerTransition();
  }, [category, activeCategory, triggerTransition]);

  const revealChrome = useCallback(() => setChromeRevealed(true), []);

  const filteredTiles = useMemo(
    () =>
      activeCategory === 'everything'
        ? tiles
        : tiles.filter((t) => t.category === activeCategory),
    [tiles, activeCategory]
  );

  const columns = useMemo(
    () => distributeToColumns(filteredTiles, NUM_COLS),
    [filteredTiles]
  );

  return (
    <TileContext.Provider
      value={{
        columns,
        tilesById,
        nonce,
        transitioning,
        progress,
        ready,
        chromeRevealed,
        revealChrome,
      }}
    >
      {children}
    </TileContext.Provider>
  );
}

export function useTiles() {
  const ctx = useContext(TileContext);
  if (!ctx) throw new Error('useTiles must be used within TileProvider');
  return ctx;
}
