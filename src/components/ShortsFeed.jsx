import React, { useState, useRef } from 'react';
import { ThumbsUp, MessageSquare, Share2 } from 'lucide-react';

export const ShortsFeed = ({ shortsList = [] }) => {
  const [likes, setLikes] = useState({});

  const handleLike = (id) => {
    setLikes(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  return (
    <div style={{ height: '100vh', overflowY: 'scroll', scrollSnapType: 'y mandatory', background: '#000', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {shortsList.map((short) => (
        <div key={short.id} style={{ height: '100vh', width: '100%', maxWidth: '400px', scrollSnapAlign: 'start', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {/* Player de Vídeo Vertical */}
          <video 
            src={short.videoUrl} 
            loop 
            controls 
            style={{ height: '100%', width: '100%', objectFit: 'cover' }}
          />
          
          {/* Botões de Ação Flutuantes */}
          <div style={{ position: 'absolute', right: '15px', bottom: '80px', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
            <button onClick={() => handleLike(short.id)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', textAlign: 'center' }}>
              <ThumbsUp size={28} />
              <span style={{ display: 'block', fontSize: '12px' }}>{10 + (likes[short.id] || 0)}</span>
            </button>
            <button style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', textAlign: 'center' }}>
              <MessageSquare size={28} />
              <span style={{ display: 'block', fontSize: '12px' }}>{short.commentsCount || 0}</span>
            </button>
            <button style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
              <Share2 size={28} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};