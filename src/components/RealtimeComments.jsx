import React, { useState, useEffect } from 'react';
import { socket } from '../services/socket';
import { Send } from 'lucide-react';

export const RealtimeComments = ({ videoId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    // Escutar por novos comentários vindos do servidor via WebSocket
    socket.on('broadcast_comment', (commentData) => {
      if (commentData.videoId === videoId) {
        setComments((prev) => [...prev, commentData]);
      }
    });

    // Limpar o listener ao desmontar o componente
    return () => {
      socket.off('broadcast_comment');
    };
  }, [videoId]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const commentData = {
      videoId,
      text: newComment,
      user: 'Utilizador Anónimo',
      timestamp: new Date().toLocaleTimeString(),
    };

    // Enviar o comentário para o servidor via WebSocket
    socket.emit('new_comment', commentData);
    setNewComment('');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'Arial' }}>
      <h3>Comentários em Tempo Real</h3>
      
      {/* Lista de Comentários */}
      <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
        {comments.length === 0 ? (
          <p style={{ color: '#888', fontStyle: 'italic' }}>Ainda sem comentários. Seja o primeiro a comentar!</p>
        ) : (
          comments.map((c, index) => (
            <div key={index} style={{ marginBottom: '10px', padding: '8px', background: '#f9f9f9', borderRadius: '4px' }}>
              <strong>{c.user}</strong> <span style={{ fontSize: '11px', color: '#999' }}>{c.timestamp}</span>
              <p style={{ margin: '4px 0 0 0' }}>{c.text}</p>
            </div>
          ))
        )}
      </div>

      {/* Formulário de Envio */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          value={newComment} 
          onChange={(e) => setNewComment(e.target.value)} 
          placeholder="Escreva um comentário..."
          style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <button type="submit" style={{ background: '#ff0000', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Send size={16} /> Enviar
        </button>
      </form>
    </div>
  );
};