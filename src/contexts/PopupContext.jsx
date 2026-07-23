import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const CATEGORY_PATHS = { everything: '/', brand: '/brand', product: '/product', web: '/web' };
const CATEGORY_TITLES = {
  everything: 'Hamza T. — Design etc.',
  brand: 'Hamza T. — Design for Brand',
  product: 'Hamza T. — Design for Product',
  web: 'Hamza T. — Design for Web',
};

function pathToCategory(pathname) {
  const seg = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  return ['brand', 'product', 'web'].includes(seg) ? seg : 'everything';
}

const PopupContext = createContext(null);

export function PopupProvider({ children }) {
  const [popup, setPopup] = useState(null);
  const [category, setCategory] = useState(() =>
    typeof window !== 'undefined' ? pathToCategory(window.location.pathname) : 'everything'
  );

  const changeCategory = useCallback((cat) => {
    setCategory(cat);
    const path = CATEGORY_PATHS[cat];
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history.pushState({ category: cat }, '', path);
    }
  }, []);

  useEffect(() => {
    const handler = () => setCategory(pathToCategory(window.location.pathname));
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  useEffect(() => {
    document.title = CATEGORY_TITLES[category];
  }, [category]);

  return (
    <PopupContext.Provider value={{ popup, setPopup, category, setCategory: changeCategory }}>
      {children}
    </PopupContext.Provider>
  );
}

export function usePopup() {
  const ctx = useContext(PopupContext);
  if (!ctx) throw new Error('usePopup must be used within PopupProvider');
  return ctx;
}
