import React, { useState } from 'react';
import { BarChart2, Heart } from 'lucide-react';

export const CommunityTab = () => {
  const [posts, setPosts] = useState([
    {
      id: 1,
      author: 'Criador Exemplo',
      content: 'Qual deve ser o tema do próximo vídeo do VideoTube?',
      poll: [
        { option: 'Node.js Avançado', votes: 12 },
        { option: 'React com Tailwind', votes: 25 }
      ],
      likes: 45
    }
  ]);

  const handleVote = (postId, optionIndex) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const newPoll = [...p.poll];
        newPoll[optionIndex].votes += 1;
        return { ...p, poll: newPoll };
      }
      return p;
    }));
  };

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', fontFamily: 'Arial' }}>
      <h2>Comunidade do Canal</h2>
      {posts.map(post => (
        <div key={post.id} style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '15px', marginBottom: '15px' }}>
          <h4>{post.author}</h4>
          <p>{post.content}</p>

          {/* Renderizar Sondagem se existir */}
          {post.poll && (
            <div style={{ margin: '15px 0' }}>
              {post.poll.map((item, idx) => (
                <button 
                  key={idx} 
                  onClick={() => handleVote(post.id, idx)}
                  style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '8px', background: '#f1f1f1', border: '1px solid #ccc', borderRadius: '4px', textAlign: 'left', cursor: 'pointer' }}
                >
                  {item.option} <strong>({item.votes} votos)</strong>
                </button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '15px', color: '#666', fontSize: '14px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
              <Heart size={18} /> {post.likes} gostos
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};