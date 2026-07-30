import { createContext, useContext, useState, useCallback, useRef } from 'react';

const FocusContext = createContext(null);

export function FocusProvider({ children }) {
  const [focusedId, setFocusedIdState] = useState(null);
  const [source, setSource] = useState(null);
  const [isClosing, setIsClosing] = useState(false);

  const prevIdRef = useRef(null);

  const setFocusedId = useCallback((id) => {
    if (id === null) {
      setIsClosing(true);
    } else {
      setSource(null);
      setIsClosing(false);
      setFocusedIdState(id);
      prevIdRef.current = id;
    }
  }, []);

  const openFocus = useCallback((id, el) => {
    setSource(el);
    setIsClosing(false);
    setFocusedIdState(id);
    prevIdRef.current = id;
  }, []);

  const finishClose = useCallback(() => {
    setFocusedIdState(null);
    setSource(null);
    setIsClosing(false);
  }, []);

  return (
    <FocusContext.Provider
      value={{ focusedId, source, isClosing, setFocusedId, openFocus, finishClose }}
    >
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error('useFocus must be used within FocusProvider');
  return ctx;
}
