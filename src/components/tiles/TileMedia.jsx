import { forwardRef } from 'react';
import { useHoverDevice } from '../../hooks/useHoverDevice';
import VideoBadge from './VideoBadge';

const BLUR_CLASSES = 'pointer-events-none size-full rounded-[inherit] object-cover blur-[32px] scale-125 group-hover:blur-[0px] group-hover:scale-100 group-[.discovered]:blur-[0px] group-[.discovered]:scale-100';

const TileMedia = forwardRef(function TileMedia({ tile, isFocused }, ref) {
  const isHover = useHoverDevice();
  const { media } = tile;

  if (media.kind === 'video') {
    const useVideo = isHover || !media.posterSrc;
    return (
      <>
        <VideoBadge />
        {useVideo ? (
          <video
            ref={ref}
            src={media.src}
            poster={media.posterSrc}
            loop
            muted
            playsInline
            preload="none"
            className={BLUR_CLASSES}
          />
        ) : (
          <img
            src={media.posterSrc ?? media.src}
            alt=""
            draggable={false}
            decoding="async"
            className={BLUR_CLASSES}
          />
        )}
      </>
    );
  }

  return (
    <img
      src={media.src}
      alt=""
      draggable={false}
      decoding="async"
      className={BLUR_CLASSES}
    />
  );
});

export default TileMedia;
