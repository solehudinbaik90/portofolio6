import CategoryPicker from './CategoryPicker';
import FocusBar from './FocusBar';

/**
 * ChromeOverlay bundles the bottom chrome:
 * - CategoryPicker (shown when not focused)
 * - FocusBar (shown when a tile is focused)
 *
 * Both handle their own visibility via internal animation logic.
 */
export default function ChromeOverlay() {
  return (
    <>
      <CategoryPicker />
      <FocusBar />
    </>
  );
}
