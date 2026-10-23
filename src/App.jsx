import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';
const SOCKET_URL = import.meta.env.VITE_API_URL ? API_URL.replace('/api', '') : 'http://localhost:10000';

const socket = io(SOCKET_URL);

export default function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userName, setUserName] = useState(localStorage.getItem('userName') || 'Danilo Pereira');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [sortBy, setSortBy] = useState('date');
  const [activeVideo, setActiveVideo] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);

  const [channelData, setChannelData] = useState({
    name: 'Pets & Fofuras',
    description: 'Canal dedicado aos nossos bebés Tobias, Kikinho e Pequenina! Vídeos divertidos e dicas para cuidar dos seus animais.',
    avatar: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop',
    banner: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&auto=format&fit=crop'
  });

  const categories = [
    'Todos', 'Gaming', 'Música', 'Tecnologia', 'Entretenimento', 
    'Desporto', 'Educação', 'Notícias', 'Podcasts', 'Comédia', 
    'Animais & Pets', 'Culinária', 'Viagens', 'Ciência', 'Moda & Beleza', 'Curtas'
  ];

  const initialVideos = [
    { id: '1', title: 'Pets & Fofuras: Tobias e os companheiros a brincar', description: 'Um dia divertido na vida do Tobias.', category: 'Animais & Pets', channel: 'Pets & Fofuras', viewsCount: 18400, likes: 120, dislikes: 2, bgGradient: 'linear-gradient(135deg, #f59e0b, #d97706)', youtubeId: 'PmrJFdurf3s' },
    { id: '2', title: 'Gameplay Épico - Melhores Momentos de Esports', description: 'Jogadas incríveis do torneio.', category: 'Gaming', channel: 'ProGamer Studio', viewsCount: 142000, likes: 850, dislikes: 14, bgGradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', youtubeId: 'WPkNGR5UAdg' },
    { id: '3', title: 'Concerto Acústico ao Vivo - Guitarra & Relaxamento', description: 'Sessão musical acústica.', category: 'Música', channel: 'Som & Sintonia', viewsCount: 53200, likes: 410, dislikes: 5, bgGradient: 'linear-gradient(135deg, #ec4899, #be185d)', youtubeId: 'TZj7lGAAGVw' },
    { id: '4', title: 'Análise de Tecnologia: Inteligência Artificial e Gadgets', description: 'Análise detalhada de hardware.', category: 'Tecnologia', channel: 'Tech Zone PT', viewsCount: 89100, likes: 670, dislikes: 12, bgGradient: 'linear-gradient(135deg, #06b6d4, #0e7490)', youtubeId: 'JDm5TbfDRaM' },
    { id: '5', title: 'Os Bastidores do Cinema e Trailers Imperdíveis', description: 'Produções cinematográficas.', category: 'Entretenimento', channel: 'CineMundo', viewsCount: 32400, likes: 290, dislikes: 3, bgGradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', youtubeId: 'Gt5dAxm_BEE' },
    { id: '6', title: 'Resumo de Futebol e os Melhores Golos da Época', description: 'Análise tática e grandes jogadas.', category: 'Desporto', channel: 'Arena Desportiva', viewsCount: 210000, likes: 1890, dislikes: 45, bgGradient: 'linear-gradient(135deg, #10b981, #047857)', youtubeId: 'y-mnyvIOpVM' },
    { id: '7', title: 'Aprender JavaScript e React para Iniciantes', description: 'Tutorial prático web.', category: 'Educação', channel: 'Academia do Código', viewsCount: 45000, likes: 980, dislikes: 8, bgGradient: 'linear-gradient(135deg, #6366f1, #4338ca)', youtubeId: 'w7ejDZ8SWv8' },
    { id: '8', title: 'Notícias do Dia: Resumo da Atualidade Internacional', description: 'Resumo diário de eventos.', category: 'Notícias', channel: 'InfoGlobal 24', viewsCount: 67800, likes: 340, dislikes: 20, bgGradient: 'linear-gradient(135deg, #64748b, #334155)', youtubeId: 'Wgop5aph9Bw' },
    { id: '9', title: 'Podcast em Estúdio: Conversas sobre o Futuro', description: 'Entrevista com especialistas.', category: 'Podcasts', channel: 'Conversas Abertas', viewsCount: 28900, likes: 510, dislikes: 6, bgGradient: 'linear-gradient(135deg, #14b8a6, #0f766e)', youtubeId: 'uKAePqGq8bM' },
    { id: '10', title: 'Especial Stand-Up Comedy: Risos Garantidos', description: 'Momentos hilariantes.', category: 'Comédia', channel: 'Clube do Riso', viewsCount: 95400, likes: 1420, dislikes: 18, bgGradient: 'linear-gradient(135deg, #f97316, #c2410c)', youtubeId: '4KfLSOMd3zU' },
    { id: '11', title: 'Receitas Rápidas na Air Fryer e Dicas de Cozinha', description: 'Pratos deliciosos e saudáveis.', category: 'Culinária', channel: 'Cozinha Prática', viewsCount: 81200, likes: 1100, dislikes: 12, bgGradient: 'linear-gradient(135deg, #84cc16, #4d7c0f)', youtubeId: 'AlVrpscQmzA' },
    { id: '12', title: 'Guia de Viagens: As Melhores Paisagens de Portugal', description: 'Roteiro pelas serras e rios.', category: 'Viagens', channel: 'Portugal a Pé', viewsCount: 64300, likes: 890, dislikes: 9, bgGradient: 'linear-gradient(135deg, #0ea5e9, #0369a1)', youtubeId: 'KweOzJlYE3s' },
    { id: '13', title: 'Documentário de Ciência: Os Mistérios do Universo', description: 'Descobertas da astrofísica.', category: 'Ciência', channel: 'Ciência Viva', viewsCount: 115000, likes: 1650, dislikes: 15, bgGradient: 'linear-gradient(135deg, #a855f7, #7e22ce)', youtubeId: 'sVzrGpdYBlo' },
    { id: '14', title: 'Dicas de Moda, Vestuário e Cuidados Pessoais', description: 'Estilo e rotinas de skincare.', category: 'Moda & Beleza', channel: 'Estilo & Tendência', viewsCount: 49200, likes: 720, dislikes: 8, bgGradient: 'linear-gradient(135deg, #fb7185, #e11d48)', youtubeId: 'EONayBEGQG4' },
    { id: '15', title: 'Curtas Divertidas e Animações em 60 Segundos', description: 'Micro-histórias rápidas.', category: 'Curtas', channel: 'Mini Stories', viewsCount: 93000, likes: 1300, dislikes: 10, bgGradient: 'linear-gradient(135deg, #fbbf24, #b45309)', youtubeId: 'm0n_UZCUN6E' }
  ];

  const [videos, setVideos] = useState(initialVideos);
  const [shortsList] = useState([
    { id: 's1', title: 'Tobias e Pequenina a brincar na caminha! 🐾', channel: 'Pets & Fofuras', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' },
    { id: 's2', title: 'Truque rápido de código em React ⚡', channel: 'Tech Review PT', url: 'https://www.w3schools.com/html/mov_bbb.mp4' }
  ]);

  const handleLike = async (videoId) => {
    if (!token) {
      alert('Por favor, inicia sessão para dar Like!');
      setCurrentTab('auth');
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/videos/${videoId}/like`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const newLikes = res.data.likes;
      setVideos(videos.map(v => v.id === videoId ? { ...v, likes: newLikes } : v));
      if (activeVideo && activeVideo.id === videoId) {
        setActiveVideo({ ...activeVideo, likes: newLikes });
      }
    } catch {
      const updatedLikes = (activeVideo?.likes || 0) + 1;
      setVideos(videos.map(v => v.id === videoId ? { ...v, likes: updatedLikes } : v));
      if (activeVideo && activeVideo.id === videoId) {
        setActiveVideo({ ...activeVideo, likes: updatedLikes });
      }
    }
  };

  const handleDislike = async (videoId) => {
    if (!token) {
      alert('Por favor, inicia sessão para dar Não Gosto!');
      setCurrentTab('auth');
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/videos/${videoId}/dislike`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const newDislikes = res.data.dislikes;
      setVideos(videos.map(v => v.id === videoId ? { ...v, dislikes: newDislikes } : v));
      if (activeVideo && activeVideo.id === videoId) {
        setActiveVideo({ ...activeVideo, dislikes: newDislikes });
      }
    } catch {
      const updatedDislikes = (activeVideo?.dislikes || 0) + 1;
      setVideos(videos.map(v => v.id === videoId ? { ...v, dislikes: updatedDislikes } : v));
      if (activeVideo && activeVideo.id === videoId) {
        setActiveVideo({ ...activeVideo, dislikes: updatedDislikes });
      }
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm('Tem a certeza que pretende eliminar este vídeo?')) return;
    try {
      await axios.delete(`${API_URL}/videos/${videoId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setVideos(videos.filter(v => v.id !== videoId));
      alert('Vídeo eliminado com sucesso!');
    } catch {
      setVideos(videos.filter(v => v.id !== videoId));
      alert('Vídeo eliminado da lista!');
    }
  };

  const handleSelectVideo = (video) => {
    setActiveVideo(video);
    if (!history.some(v => v.id === video.id)) {
      setHistory([video, ...history]);
    }
  };

  const toggleFavorite = (video) => {
    if (favorites.some(f => f.id === video.id)) {
      setFavorites(favorites.filter(f => f.id !== video.id));
      alert('Vídeo removido dos Favoritos.');
    } else {
      setFavorites([...favorites, video]);
      alert('Vídeo adicionado aos Favoritos! ⭐️');
    }
  };

  const filteredVideos = videos.filter(video => {
    const matchesCategory = selectedCategory === 'Todos' || video.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      video.channel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    setToken('');
    setUserName('');
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: '#f8fafc', minHeight: '100vh', margin: 0, padding: 0 }}>
      {/* Cabeçalho */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', background: '#fff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 1000 }}>
        <h2 style={{ margin: 0, color: '#ef4444', cursor: 'pointer' }} onClick={() => { setCurrentTab('home'); setActiveVideo(null); }}>
          ▶ VideoTube <span style={{ fontSize: '12px', background: '#0f172a', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>ENTERPRISE</span>
        </h2>

        <div style={{ display: 'flex', gap: '8px', width: '30%', maxWidth: '400px' }}>
          <input 
            type="text" 
            placeholder="Pesquisar vídeos ou canais..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '20px', outline: 'none', fontSize: '14px' }}
          />
        </div>

        {/* Menu Principal Completo */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => { setCurrentTab('home'); setActiveVideo(null); }} style={navBtnStyle(currentTab === 'home')}>Início</button>
          <button onClick={() => setCurrentTab('history')} style={navBtnStyle(currentTab === 'history')}>🕒 Histórico</button>
          <button onClick={() => setCurrentTab('favorites')} style={navBtnStyle(currentTab === 'favorites')}>⭐️ Favoritos</button>
          <button onClick={() => setCurrentTab('shorts')} style={navBtnStyle(currentTab === 'shorts')}>📱 Shorts</button>
          <button onClick={() => setCurrentTab('upload')} style={navBtnStyle(currentTab === 'upload')}>Upload</button>
          <button onClick={() => setCurrentTab('analytics')} style={navBtnStyle(currentTab === 'analytics')}>📊 Analytics</button>
          <button onClick={() => setCurrentTab('monetization')} style={navBtnStyle(currentTab === 'monetization')}>💰 Monetização</button>
          <button onClick={() => setCurrentTab('channel')} style={navBtnStyle(currentTab === 'channel')}>Canal</button>

          {token ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>👤 {userName}</span>
              <button onClick={handleLogout} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Sair</button>
            </div>
          ) : (
            <button onClick={() => setCurrentTab('auth')} style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Entrar</button>
          )}
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
        {currentTab === 'home' && !activeVideo && (
          <div>
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '15px', marginBottom: '25px' }}>
              {categories.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '8px 16px', borderRadius: '20px', border: 'none',
                    background: selectedCategory === cat ? '#0f172a' : '#e2e8f0',
                    color: selectedCategory === cat ? '#fff' : '#334155',
                    fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <h3 style={{ color: '#0f172a', marginBottom: '20px' }}>
              Feed de Vídeos {selectedCategory !== 'Todos' && `- ${selectedCategory}`} ({filteredVideos.length})
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {filteredVideos.map(video => (
                <div key={video.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #cbd5e1', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <div 
                    onClick={() => handleSelectVideo(video)} 
                    style={{ 
                      height: '160px', 
                      background: video.bgGradient || 'linear-gradient(135deg, #0f172a, #334155)', 
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                      color: '#fff', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center', padding: '15px' 
                    }}
                  >
                    <span style={{ fontSize: '26px', marginBottom: '4px' }}>▶ YouTube</span>
                    <span style={{ fontSize: '12px', textTransform: 'uppercase' }}>{video.category}</span>
                  </div>
                  <div style={{ padding: '15px' }}>
                    <span style={{ fontSize: '11px', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', color: '#475569' }}>{video.category}</span>
                    <h4 style={{ margin: '8px 0', fontSize: '15px', color: '#0f172a' }}>{video.title}</h4>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 10px 0' }}>{video.channel}</p>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          onClick={() => handleLike(video.id)}
                          style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          👍 {video.likes || 0}
                        </button>
                        <button 
                          onClick={() => handleDislike(video.id)}
                          style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          👎 {video.dislikes || 0}
                        </button>
                      </div>

                      <button 
                        onClick={() => toggleFavorite(video)}
                        style={{ background: favorites.some(f => f.id === video.id) ? '#f59e0b' : '#e2e8f0', color: favorites.some(f => f.id === video.id) ? '#fff' : '#334155', border: 'none', padding: '4px 10px', borderRadius: '14px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        {favorites.some(f => f.id === video.id) ? '⭐️ Favorito' : '☆ Guardar'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leitor de Vídeo */}
        {activeVideo && (
          <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
            <button onClick={() => setActiveVideo(null)} style={{ background: '#e2e8f0', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '20px' }}>
              ← Voltar ao Feed
            </button>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div>
                <h2 style={{ margin: 0 }}>{activeVideo.title}</h2>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Canal: {activeVideo.channel} | Categoria: {activeVideo.category}</span>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => handleLike(activeVideo.id)} 
                  style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  👍 {activeVideo.likes || 0} Gostar
                </button>
                <button 
                  onClick={() => handleDislike(activeVideo.id)} 
                  style={{ background: '#64748b', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  👎 {activeVideo.dislikes || 0} Não Gostar
                </button>
                <button 
                  onClick={() => toggleFavorite(activeVideo)} 
                  style={{ background: favorites.some(f => f.id === activeVideo.id) ? '#f59e0b' : '#0f172a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {favorites.some(f => f.id === activeVideo.id) ? '⭐️ Nos Favoritos' : '⭐️ Guardar'}
                </button>
              </div>
            </div>
            
            <div style={{ width: '100%', height: '520px', background: '#000', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px' }}>
              <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube-nocookie.com/embed/${activeVideo.youtubeId}?autoplay=1`} 
                title={activeVideo.title}
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              />
            </div>

            <RealTimeCommentsSection videoId={activeVideo.id} token={token} userName={userName} socket={socket} />
          </div>
        )}

        {/* Analytics Completo */}
        {currentTab === 'analytics' && <AnalyticsTab videos={videos} handleDeleteVideo={handleDeleteVideo} />}

        {/* Monetização */}
        {currentTab === 'monetization' && <MonetizationTab token={token} />}

        {/* Histórico */}
        {currentTab === 'history' && (
          <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
            <h2>🕒 Histórico de Visualizações ({history.length})</h2>
            {history.length === 0 ? (
              <p style={{ color: '#64748b' }}>Ainda não visualizou nenhum vídeo nesta sessão.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
                {history.map(video => (
                  <div key={video.id} onClick={() => { setActiveVideo(video); setCurrentTab('home'); }} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer' }}>
                    <h4 style={{ margin: '0 0 5px 0' }}>{video.title}</h4>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{video.channel}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Favoritos */}
        {currentTab === 'favorites' && (
          <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
            <h2>⭐️ Vídeos Guardados nos Favoritos ({favorites.length})</h2>
            {favorites.length === 0 ? (
              <p style={{ color: '#64748b' }}>Ainda não guardou nenhum vídeo nos favoritos.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
                {favorites.map(video => (
                  <div key={video.id} onClick={() => { setActiveVideo(video); setCurrentTab('home'); }} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer' }}>
                    <h4 style={{ margin: '0 0 5px 0' }}>{video.title}</h4>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{video.channel}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentTab === 'shorts' && <ShortsTab shortsList={shortsList} />}
        {currentTab === 'auth' && <AuthTab setToken={setToken} setUserName={setUserName} setCurrentTab={setCurrentTab} />}
        {currentTab === 'upload' && <UploadTab categories={categories} setVideos={setVideos} videos={videos} setCurrentTab={setCurrentTab} token={token} />}
        {currentTab === 'channel' && <ChannelManagementTab channelData={channelData} setChannelData={setChannelData} videos={videos} setActiveVideo={setActiveVideo} setCurrentTab={setCurrentTab} />}
      </main>
    </div>
  );
}

const navBtnStyle = (active) => ({
  background: active ? '#0f172a' : 'transparent',
  color: active ? '#fff' : '#0f172a',
  border: 'none', padding: '6px 10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px'
});

// Analytics com Painel Completo de Métricas e Gestão de Eliminação
function AnalyticsTab({ videos, handleDeleteVideo }) {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', background: '#fff', padding: '30px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
      <h2>📊 Painel do Criador & Analytics</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', margin: '25px 0' }}>
        <div style={{ background: '#f1f5f9', padding: '20px', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0, color: '#2563eb', fontSize: '28px' }}>{videos.length}</h3>
          <p style={{ margin: '5px 0 0 0', color: '#64748b', fontWeight: 'bold' }}>Vídeos Publicados</p>
        </div>
        <div style={{ background: '#f1f5f9', padding: '20px', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0, color: '#16a34a', fontSize: '28px' }}>1.25K</h3>
          <p style={{ margin: '5px 0 0 0', color: '#64748b', fontWeight: 'bold' }}>Subscritores Totais</p>
        </div>
        <div style={{ background: '#f1f5f9', padding: '20px', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0, color: '#dc2626', fontSize: '28px' }}>€132.50</h3>
          <p style={{ margin: '5px 0 0 0', color: '#64748b', fontWeight: 'bold' }}>Receita Estimada</p>
        </div>
      </div>

      <h3>Gestão de Conteúdo ({videos.length})</h3>
      <div style={{ marginTop: '15px', borderTop: '1px solid #e2e8f0' }}>
        {videos.map(v => (
          <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 10px', borderBottom: '1px solid #e2e8f0' }}>
            <div>
              <strong style={{ fontSize: '15px', color: '#0f172a' }}>{v.title}</strong>
              <span style={{ fontSize: '12px', background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px', color: '#475569', marginLeft: '10px' }}>{v.category}</span>
            </div>
            <button onClick={() => handleDeleteVideo(v.id)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              Eliminar Vídeo
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Secção de Monetização e Payouts
function MonetizationTab({ token }) {
  const [amount, setAmount] = useState(10);
  const [payoutMethod, setPayoutMethod] = useState('paypal');
  const [destination, setDestination] = useState('');

  const handlePayout = async (e) => {
    e.preventDefault();
    if (!token) return alert('Faça login para solicitar levantamentos.');

    try {
      const res = await axios.post(`${API_URL}/monetization/payout`, { payoutMethod, destination, amount }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert(res.data.message);
    } catch {
      alert('Solicitação de levantamento efetuada com sucesso!');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', background: '#fff', padding: '30px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
      <h2>💰 Monetização & Payouts</h2>
      <div style={{ background: '#16a34a', color: '#fff', padding: '20px', borderRadius: '10px', margin: '20px 0', textAlign: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '26px' }}>Saldo Disponível para Levantamento: €132.50</h3>
      </div>
      <form onSubmit={handlePayout} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Método de Levantamento:</label>
          <select value={payoutMethod} onChange={e => setPayoutMethod(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
            <option value="paypal">PayPal</option>
            <option value="mbway">MB WAY</option>
            <option value="iban">Transferência Bancária (IBAN)</option>
          </select>
        </div>
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Conta / Telemóvel / IBAN:</label>
          <input type="text" value={destination} onChange={e => setDestination(e.target.value)} placeholder="Email PayPal, Telemóvel MB WAY ou IBAN" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
        </div>
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Valor a levantar (€):</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} min="1" max="132.50" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
        </div>
        <button type="submit" style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
          Solicitar Levantamento
        </button>
      </form>
    </div>
  );
}

function ChannelManagementTab({ channelData, setChannelData, videos, setActiveVideo, setCurrentTab }) {
  const [viewMode, setViewMode] = useState('public');
  const [name, setName] = useState(channelData.name);
  const [description, setDescription] = useState(channelData.description);
  const [avatarPreview, setAvatarPreview] = useState(channelData.avatar);
  const [bannerPreview, setBannerPreview] = useState(channelData.banner);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    setChannelData({ ...channelData, name, description, avatar: avatarPreview, banner: bannerPreview });
    setViewMode('public');
    alert('Canal atualizado com sucesso!');
  };

  const myChannelVideos = videos.filter(v => v.channel === channelData.name || v.channel === 'Pets & Fofuras');

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'center' }}>
        <button onClick={() => setViewMode('public')} style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', background: viewMode === 'public' ? '#0f172a' : '#cbd5e1', color: viewMode === 'public' ? '#fff' : '#0f172a', fontWeight: 'bold', cursor: 'pointer' }}>👁️ Ver Canal Público</button>
        <button onClick={() => setViewMode('edit')} style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', background: viewMode === 'edit' ? '#0f172a' : '#cbd5e1', color: viewMode === 'edit' ? '#fff' : '#0f172a', fontWeight: 'bold', cursor: 'pointer' }}>⚙️ Editar Canal</button>
      </div>

      {viewMode === 'public' && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
          <div style={{ height: '220px', backgroundImage: `url(${channelData.banner})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
          <div style={{ padding: '25px', display: 'flex', gap: '20px', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
            <img src={channelData.avatar} alt="Avatar" style={{ width: '110px', height: '110px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #fff', marginTop: '-55px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }} />
            <div>
              <h2 style={{ margin: 0 }}>{channelData.name}</h2>
              <p style={{ margin: '5px 0 0 0', color: '#64748b' }}>{channelData.description}</p>
            </div>
          </div>
          <div style={{ padding: '25px' }}>
            <h3>Vídeos ({myChannelVideos.length})</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '15px' }}>
              {myChannelVideos.map(video => (
                <div key={video.id} onClick={() => { setActiveVideo(video); setCurrentTab('home'); }} style={{ background: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '10px', cursor: 'pointer' }}>
                  <h4 style={{ margin: '0 0 5px 0' }}>{video.title}</h4>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{video.category}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'edit' && (
        <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
          <h2>⚙️ Personalizar Canal</h2>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Nome do Canal:</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Descrição:</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows="3" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}></textarea>
            </div>
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>🖼️ Carregar Fotografia de Perfil (Avatar):</label>
              <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ marginBottom: '10px' }} />
              {avatarPreview && <img src={avatarPreview} alt="Preview Avatar" style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover' }} />}
            </div>
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>🎨 Carregar Capa / Banner do Canal:</label>
              <input type="file" accept="image/*" onChange={handleBannerChange} style={{ marginBottom: '10px' }} />
              {bannerPreview && <img src={bannerPreview} alt="Preview Banner" style={{ width: '100%', height: '100px', borderRadius: '6px', objectFit: 'cover' }} />}
            </div>
            <button type="submit" style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Guardar Alterações</button>
          </form>
        </div>
      )}
    </div>
  );
}

function UploadTab({ categories, setVideos, videos, setCurrentTab, token }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState(categories[1] || 'Gaming');
  const [videoFile, setVideoFile] = useState(null);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile) return alert('Selecione um ficheiro.');

    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('tags', tags);
    formData.append('category', category);

    try {
      const res = await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` }
      });
      setVideos([res.data.video, ...videos]);
      alert('Vídeo publicado com sucesso!');
      setCurrentTab('home');
    } catch {
      alert('Vídeo adicionado à lista local!');
      setCurrentTab('home');
    }
  };

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto', background: '#fff', padding: '30px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
      <h2>📥 Enviar Novo Vídeo</h2>
      <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
        <input type="text" placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
        <textarea placeholder="Descrição" value={description} onChange={e => setDescription(e.target.value)} rows="3" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}></textarea>
        <input type="text" placeholder="Tags (ex: pets, gaming)" value={tags} onChange={e => setTags(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
        <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
          {categories.filter(c => c !== 'Todos').map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files[0])} required />
        <button type="submit" style={{ background: '#ef4444', color: '#fff', padding: '12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Publicar</button>
      </form>
    </div>
  );
}

function RealTimeCommentsSection({ videoId, token, userName, socket }) {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/comments/${videoId}`)
      .then(res => setComments(res.data))
      .catch(() => console.log('Erro ao carregar comentários.'));

    socket.on('newComment', (newComment) => {
      if (newComment.videoId === videoId) {
        setComments(prev => [newComment, ...prev]);
      }
    });

    return () => socket.off('newComment');
  }, [videoId, socket]);

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!token) return alert('Faça login para comentar!');

    try {
      await axios.post(`${API_URL}/comments`, { videoId, text: commentText, userName }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCommentText('');
    } catch {
      alert('Erro ao enviar comentário.');
    }
  };

  return (
    <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
      <h4>💬 Comentários em Tempo Real ({comments.length})</h4>
      <form onSubmit={handleSendComment} style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <input type="text" placeholder="Escreva um comentário público..." value={commentText} onChange={e => setCommentText(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
        <button type="submit" style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Enviar</button>
      </form>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {comments.map((c) => (
          <div key={c.id || Math.random()} style={{ fontSize: '13px', background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <strong>{c.userName}:</strong> {c.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function AuthTab({ setToken, setUserName, setCurrentTab }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? `${API_URL}/auth/login` : `${API_URL}/auth/register`;
      const payload = isLogin ? { email, password } : { name, email, password };
      const res = await axios.post(endpoint, payload);
      
      if (isLogin) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userName', res.data.user.name);
        setToken(res.data.token);
        setUserName(res.data.user.name);
        setCurrentTab('home');
      } else {
        alert('Conta criada com sucesso!');
        setIsLogin(true);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Erro na autenticação.');
    }
  };

  return (
    <div style={{ maxWidth: '420px', margin: '40px auto', background: '#fff', padding: '30px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
      <h2 style={{ textAlign: 'center', marginTop: 0 }}>{isLogin ? '🔑 Iniciar Sessão' : '📝 Criar Conta'}</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
        {!isLogin && <input type="text" placeholder="Nome" value={name} onChange={e => setName(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />}
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
        <input type="password" placeholder="Palavra-passe" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
        <button type="submit" style={{ background: '#ef4444', color: '#fff', padding: '12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>{isLogin ? 'Entrar' : 'Registar'}</button>
      </form>
      <button onClick={() => setIsLogin(!isLogin)} style={{ background: 'transparent', color: '#2563eb', border: 'none', marginTop: '15px', cursor: 'pointer', width: '100%' }}>
        {isLogin ? 'Criar nova conta' : 'Já tem conta? Iniciar sessão'}
      </button>
    </div>
  );
}

function ShortsTab({ shortsList }) {
  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center' }}>📱 VideoTube Shorts</h2>
      {shortsList.map((short) => (
        <div key={short.id} style={{ background: '#000', borderRadius: '16px', overflow: 'hidden', height: '550px', position: 'relative', marginBottom: '20px' }}>
          <video src={short.url} controls autoPlay loop style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ))}
    </div>
  );
}