import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ALL_TILES } from '../data/tiles'; 
import { usePopup } from './PopupContext';   
import { detectSize } from '../utils/media'; 
import { distributeToColumns } from '../utils/layout';

const NUM_COLS = 7;
const TRANSITION_DURATION = 0.6 * 0.8;

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
  const [error, setError] = useState(null);
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
    const totalTiles = ALL_TILES ? ALL_TILES.length : 0;

    // PROTEKSI 1: Jika ALL_TILES belum ada isinya, langsung selesaikan loading screen secara aman
    if (totalTiles === 0) {
      setProgress(1);
      setReady(true);
      return;
    }

    const loadAllTiles = async () => {
      const promises = ALL_TILES.map(async (tile) => {
        let size = { width: 0, height: 0 };
        try {
          size = await detectSize(tile.media);
        } catch (err) {
          console.error(`[TileContext] Gagal memuat media: ${tile.media}`, err);
        } finally {
          // PROTEKSI 2: Progress counter tetap berjalan maju meski ada media yang error/404
          if (!cancelled) {
            loaded++;
            setProgress(loaded / totalTiles);
          }
        }
        return { ...tile, size };
      });

      try {
        const result = await Promise.all(promises);
        if (!cancelled) {
          setTiles(shuffled(result));
          setReady(true);
        }
      } catch (globalError) {
        console.error("[TileContext] Kritis pada Promise.all:", globalError);
        if (!cancelled) setError('Failed to process tiles');
      }
    };

    loadAllTiles();
    return () => { cancelled = true; };
  }, []);

  const triggerTransition = useCallback(() => {
    if (inTransition.current) return;
    inTransition.current = true;
    setTransitioning(true);
    setTimeout(() => {
      setActiveCategory(categoryRef.current);
      setNonce((n) => n + 1);
      setTransitioning(false);
      inTransition.current = false;
    }, TRANSITION_DURATION * 1000);
  }, []);

  useEffect(() => {
    if (category !== activeCategory) triggerTransition();
  }, [category, activeCategory, triggerTransition]);

  const revealChrome = useCallback(() => setChromeRevealed(true), []);

  const filteredTiles = useMemo(
    () => (activeCategory === 'everything' ? tiles : tiles.filter((t) => t.category === activeCategory)),
    [tiles, activeCategory]
  );

  const columns = useMemo(() => distributeToColumns(filteredTiles, NUM_COLS), [filteredTiles]);

  return (
    <TileContext.Provider value={{ columns, nonce, transitioning, error, progress, ready, chromeRevealed, revealChrome }}>
      {children}
    </TileContext.Provider>
  );
}

export function useTiles() {
  const ctx = useContext(TileContext);
  if (!ctx) throw new Error('useTiles must be used within TileProvider');
  return ctx;
}
