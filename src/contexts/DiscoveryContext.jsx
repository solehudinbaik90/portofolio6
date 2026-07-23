import { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import { ALL_TILES } from '../data/tiles';

const TOTAL = ALL_TILES.length;
const ActionsCtx = createContext(null);
const ProgressCtx = createContext(null);

export function DiscoveryProvider({ children }) {
  const set = useRef(new Set());
  const [count, setCount] = useState(0);

  const markDiscovered = useCallback((id) => {
    if (set.current.has(id)) return;
    set.current.add(id);
    setCount(set.current.size);
  }, []);

  const isDiscovered = useCallback((id) => set.current.has(id), []);

  const actions = useMemo(() => ({ markDiscovered, isDiscovered }), [markDiscovered, isDiscovered]);
  const progress = useMemo(() => ({
    count,
    total: TOTAL,
    progress: TOTAL > 0 ? count / TOTAL : 0,
  }), [count]);

  return (
    <ActionsCtx.Provider value={actions}>
      <ProgressCtx.Provider value={progress}>
        {children}
      </ProgressCtx.Provider>
    </ActionsCtx.Provider>
  );
}

export function useDiscoveryActions() {
  const ctx = useContext(ActionsCtx);
  if (!ctx) throw new Error('useDiscoveryActions must be used within DiscoveryProvider');
  return ctx;
}

export function useDiscoveryProgress() {
  const ctx = useContext(ProgressCtx);
  if (!ctx) throw new Error('useDiscoveryProgress must be used within DiscoveryProvider');
  return ctx;
}
