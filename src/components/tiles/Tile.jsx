import { useRef } from 'react';
import TileMedia from './TileMedia';
import { TILE_ASPECT_CLASSES } from '../../utils/layout';

export default function Tile({ tile, isFocused, isDiscovered }) {
  const mediaRef = useRef(null);
  const aspectClass = TILE_ASPECT_CLASSES[tile.size] ?? 'aspect-square';

  return (
    <div className={`${aspectClass} relative shrink-0${isFocused ? '' : ' [content-visibility:auto]'}`}>
      <div
        data-tile-id={tile.id}
        className={`group absolute inset-0 overflow-hidden rounded-lg${isDiscovered ? ' discovered' : ''}`}
        style={{ backgroundColor: '#f1f1f1' }}
      >
        <TileMedia ref={mediaRef} tile={tile} isFocused={isFocused} />
      </div>
    </div>
  );
}
