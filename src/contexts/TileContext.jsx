import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ALL_TILES } from '../data/tiles';
import { usePopup } from './PopupContext';
import { detectSize } from '../utils/media';
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

    Promise.all(
      ALL_TILES.map(async (tile) => {
        const size = await detectSize(tile.media);
        if (!cancelled) {
          loaded++;
          setProgress(loaded / total);
        }
        return { ...tile, size };
      })
    ).then((result) => {
      if (!cancelled) {
        setTiles(shuffled(result));
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
