import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export const VideoPlayer = ({ src, poster }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hls;

    if (Hls.isSupported() && src.endsWith('.m3u8')) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        manifestLoadingMaxRetry: 10,
        manifestLoadingRetryDelay: 2000,
      });

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Tenta novamente carregar o manifesto se o FFmpeg ainda o estiver a criar
              setTimeout(() => hls.startLoad(), 2000);
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    } else {
      video.src = src;
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [src]);

  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', background: '#000', borderRadius: '8px', overflow: 'hidden' }}>
      <video
        ref={videoRef}
        controls
        poster={poster}
        style={{ width: '100%', display: 'block' }}
      />
    </div>
  );
};