import { createContext, useContext, useState, useCallback } from 'react';

const FocusContext = createContext(null);

export function FocusProvider({ children }) {
  const [focusedId, setFocusedIdRaw] = useState(null);
  const [source, setSource] = useState(null);
  const [isClosing, setIsClosing] = useState(false);

  const setFocusedId = useCallback((id) => {
    if (id === null) {
      setFocusedIdRaw((prev) => { if (prev !== null) setIsClosing(true); return prev; });
    } else {
      setSource(null);
      setIsClosing(false);
      setFocusedIdRaw(id);
    }
  }, []);

  const openFocus = useCallback((id, el) => {
    setSource(el);
    setIsClosing(false);
    setFocusedIdRaw(id);
  }, []);

  const finishClose = useCallback(() => {
    setFocusedIdRaw(null);
    setSource(null);
    setIsClosing(false);
  }, []);

  return (
    <FocusContext.Provider value={{ focusedId, source, isClosing, setFocusedId, openFocus, finishClose }}>
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error('useFocus must be used within FocusProvider');
  return ctx;
}
