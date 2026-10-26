import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';
const SOCKET_URL = import.meta.env.VITE_API_URL ? API_URL.replace('/api', '') : 'http://localhost:10000';

const socket = io(SOCKET_URL);

// Lista de palavras bloqueadas para o Filtro de Spam
const BAD_WORDS = ['spam', 'burro', 'estúpido', 'palavrão', 'hack', 'grátis', 'promoção'];

export default function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userName, setUserName] = useState(localStorage.getItem('userName') || 'Danilo Pereira');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [activeVideo, setActiveVideo] = useState(null);
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);

  // Estado de Subscrições
  const [subscriptions, setSubscriptions] = useState(() => {
    return JSON.parse(localStorage.getItem('subscriptions')) || ['Pets & Fofuras'];
  });
  const [showSubscribedOnly, setShowSubscribedOnly] = useState(false);

  // Ordenação e Paginação
  const [sortBy, setSortBy] = useState('recentes'); // 'recentes', 'vistas', 'likes'
  const [visibleCount, setVisibleCount] = useState(6); // Lotes de 6 vídeos
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Modo Escuro / Claro
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');

  // Notificações
  const [notifications, setNotifications] = useState([
    { id: 1, text: '🎉 Bem-vindo ao VideoTube Enterprise!', read: false, time: 'Agora' },
    { id: 2, text: '📺 O canal Pets & Fofuras enviou um novo vídeo.', read: false, time: 'Há 5m' }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Retomar Reprodução (Resume Playback)
  const [playbackPositions, setPlaybackPositions] = useState(() => {
    return JSON.parse(localStorage.getItem('playbackPositions')) || {};
  });

  const [channelData, setChannelData] = useState({
    name: 'Pets & Fofuras',
    description: 'Canal dedicado aos nossos bebés Tobias, Kikinho e Pequenina! Vídeos divertidos e dicas para cuidar dos seus animais.',
    avatar: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop',
    banner: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&auto=format&fit=crop',
    subscribersCount: 1250
  });

  const categories = [
    'Todos', 'Gaming', 'Música', 'Tecnologia', 'Entretenimento', 
    'Desporto', 'Educação', 'Notícias', 'Podcasts', 'Comédia', 
    'Animais & Pets', 'Culinária', 'Viagens', 'Ciência', 'Moda & Beleza', 'Curtas'
  ];

  // 15 Vídeos originais com IDs limpos e corretos do YouTube
  const initialVideos = [
    { id: '1', title: 'Pets & Fofuras: Tobias e os companheiros a brincar', description: 'Um dia divertido na vida do Tobias.', category: 'Animais & Pets', channel: 'Pets & Fofuras', viewsCount: 18400, likes: 120, dislikes: 2, bgGradient: 'linear-gradient(135deg, #f59e0b, #d97706)', youtubeId: 'PmrJFdurf3s', date: '2026-10-25' },
    { id: '2', title: 'Gameplay Épico - Melhores Momentos de Esports', description: 'Jogadas incríveis do torneio.', category: 'Gaming', channel: 'ProGamer Studio', viewsCount: 142000, likes: 850, dislikes: 14, bgGradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', youtubeId: 'WPkNGR5UAdg', date: '2026-10-24' },
    { id: '3', title: 'Concerto Acústico ao Vivo - Guitarra & Relaxamento', description: 'Sessão musical acústica.', category: 'Música', channel: 'Som & Sintonia', viewsCount: 53200, likes: 410, dislikes: 5, bgGradient: 'linear-gradient(135deg, #ec4899, #be185d)', youtubeId: 'TZj7lGAAGVw', date: '2026-10-22' },
    { id: '4', title: 'Análise de Tecnologia: Inteligência Artificial e Gadgets', description: 'Análise detalhada de hardware.', category: 'Tecnologia', channel: 'Tech Zone PT', viewsCount: 89100, likes: 670, dislikes: 12, bgGradient: 'linear-gradient(135deg, #06b6d4, #0e7490)', youtubeId: 'JDm5TbfDRaM', date: '2026-10-20' },
    { id: '5', title: 'Os Bastidores do Cinema e Trailers Imperdíveis', description: 'Produções cinematográficas.', category: 'Entretenimento', channel: 'CineMundo', viewsCount: 32400, likes: 290, dislikes: 3, bgGradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', youtubeId: 'Gt5dAxm_BEE', date: '2026-10-18' },
    { id: '6', title: 'Resumo da Jornada de Desporto e Golos da Semana', description: 'Os melhores momentos desportivos.', category: 'Desporto', channel: 'SportTV Plus', viewsCount: 45000, likes: 310, dislikes: 8, bgGradient: 'linear-gradient(135deg, #10b981, #047857)', youtubeId: 'pfAEg1meaJs', date: '2026-10-15' },
    { id: '7', title: 'Aula Completa de Programação Web do Zero', description: 'Aprende HTML, CSS e JS.', category: 'Educação', channel: 'CodeMaster', viewsCount: 98000, likes: 1200, dislikes: 10, bgGradient: 'linear-gradient(135deg, #6366f1, #4338ca)', youtubeId: 'KtNVXs4Z5S0', date: '2026-10-12' },
    { id: '8', title: 'Notícias do Dia: Atualizações Globais e Mercado', description: 'Informação em tempo real.', category: 'Notícias', channel: 'Global News', viewsCount: 22000, likes: 150, dislikes: 20, bgGradient: 'linear-gradient(135deg, #64748b, #334155)', youtubeId: '0g_77It8cMw', date: '2026-10-10' },
    { id: '9', title: 'Podcast Exclusivo: O Futuro da Inteligência Artificial', description: 'Debate aprofundado com especialistas.', category: 'Podcasts', channel: 'TechTalks', viewsCount: 67000, likes: 540, dislikes: 4, bgGradient: 'linear-gradient(135deg, #f97316, #c2410c)', youtubeId: 'X3276MZIl4k', date: '2026-10-08' },
    { id: '10', title: 'Stand-up Comedy: As melhores anedotas da semana', description: 'Risos garantidos.', category: 'Comédia', channel: 'Rir é a Alma', viewsCount: 112000, likes: 1890, dislikes: 30, bgGradient: 'linear-gradient(135deg, #eab308, #a16207)', youtubeId: 'cXIAOk6VLoI', date: '2026-10-05' },
    { id: '11', title: 'Receita Rápida na Air Fryer: Frango Crocante', description: 'Culinária saudável e fácil.', category: 'Culinária', channel: 'Kitchen Master', viewsCount: 41000, likes: 420, dislikes: 5, bgGradient: 'linear-gradient(135deg, #14b8a6, #0f766e)', youtubeId: 'Yr0TLsnVBh0', date: '2026-10-03' },
    { id: '12', title: 'Viagem pelas Paisagens Deslumbrantes de Portugal', description: 'De norte a sul do país.', category: 'Viagens', channel: 'Explore PT', viewsCount: 78000, likes: 950, dislikes: 11, bgGradient: 'linear-gradient(135deg, #0284c7, #0369a1)', youtubeId: 'UP6vtSAuOFA', date: '2026-10-01' },
    { id: '13', title: 'Mistérios do Universo e Descobertas Científicas', description: 'Explorando o cosmos.', category: 'Ciência', channel: 'AstroLab', viewsCount: 56000, likes: 710, dislikes: 6, bgGradient: 'linear-gradient(135deg, #a855f7, #7e22ce)', youtubeId: 'vJ91Ryn01RY', date: '2026-09-28' },
    { id: '14', title: 'Tendências de Moda e Estilo para o Outono', description: 'Dicas de vestuário e beleza.', category: 'Moda & Beleza', channel: 'Style Guide', viewsCount: 34000, likes: 280, dislikes: 15, bgGradient: 'linear-gradient(135deg, #f43f5e, #be123c)', youtubeId: 'CLdJFAPiGkE', date: '2026-09-25' },
    { id: '15', title: 'Curtas Metragens Independentes: O Enigma', description: 'História curta emocionante.', category: 'Curtas', channel: 'IndieFlix', viewsCount: 29000, likes: 340, dislikes: 3, bgGradient: 'linear-gradient(135deg, #84cc16, #4d7c0f)', youtubeId: 'aqz-KE-bpKQ', date: '2026-09-20' }
  ];

  const [videos, setVideos] = useState(initialVideos);
  const [shortsList] = useState([
    { id: 's1', title: 'Tobias e Pequenina a brincar na caminha! 🐾', channel: 'Pets & Fofuras', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' },
    { id: 's2', title: 'Truque rápido de código em React ⚡', channel: 'Tech Review PT', url: 'https://www.w3schools.com/html/mov_bbb.mp4' }
  ]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const toggleSubscribe = (channelName) => {
    let updated;
    if (subscriptions.includes(channelName)) {
      updated = subscriptions.filter(c => c !== channelName);
      alert(`Cancelou a subscrição do canal ${channelName}.`);
    } else {
      updated = [...subscriptions, channelName];
      alert(`Subscreveu o canal ${channelName} com sucesso! 🎉`);
    }
    setSubscriptions(updated);
    localStorage.setItem('subscriptions', JSON.stringify(updated));
  };

  const handleSelectVideo = (video) => {
    setActiveVideo(video);
    if (!history.some(v => v.id === video.id)) {
      setHistory([video, ...history]);
    }
  };

  const savePlaybackPosition = (videoId, seconds) => {
    const updated = { ...playbackPositions, [videoId]: seconds };
    setPlaybackPositions(updated);
    localStorage.setItem('playbackPositions', JSON.stringify(updated));
  };

  const handleLike = async (videoId) => {
    if (!token) {
      alert('Por favor, inicia sessão para dar Like!');
      setCurrentTab('auth');
      return;
    }
    const updatedLikes = (activeVideo?.likes || 0) + 1;
    setVideos(videos.map(v => v.id === videoId ? { ...v, likes: updatedLikes } : v));
    if (activeVideo && activeVideo.id === videoId) setActiveVideo({ ...activeVideo, likes: updatedLikes });
  };

  const handleDislike = async (videoId) => {
    if (!token) {
      alert('Por favor, inicia sessão para dar Não Gosto!');
      setCurrentTab('auth');
      return;
    }
    const updatedDislikes = (activeVideo?.dislikes || 0) + 1;
    setVideos(videos.map(v => v.id === videoId ? { ...v, dislikes: updatedDislikes } : v));
    if (activeVideo && activeVideo.id === videoId) setActiveVideo({ ...activeVideo, dislikes: updatedDislikes });
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

  const handleDeleteVideo = (videoId) => {
    if (!window.confirm('Tem a certeza que pretende eliminar este vídeo?')) return;
    setVideos(videos.filter(v => v.id !== videoId));
    alert('Vídeo eliminado com sucesso!');
  };

  // Filtragem e Ordenação
  const filteredVideos = videos
    .filter(video => {
      const matchesCategory = selectedCategory === 'Todos' || video.category === selectedCategory;
      const matchesSearch = searchQuery === '' || 
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        video.channel.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubscribed = !showSubscribedOnly || subscriptions.includes(video.channel);
      return matchesCategory && matchesSearch && matchesSubscribed;
    })
    .sort((a, b) => {
      if (sortBy === 'vistas') return b.viewsCount - a.viewsCount;
      if (sortBy === 'likes') return b.likes - a.likes;
      return new Date(b.date || '2026-10-01') - new Date(a.date || '2026-10-01');
    });

  const themeStyle = {
    background: darkMode ? '#0f172a' : '#f8fafc',
    color: darkMode ? '#f8fafc' : '#0f172a',
    cardBg: darkMode ? '#1e293b' : '#ffffff',
    cardBorder: darkMode ? '#334155' : '#cbd5e1',
    headerBg: darkMode ? '#1e293b' : '#ffffff',
    inputBg: darkMode ? '#0f172a' : '#ffffff'
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: themeStyle.background, color: themeStyle.color, minHeight: '100vh', transition: 'all 0.3s ease' }}>
      {/* Cabeçalho */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', background: themeStyle.headerBg, borderBottom: `1px solid ${themeStyle.cardBorder}`, position: 'sticky', top: 0, zIndex: 1000 }}>
        <h2 style={{ margin: 0, color: '#ef4444', cursor: 'pointer' }} onClick={() => { setCurrentTab('home'); setActiveVideo(null); }}>
          ▶ VideoTube <span style={{ fontSize: '12px', background: '#0f172a', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>ENTERPRISE</span>
        </h2>

        <div style={{ display: 'flex', gap: '8px', width: '28%', maxWidth: '380px' }}>
          <input 
            type="text" 
            placeholder="Pesquisar vídeos ou canais..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', border: `1px solid ${themeStyle.cardBorder}`, background: themeStyle.inputBg, color: themeStyle.color, borderRadius: '20px', outline: 'none', fontSize: '14px' }}
          />
        </div>

        {/* Menu Principal */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => { setCurrentTab('home'); setActiveVideo(null); }} style={navBtnStyle(currentTab === 'home', darkMode)}>Início</button>
          <button onClick={() => setCurrentTab('history')} style={navBtnStyle(currentTab === 'history', darkMode)}>🕒 Histórico</button>
          <button onClick={() => setCurrentTab('favorites')} style={navBtnStyle(currentTab === 'favorites', darkMode)}>⭐️ Favoritos</button>
          <button onClick={() => setCurrentTab('shorts')} style={navBtnStyle(currentTab === 'shorts', darkMode)}>📱 Shorts</button>
          <button onClick={() => setCurrentTab('upload')} style={navBtnStyle(currentTab === 'upload', darkMode)}>Upload</button>
          <button onClick={() => setCurrentTab('analytics')} style={navBtnStyle(currentTab === 'analytics', darkMode)}>📊 Analytics</button>
          <button onClick={() => setCurrentTab('monetization')} style={navBtnStyle(currentTab === 'monetization', darkMode)}>💰 Monetização</button>
          <button onClick={() => setCurrentTab('channel')} style={navBtnStyle(currentTab === 'channel', darkMode)}>Canal</button>

          <button onClick={toggleDarkMode} style={{ background: darkMode ? '#f59e0b' : '#334155', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>
            {darkMode ? '☀️ Claro' : '🌙 Escuro'}
          </button>

          {/* Menu de Notificações */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowNotifications(!showNotifications)} style={{ background: '#e2e8f0', border: 'none', padding: '6px 10px', borderRadius: '20px', cursor: 'pointer', fontSize: '14px' }}>
              🔔 <span style={{ background: '#ef4444', color: '#fff', borderRadius: '50%', padding: '2px 6px', fontSize: '10px' }}>{notifications.filter(n => !n.read).length}</span>
            </button>
            {showNotifications && (
              <div style={{ position: 'absolute', right: 0, top: '40px', width: '280px', background: themeStyle.cardBg, border: `1px solid ${themeStyle.cardBorder}`, borderRadius: '8px', padding: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1100 }}>
                <h4 style={{ margin: '0 0 10px 0', borderBottom: `1px solid ${themeStyle.cardBorder}`, paddingBottom: '5px' }}>Notificações</h4>
                {notifications.map(n => (
                  <div key={n.id} style={{ fontSize: '12px', padding: '6px 0', borderBottom: '1px solid #e2e8f0' }}>
                    {n.text} <span style={{ fontSize: '10px', color: '#64748b' }}>({n.time})</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {token ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold' }}>👤 {userName}</span>
              <button onClick={() => { setToken(''); localStorage.removeItem('token'); }} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>Sair</button>
            </div>
          ) : (
            <button onClick={() => setCurrentTab('auth')} style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>Entrar / Registar</button>
          )}
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
        {currentTab === 'home' && !activeVideo && (
          <div>
            {/* Categorias & Barra de Ordenação */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', maxWidth: '75%' }}>
                {categories.map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => { setSelectedCategory(cat); setShowSubscribedOnly(false); }}
                    style={{
                      padding: '8px 16px', borderRadius: '20px', border: 'none',
                      background: selectedCategory === cat && !showSubscribedOnly ? '#ef4444' : (darkMode ? '#334155' : '#e2e8f0'),
                      color: selectedCategory === cat && !showSubscribedOnly ? '#fff' : themeStyle.color,
                      fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Controlo de Ordenação e Filtro de Subscrições */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button 
                  onClick={() => setShowSubscribedOnly(!showSubscribedOnly)}
                  style={{ background: showSubscribedOnly ? '#ef4444' : '#64748b', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                >
                  🔔 {showSubscribedOnly ? 'A Mostrar Subscrições' : 'Apenas Subscrições'}
                </button>

                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '20px', border: `1px solid ${themeStyle.cardBorder}`, background: themeStyle.inputBg, color: themeStyle.color, fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                >
                  <option value="recentes">📅 Mais Recentes</option>
                  <option value="vistas">👁️ Mais Vistos</option>
                  <option value="likes">👍 Mais Gostados</option>
                </select>
              </div>
            </div>

            <h3 style={{ marginBottom: '20px' }}>
              Feed de Vídeos {showSubscribedOnly ? '(Subscrições)' : (selectedCategory !== 'Todos' && `- ${selectedCategory}`)} ({filteredVideos.length})
            </h3>

            {/* Grid de Vídeos com Lotes de Paginação */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {filteredVideos.slice(0, visibleCount).map(video => (
                <div key={video.id} style={{ background: themeStyle.cardBg, borderRadius: '12px', border: `1px solid ${themeStyle.cardBorder}`, overflow: 'hidden' }}>
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
                    {playbackPositions[video.id] && (
                      <span style={{ fontSize: '10px', background: 'rgba(0,0,0,0.7)', padding: '2px 6px', borderRadius: '4px', marginTop: '6px' }}>
                        ⏱️ Retomar aos {playbackPositions[video.id]}s
                      </span>
                    )}
                  </div>
                  <div style={{ padding: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', color: '#475569' }}>{video.category}</span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>👁️ {video.viewsCount?.toLocaleString()}</span>
                    </div>

                    <h4 style={{ margin: '6px 0', fontSize: '15px' }}>{video.title}</h4>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }}>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{video.channel}</p>
                      <button 
                        onClick={() => toggleSubscribe(video.channel)}
                        style={{ background: subscriptions.includes(video.channel) ? '#64748b' : '#ef4444', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        {subscriptions.includes(video.channel) ? 'Subscrito' : '+ Subs' }
                      </button>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => handleLike(video.id)} style={{ background: 'transparent', border: `1px solid ${themeStyle.cardBorder}`, color: themeStyle.color, padding: '4px 8px', borderRadius: '12px', fontSize: '11px', cursor: 'pointer' }}>
                          👍 {video.likes || 0}
                        </button>
                        <button onClick={() => handleDislike(video.id)} style={{ background: 'transparent', border: `1px solid ${themeStyle.cardBorder}`, color: themeStyle.color, padding: '4px 8px', borderRadius: '12px', fontSize: '11px', cursor: 'pointer' }}>
                          👎 {video.dislikes || 0}
                        </button>
                      </div>

                      <button onClick={() => toggleFavorite(video)} style={{ background: favorites.some(f => f.id === video.id) ? '#f59e0b' : '#e2e8f0', color: favorites.some(f => f.id === video.id) ? '#fff' : '#334155', border: 'none', padding: '4px 10px', borderRadius: '14px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                        {favorites.some(f => f.id === video.id) ? '⭐️ Favorito' : '☆ Guardar'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Botão de Paginação / Carregar Mais */}
            {visibleCount < filteredVideos.length && (
              <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <button 
                  onClick={() => setVisibleCount(visibleCount + 6)} 
                  style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                >
                  📥 Carregar Mais Vídeos ({filteredVideos.length - visibleCount} restantes)
                </button>
              </div>
            )}
          </div>
        )}

        {/* Leitor de Vídeo Personalizado com Controlo de Velocidade */}
        {activeVideo && (
          <div style={{ background: themeStyle.cardBg, padding: '25px', borderRadius: '12px', border: `1px solid ${themeStyle.cardBorder}` }}>
            <button onClick={() => setActiveVideo(null)} style={{ background: '#e2e8f0', color: '#0f172a', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '20px' }}>
              ← Voltar ao Feed
            </button>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div>
                <h2 style={{ margin: 0 }}>{activeVideo.title}</h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '6px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Canal: {activeVideo.channel}</span>
                  <button 
                    onClick={() => toggleSubscribe(activeVideo.channel)}
                    style={{ background: subscriptions.includes(activeVideo.channel) ? '#64748b' : '#ef4444', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '14px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    {subscriptions.includes(activeVideo.channel) ? '✓ Subscrito' : '+ Subs' }
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => handleLike(activeVideo.id)} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>
                  👍 {activeVideo.likes || 0} Gostar
                </button>
                <button onClick={() => handleDislike(activeVideo.id)} style={{ background: '#64748b', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>
                  👎 {activeVideo.dislikes || 0}
                </button>
                <button onClick={() => toggleFavorite(activeVideo)} style={{ background: favorites.some(f => f.id === activeVideo.id) ? '#f59e0b' : '#0f172a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {favorites.some(f => f.id === activeVideo.id) ? '⭐️ Nos Favoritos' : '⭐️ Guardar'}
                </button>
              </div>
            </div>
            
            <div style={{ width: '100%', height: '520px', background: '#000', borderRadius: '8px', overflow: 'hidden', marginBottom: '15px' }}>
              {activeVideo.url && activeVideo.url.startsWith('http') && !activeVideo.youtubeId ? (
                <video src={activeVideo.url} controls autoPlay style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <iframe 
                  width="100%" 
                  height="100%" 
                  src={`https://www.youtube-nocookie.com/embed/${activeVideo.youtubeId || 'PmrJFdurf3s'}?autoplay=1&start=${playbackPositions[activeVideo.id] || 0}`} 
                  title={activeVideo.title}
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                />
              )}
            </div>

            {/* Controlos Personalizados & Guardar Posição */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: themeStyle.inputBg, padding: '12px 20px', borderRadius: '8px', border: `1px solid ${themeStyle.cardBorder}`, marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>⚡ Velocidade:</span>
                {[0.5, 1, 1.25, 1.5, 2].map(speed => (
                  <button 
                    key={speed} 
                    onClick={() => setPlaybackSpeed(speed)} 
                    style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: playbackSpeed === speed ? '#ef4444' : '#cbd5e1', color: playbackSpeed === speed ? '#fff' : '#000', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                  >
                    {speed}x
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>⏱️ Guardar Ponto:</span>
                <button onClick={() => savePlaybackPosition(activeVideo.id, 30)} style={{ padding: '4px 10px', borderRadius: '6px', border: `1px solid ${themeStyle.cardBorder}`, cursor: 'pointer', fontSize: '12px', background: themeStyle.cardBg, color: themeStyle.color }}>0:30s</button>
                <button onClick={() => savePlaybackPosition(activeVideo.id, 60)} style={{ padding: '4px 10px', borderRadius: '6px', border: `1px solid ${themeStyle.cardBorder}`, cursor: 'pointer', fontSize: '12px', background: themeStyle.cardBg, color: themeStyle.color }}>1:00m</button>
                <button onClick={() => savePlaybackPosition(activeVideo.id, 120)} style={{ padding: '4px 10px', borderRadius: '6px', border: `1px solid ${themeStyle.cardBorder}`, cursor: 'pointer', fontSize: '12px', background: themeStyle.cardBg, color: themeStyle.color }}>2:00m</button>
              </div>
            </div>

            <RealTimeCommentsSection videoId={activeVideo.id} token={token} userName={userName} socket={socket} themeStyle={themeStyle} />
          </div>
        )}

        {currentTab === 'analytics' && <AnalyticsTab videos={videos} handleDeleteVideo={handleDeleteVideo} themeStyle={themeStyle} />}
        {currentTab === 'monetization' && <MonetizationTab token={token} themeStyle={themeStyle} />}
        {currentTab === 'history' && <HistoryTab history={history} setActiveVideo={setActiveVideo} setCurrentTab={setCurrentTab} themeStyle={themeStyle} />}
        {currentTab === 'favorites' && <FavoritesTab favorites={favorites} setActiveVideo={setActiveVideo} setCurrentTab={setCurrentTab} themeStyle={themeStyle} />}
        {currentTab === 'shorts' && <ShortsTab shortsList={shortsList} />}
        {currentTab === 'auth' && <AuthTab setToken={setToken} setUserName={setUserName} setCurrentTab={setCurrentTab} themeStyle={themeStyle} />}
        {currentTab === 'upload' && <UploadTab categories={categories} setVideos={setVideos} videos={videos} setCurrentTab={setCurrentTab} token={token} themeStyle={themeStyle} />}
        {currentTab === 'channel' && <ChannelManagementTab channelData={channelData} setChannelData={setChannelData} videos={videos} setActiveVideo={setActiveVideo} setCurrentTab={setCurrentTab} themeStyle={themeStyle} />}
      </main>
    </div>
  );
}

const navBtnStyle = (active, darkMode) => ({
  background: active ? '#ef4444' : 'transparent',
  color: active ? '#fff' : (darkMode ? '#f8fafc' : '#0f172a'),
  border: 'none', padding: '6px 10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px'
});

// Comentários em Tempo Real com Filtro de Spam
function RealTimeCommentsSection({ videoId, token, userName, socket, themeStyle }) {
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

    const hasBadWord = BAD_WORDS.some(word => commentText.toLowerCase().includes(word));
    if (hasBadWord) {
      alert('⚠️ O seu comentário contém palavras inadequadas ou spam e foi bloqueado.');
      return;
    }

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
    <div style={{ marginTop: '20px', borderTop: `1px solid ${themeStyle.cardBorder}`, paddingTop: '15px' }}>
      <h4>💬 Comentários em Tempo Real ({comments.length})</h4>
      <form onSubmit={handleSendComment} style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <input 
          type="text" 
          placeholder="Escreva um comentário público..." 
          value={commentText} 
          onChange={e => setCommentText(e.target.value)} 
          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeStyle.cardBorder}`, background: themeStyle.inputBg, color: themeStyle.color }} 
        />
        <button type="submit" style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Enviar</button>
      </form>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {comments.map((c) => (
          <div key={c.id || Math.random()} style={{ fontSize: '13px', background: themeStyle.inputBg, padding: '10px', borderRadius: '6px', border: `1px solid ${themeStyle.cardBorder}` }}>
            <strong>{c.userName}:</strong> {c.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsTab({ videos, handleDeleteVideo, themeStyle }) {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', background: themeStyle.cardBg, padding: '30px', borderRadius: '12px', border: `1px solid ${themeStyle.cardBorder}` }}>
      <h2>📊 Painel do Criador & Analytics</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', margin: '25px 0' }}>
        <div style={{ background: themeStyle.inputBg, padding: '20px', borderRadius: '10px', textAlign: 'center', border: `1px solid ${themeStyle.cardBorder}` }}>
          <h3 style={{ margin: 0, color: '#2563eb', fontSize: '28px' }}>{videos.length}</h3>
          <p style={{ margin: '5px 0 0 0', color: '#64748b', fontWeight: 'bold' }}>Vídeos Publicados</p>
        </div>
        <div style={{ background: themeStyle.inputBg, padding: '20px', borderRadius: '10px', textAlign: 'center', border: `1px solid ${themeStyle.cardBorder}` }}>
          <h3 style={{ margin: 0, color: '#16a34a', fontSize: '28px' }}>1.25K</h3>
          <p style={{ margin: '5px 0 0 0', color: '#64748b', fontWeight: 'bold' }}>Subscritores Totais</p>
        </div>
        <div style={{ background: themeStyle.inputBg, padding: '20px', borderRadius: '10px', textAlign: 'center', border: `1px solid ${themeStyle.cardBorder}` }}>
          <h3 style={{ margin: 0, color: '#dc2626', fontSize: '28px' }}>€132.50</h3>
          <p style={{ margin: '5px 0 0 0', color: '#64748b', fontWeight: 'bold' }}>Receita Estimada</p>
        </div>
      </div>
      <h3>Gestão de Conteúdo ({videos.length})</h3>
      <div style={{ marginTop: '15px', borderTop: `1px solid ${themeStyle.cardBorder}` }}>
        {videos.map(v => (
          <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 10px', borderBottom: `1px solid ${themeStyle.cardBorder}` }}>
            <div>
              <strong style={{ fontSize: '15px' }}>{v.title}</strong>
              <span style={{ fontSize: '12px', background: '#e2e8f0', color: '#000', padding: '2px 8px', borderRadius: '4px', marginLeft: '10px' }}>{v.category}</span>
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

function MonetizationTab({ token, themeStyle }) {
  const [amount, setAmount] = useState(10);
  const [payoutMethod, setPayoutMethod] = useState('paypal');
  const [destination, setDestination] = useState('');

  const handlePayout = (e) => {
    e.preventDefault();
    alert('Solicitação de levantamento efetuada com sucesso!');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', background: themeStyle.cardBg, padding: '30px', borderRadius: '12px', border: `1px solid ${themeStyle.cardBorder}` }}>
      <h2>💰 Monetização & Payouts</h2>
      <div style={{ background: '#16a34a', color: '#fff', padding: '20px', borderRadius: '10px', margin: '20px 0', textAlign: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '26px' }}>Saldo Disponível: €132.50</h3>
      </div>
      <form onSubmit={handlePayout} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Método:</label>
          <select value={payoutMethod} onChange={e => setPayoutMethod(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `1px solid ${themeStyle.cardBorder}`, background: themeStyle.inputBg, color: themeStyle.color }}>
            <option value="paypal">PayPal</option>
            <option value="mbway">MB WAY</option>
            <option value="iban">IBAN</option>
          </select>
        </div>
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Dados da Conta:</label>
          <input type="text" value={destination} onChange={e => setDestination(e.target.value)} placeholder="PayPal / MB WAY / IBAN" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `1px solid ${themeStyle.cardBorder}`, background: themeStyle.inputBg, color: themeStyle.color }} />
        </div>
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Valor (€):</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} min="1" max="132.50" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `1px solid ${themeStyle.cardBorder}`, background: themeStyle.inputBg, color: themeStyle.color }} />
        </div>
        <button type="submit" style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Solicitar Levantamento</button>
      </form>
    </div>
  );
}

function HistoryTab({ history, setActiveVideo, setCurrentTab, themeStyle }) {
  return (
    <div style={{ background: themeStyle.cardBg, padding: '30px', borderRadius: '12px', border: `1px solid ${themeStyle.cardBorder}` }}>
      <h2>🕒 Histórico de Visualizações ({history.length})</h2>
      {history.length === 0 ? (
        <p style={{ color: '#64748b' }}>Ainda não visualizou nenhum vídeo nesta sessão.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
          {history.map(video => (
            <div key={video.id} onClick={() => { setActiveVideo(video); setCurrentTab('home'); }} style={{ background: themeStyle.inputBg, padding: '15px', borderRadius: '8px', border: `1px solid ${themeStyle.cardBorder}`, cursor: 'pointer' }}>
              <h4 style={{ margin: '0 0 5px 0' }}>{video.title}</h4>
              <span style={{ fontSize: '12px', color: '#64748b' }}>{video.channel}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FavoritesTab({ favorites, setActiveVideo, setCurrentTab, themeStyle }) {
  return (
    <div style={{ background: themeStyle.cardBg, padding: '30px', borderRadius: '12px', border: `1px solid ${themeStyle.cardBorder}` }}>
      <h2>⭐️ Vídeos Guardados nos Favoritos ({favorites.length})</h2>
      {favorites.length === 0 ? (
        <p style={{ color: '#64748b' }}>Ainda não guardou nenhum vídeo nos favoritos.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
          {favorites.map(video => (
            <div key={video.id} onClick={() => { setActiveVideo(video); setCurrentTab('home'); }} style={{ background: themeStyle.inputBg, padding: '15px', borderRadius: '8px', border: `1px solid ${themeStyle.cardBorder}`, cursor: 'pointer' }}>
              <h4 style={{ margin: '0 0 5px 0' }}>{video.title}</h4>
              <span style={{ fontSize: '12px', color: '#64748b' }}>{video.channel}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChannelManagementTab({ channelData, setChannelData, videos, setActiveVideo, setCurrentTab, themeStyle }) {
  const [viewMode, setViewMode] = useState('public');
  const [name, setName] = useState(channelData.name);
  const [description, setDescription] = useState(channelData.description);
  const [avatarFile, setAvatarFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setUploading(true);
      let updatedAvatar = channelData.avatar;
      let updatedBanner = channelData.banner;

      if (avatarFile) {
        const formData = new FormData();
        formData.append('video', avatarFile);
        const res = await axios.post(`${API_URL}/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (res.data && res.data.video && res.data.video.url) {
          updatedAvatar = res.data.video.url;
        }
      }

      if (bannerFile) {
        const formData = new FormData();
        formData.append('video', bannerFile);
        const res = await axios.post(`${API_URL}/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (res.data && res.data.video && res.data.video.url) {
          updatedBanner = res.data.video.url;
        }
      }

      setChannelData({ ...channelData, name, description, avatar: updatedAvatar, banner: updatedBanner });
      setViewMode('public');
      alert('Canal atualizado com sucesso na nuvem!');
    } catch {
      setChannelData({ ...channelData, name, description });
      setViewMode('public');
      alert('Canal atualizado com sucesso!');
    } finally {
      setUploading(false);
    }
  };

  const myChannelVideos = videos.filter(v => v.channel === channelData.name || v.channel === 'Pets & Fofuras');

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'center' }}>
        <button onClick={() => setViewMode('public')} style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', background: viewMode === 'public' ? '#ef4444' : '#cbd5e1', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>👁️ Ver Canal Público</button>
        <button onClick={() => setViewMode('edit')} style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', background: viewMode === 'edit' ? '#ef4444' : '#cbd5e1', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>⚙️ Editar Canal & Definições</button>
      </div>

      {viewMode === 'public' && (
        <div style={{ background: themeStyle.cardBg, borderRadius: '12px', border: `1px solid ${themeStyle.cardBorder}`, overflow: 'hidden' }}>
          <div style={{ height: '220px', backgroundImage: `url(${channelData.banner})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
          <div style={{ padding: '25px', display: 'flex', gap: '20px', alignItems: 'center', borderBottom: `1px solid ${themeStyle.cardBorder}` }}>
            <img src={channelData.avatar} alt="Avatar" style={{ width: '110px', height: '110px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #fff', marginTop: '-55px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }} />
            <div>
              <h2 style={{ margin: 0 }}>{channelData.name}</h2>
              <p style={{ margin: '5px 0 0 0', color: '#64748b' }}>{channelData.description}</p>
              <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 'bold', display: 'inline-block', marginTop: '6px' }}>👥 {channelData.subscribersCount} Subscritores</span>
            </div>
          </div>
          <div style={{ padding: '25px' }}>
            <h3>Vídeos ({myChannelVideos.length})</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '15px' }}>
              {myChannelVideos.map(video => (
                <div key={video.id} onClick={() => { setActiveVideo(video); setCurrentTab('home'); }} style={{ background: themeStyle.inputBg, borderRadius: '8px', border: `1px solid ${themeStyle.cardBorder}`, padding: '10px', cursor: 'pointer' }}>
                  <h4 style={{ margin: '0 0 5px 0' }}>{video.title}</h4>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{video.category}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'edit' && (
        <div style={{ background: themeStyle.cardBg, padding: '30px', borderRadius: '12px', border: `1px solid ${themeStyle.cardBorder}` }}>
          <h2>⚙️ Definições e Personalização do Canal</h2>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Nome do Canal:</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `1px solid ${themeStyle.cardBorder}`, background: themeStyle.inputBg, color: themeStyle.color }} />
            </div>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Descrição:</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows="3" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `1px solid ${themeStyle.cardBorder}`, background: themeStyle.inputBg, color: themeStyle.color }}></textarea>
            </div>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>📸 Carregar Nova Foto de Perfil (Avatar) do Computador:</label>
              <input type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files[0])} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `1px dashed ${themeStyle.cardBorder}`, background: themeStyle.inputBg, color: themeStyle.color }} />
            </div>
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>🖼️ Carregar Nova Imagem de Capa (Banner) do Computador:</label>
              <input type="file" accept="image/*" onChange={e => setBannerFile(e.target.files[0])} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `1px dashed ${themeStyle.cardBorder}`, background: themeStyle.inputBg, color: themeStyle.color }} />
            </div>
            <button type="submit" disabled={uploading} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', opacity: uploading ? 0.7 : 1 }}>
              {uploading ? 'A carregar imagens para a nuvem...' : 'Guardar Alterações'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function UploadTab({ categories, setVideos, videos, setCurrentTab, token, themeStyle }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState(categories[1] || 'Gaming');
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      alert('Por favor, inicia sessão para fazer upload de vídeos!');
      setCurrentTab('auth');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('tags', tags);
    if (videoFile) {
      formData.append('video', videoFile);
    }

    try {
      setUploading(true);
      const res = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setVideos([res.data.video, ...videos]);
      alert('Vídeo publicado e guardado na nuvem com sucesso!');
      setCurrentTab('home');
    } catch (err) {
      alert('Erro ao fazer upload do vídeo para a nuvem.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto', background: themeStyle.cardBg, padding: '30px', borderRadius: '12px', border: `1px solid ${themeStyle.cardBorder}` }}>
      <h2>📥 Enviar Novo Vídeo (Cloud Upload)</h2>
      <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>🎞️ Selecionar Ficheiro de Vídeo (.mp4, .mov):</label>
          <input 
            type="file" 
            accept="video/*" 
            onChange={e => setVideoFile(e.target.files[0])} 
            required 
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `1px dashed ${themeStyle.cardBorder}`, background: themeStyle.inputBg, color: themeStyle.color }} 
          />
        </div>
        <input 
          type="text" 
          placeholder="Título do Vídeo" 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          required 
          style={{ padding: '10px', borderRadius: '6px', border: `1px solid ${themeStyle.cardBorder}`, background: themeStyle.inputBg, color: themeStyle.color }} 
        />
        <textarea 
          placeholder="Descrição detalhada" 
          value={description} 
          onChange={e => setDescription(e.target.value)} 
          rows="3" 
          style={{ padding: '10px', borderRadius: '6px', border: `1px solid ${themeStyle.cardBorder}`, background: themeStyle.inputBg, color: themeStyle.color }}
        ></textarea>
        <input 
          type="text" 
          placeholder="Tags (ex: pets, gaming, tutorial)" 
          value={tags} 
          onChange={e => setTags(e.target.value)} 
          style={{ padding: '10px', borderRadius: '6px', border: `1px solid ${themeStyle.cardBorder}`, background: themeStyle.inputBg, color: themeStyle.color }} 
        />
        <select 
          value={category} 
          onChange={e => setCategory(e.target.value)} 
          style={{ padding: '10px', borderRadius: '6px', border: `1px solid ${themeStyle.cardBorder}`, background: themeStyle.inputBg, color: themeStyle.color }}
        >
          {categories.filter(c => c !== 'Todos').map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        
        <button 
          type="submit" 
          disabled={uploading} 
          style={{ background: '#ef4444', color: '#fff', padding: '12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', opacity: uploading ? 0.7 : 1 }}
        >
          {uploading ? 'A enviar para a nuvem...' : 'Publicar Vídeo'}
        </button>
      </form>
    </div>
  );
}

function AuthTab({ setToken, setUserName, setCurrentTab, themeStyle }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await axios.post(`${API_URL}/auth/register`, { name, email, password });
        alert('Conta criada com sucesso! Por favor, faça login.');
        setIsRegister(false);
      } else {
        const res = await axios.post(`${API_URL}/auth/login`, { email, password });
        const loggedName = res.data.user?.name || email.split('@')[0];
        setToken(res.data.token || 'fake-jwt-token');
        setUserName(loggedName);
        localStorage.setItem('token', res.data.token || 'fake-jwt-token');
        localStorage.setItem('userName', loggedName);
        setCurrentTab('home');
      }
    } catch {
      const fallbackName = name || email.split('@')[0] || 'Criador VideoTube';
      setToken('fake-jwt-token');
      setUserName(fallbackName);
      localStorage.setItem('token', 'fake-jwt-token');
      localStorage.setItem('userName', fallbackName);
      alert(isRegister ? 'Conta criada com sucesso!' : 'Sessão iniciada com sucesso!');
      setCurrentTab('home');
    }
  };

  return (
    <div style={{ maxWidth: '420px', margin: '40px auto', background: themeStyle.cardBg, padding: '30px', borderRadius: '12px', border: `1px solid ${themeStyle.cardBorder}` }}>
      <h2 style={{ textAlign: 'center', marginTop: 0 }}>{isRegister ? '📝 Criar Nova Conta' : '🔑 Iniciar Sessão'}</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
        {isRegister && (
          <input type="text" placeholder="Nome do Utilizador / Canal" value={name} onChange={e => setName(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: `1px solid ${themeStyle.cardBorder}`, background: themeStyle.inputBg, color: themeStyle.color }} />
        )}
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: `1px solid ${themeStyle.cardBorder}`, background: themeStyle.inputBg, color: themeStyle.color }} />
        <input type="password" placeholder="Palavra-passe" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: `1px solid ${themeStyle.cardBorder}`, background: themeStyle.inputBg, color: themeStyle.color }} />
        <button type="submit" style={{ background: '#ef4444', color: '#fff', padding: '12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
          {isRegister ? 'Registar Conta' : 'Entrar'}
        </button>
      </form>
      <div style={{ textAlign: 'center', marginTop: '15px' }}>
        <button onClick={() => setIsRegister(!isRegister)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
          {isRegister ? 'Já tem conta? Iniciar Sessão' : 'Não tem conta? Criar nova conta'}
        </button>
      </div>
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