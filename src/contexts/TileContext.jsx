import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ALL_TILES } from '../data/tiles';
import { getProject } from '../data/projects';
import { usePopup } from './PopupContext';
import { detectSize } from '../utils/media';
import { distributeToColumns, NUM_COLS } from '../utils/layout';

const TRANSITION_DURATION_S = 0.6;
const TRANSITION_DELAY_FACTOR = 0.8;
const TRANSITION_DURATION_MS = TRANSITION_DURATION_S * TRANSITION_DELAY_FACTOR * 1000;

const TileContext = createContext(null);

function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}


function validateTiles() {
  for (const tile of ALL_TILES) {
    if (tile.projectSlug && !getProject(tile.projectSlug)) {
      return `Tile "${tile.id}" references missing project "${tile.projectSlug}"`;
    }
  }
  return null;
}


const TILES_ERROR = validateTiles();

export function TileProvider({ children }) {
  const { category } = usePopup();

  const [tiles, setTiles] = useState([]);
  const [tilesById, setTilesById] = useState(new Map());

  const [activeCategory, setActiveCategory] = useState(category);
  const categoryRef = useRef(category);
  categoryRef.current = category;

  const [nonce, setNonce] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const inTransitionRef = useRef(false);

  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [chromeRevealed, setChromeRevealed] = useState(false);

  useEffect(() => {

    if (TILES_ERROR) {
      setReady(true);
      return;
    }
    if (ALL_TILES.length === 0) {
      setProgress(1);
      setReady(true);
      return;
    }

    let cancelled = false;
    let loaded = 0;
    const total = ALL_TILES.length;

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
      if (cancelled) return;
      setTilesById(new Map(result.map((t) => [t.id, t])));
      setTiles(shuffled(result));
      setReady(true);
    });

    return () => { cancelled = true; };
  }, []);

  const triggerTransition = useCallback(() => {
    if (inTransitionRef.current) return;
    inTransitionRef.current = true;
    setTransitioning(true);
    window.setTimeout(() => {
      setActiveCategory(categoryRef.current);
      setNonce((n) => n + 1);
      setTransitioning(false);
      inTransitionRef.current = false;
    }, TRANSITION_DURATION_MS);
  }, []);

  useEffect(() => {
    if (category !== activeCategory && !inTransitionRef.current) triggerTransition();
  }, [category, activeCategory, triggerTransition]);

  const revealChrome = useCallback(() => setChromeRevealed(true), []);

  const filteredTiles = useMemo(
    () => (activeCategory === 'everything' ? tiles : tiles.filter((t) => t.category === activeCategory)),
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
        error: TILES_ERROR,
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
