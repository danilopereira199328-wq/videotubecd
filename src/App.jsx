import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userName, setUserName] = useState(localStorage.getItem('userName') || 'Danilo Pereira');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [sortBy, setSortBy] = useState('date');
  const [activeVideo, setActiveVideo] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);

  const [channelData, setChannelData] = useState({
    name: 'Pets & Fofuras',
    description: 'Canal dedicado aos nossos bebés Tobias, Kikinho e Pequenina! Vídeos divertidos e dicas para cuidar dos seus animais.',
    avatar: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop',
    banner: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&auto=format&fit=crop'
  });

  const categories = [
    'Todos', 'Gaming', 'Música', 'Tecnologia', 'Entretenimento', 
    'Desporto', 'Educação', 'Notícias', 'Podcasts', 'Comédia', 'Animais & Pets'
  ];

  const [videos, setVideos] = useState([
    { 
      id: '1', 
      title: 'Pets & Fofuras: Tobias e os companheiros a brincar', 
      description: 'Um dia divertido na vida do Tobias, Kikinho e Pequenina.',
      tags: 'pets, cães, gatos, tobias',
      category: 'Animais & Pets', 
      channel: 'Pets & Fofuras', 
      viewsCount: 18400, 
      likes: 120,
      url: 'https://www.w3schools.com/html/mov_bbb.mp4' 
    },
    { 
      id: '2', 
      title: 'Gameplay Épico - Campeonato Mundial de Esports 2026', 
      description: 'Os melhores momentos do torneio internacional.',
      tags: 'gaming, esports, jogos',
      category: 'Gaming', 
      channel: 'ProGamer Studio', 
      viewsCount: 142000, 
      likes: 850,
      url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' 
    }
  ]);

  const [shortsList] = useState([
    { id: 's1', title: 'Tobias e Pequenina a brincar na caminha! 🐾', channel: 'Pets & Fofuras', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' },
    { id: 's2', title: 'Truque rápido de código em React ⚡', channel: 'Tech Review PT', url: 'https://www.w3schools.com/html/mov_bbb.mp4' }
  ]);

  const loadVideos = () => {
    const endpoint = sortBy === 'trends' ? `${API_URL}/videos/recommendations` : `${API_URL}/videos?sortBy=${sortBy}`;
    axios.get(endpoint)
      .then(res => {
        if (res.data && res.data.length > 0) setVideos(res.data);
      })
      .catch(() => console.log('A usar lista local de vídeos.'));
  };

  useEffect(() => {
    loadVideos();
  }, [sortBy]);

  const handleLike = async (videoId) => {
    if (!token) return alert('Faça login para dar Like!');
    try {
      const res = await axios.post(`${API_URL}/videos/${videoId}/like`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setVideos(videos.map(v => v.id === videoId ? { ...v, likes: res.data.likes } : v));
      if (activeVideo && activeVideo.id === videoId) {
        setActiveVideo({ ...activeVideo, likes: res.data.likes });
      }
    } catch (err) {
      alert('Erro ao dar Like.');
    }
  };

  const handleSubscribe = async (channelName) => {
    if (!token) {
      alert('Por favor, faça login para subscrever canais.');
      setCurrentTab('auth');
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/subscribe`, { channelName }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSubscriptions(res.data.subscriptions);
    } catch (err) {
      alert('Erro ao atualizar subscrição.');
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
    } catch (err) {
      alert('Erro ao eliminar vídeo.');
    }
  };

  const filteredVideos = videos.filter(video => {
    const matchesCategory = selectedCategory === 'Todos' || video.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      video.channel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (video.tags && video.tags.toLowerCase().includes(searchQuery.toLowerCase()));
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

        {/* Pesquisa + Filtros */}
        <div style={{ display: 'flex', gap: '8px', width: '45%', maxWidth: '600px' }}>
          <input 
            type="text" 
            placeholder="Pesquisar vídeos, canais ou #tags..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '20px', outline: 'none', fontSize: '14px' }}
          />
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '20px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
          >
            <option value="date">📅 Mais Recentes</option>
            <option value="views">🔥 Mais Vistos</option>
            <option value="trends">⚡ Tendências (Algoritmo)</option>
          </select>
        </div>

        {/* Menu Principal */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => { setCurrentTab('home'); setActiveVideo(null); }} style={navBtnStyle(currentTab === 'home')}>Início</button>
          <button onClick={() => setCurrentTab('live')} style={navBtnStyle(currentTab === 'live')}>🔴 Live</button>
          <button onClick={() => setCurrentTab('shorts')} style={navBtnStyle(currentTab === 'shorts')}>📱 Shorts</button>
          <button onClick={() => setCurrentTab('upload')} style={navBtnStyle(currentTab === 'upload')}>Upload</button>
          <button onClick={() => setCurrentTab('analytics')} style={navBtnStyle(currentTab === 'analytics')}>📊 Analytics</button>
          <button onClick={() => setCurrentTab('monetization')} style={navBtnStyle(currentTab === 'monetization')}>Monetização</button>
          <button onClick={() => setCurrentTab('channel')} style={navBtnStyle(currentTab === 'channel')}>O meu Canal</button>

          {token ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>👤 {userName}</span>
              <button onClick={handleLogout} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Sair</button>
            </div>
          ) : (
            <button onClick={() => setCurrentTab('auth')} style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Entrar / Registar</button>
          )}
        </div>
      </header>

      {/* Conteúdo da Aplicação */}
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

            <h3 style={{ color: '#0f172a', marginBottom: '20px' }}>Feed de Vídeos ({filteredVideos.length})</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {filteredVideos.map(video => (
                <div key={video.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
                  <div onClick={() => setActiveVideo(video)} style={{ height: '160px', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                    ▶ Reproduzir ({video.category})
                  </div>
                  <div style={{ padding: '15px' }}>
                    <span style={{ fontSize: '11px', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', color: '#475569' }}>{video.category}</span>
                    <h4 style={{ margin: '8px 0', fontSize: '15px', color: '#0f172a' }}>{video.title}</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>👍 {video.likes || 0} Likes</span>
                      <button 
                        onClick={() => handleSubscribe(video.channel)}
                        style={{
                          background: subscriptions.includes(video.channel) ? '#cbd5e1' : '#ef4444',
                          color: subscriptions.includes(video.channel) ? '#0f172a' : '#fff',
                          border: 'none', padding: '4px 10px', borderRadius: '14px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer'
                        }}
                      >
                        {subscriptions.includes(video.channel) ? 'Subscrito ✓' : 'Subscrever'}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: '0 0 10px 0' }}>{activeVideo.title}</h2>
              <button onClick={() => handleLike(activeVideo.id)} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>
                👍 {activeVideo.likes || 0} Gostar
              </button>
            </div>
            
            <div style={{ width: '100%', height: '500px', background: '#000', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <video key={activeVideo.id} src={activeVideo.url} controls autoPlay style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>

            <CommentsSection videoId={activeVideo.id} token={token} userName={userName} />
          </div>
        )}

        {/* Outras Páginas */}
        {currentTab === 'analytics' && <AnalyticsTab videos={videos} handleDeleteVideo={handleDeleteVideo} />}
        {currentTab === 'shorts' && <ShortsTab shortsList={shortsList} />}
        {currentTab === 'live' && <LiveTab />}
        {currentTab === 'auth' && <AuthTab setToken={setToken} setUserName={setUserName} setCurrentTab={setCurrentTab} />}
        {currentTab === 'upload' && <UploadTab categories={categories} setVideos={setVideos} videos={videos} setCurrentTab={setCurrentTab} token={token} />}
        {currentTab === 'monetization' && <MonetizationTab token={token} />}
        {currentTab === 'channel' && <ChannelManagementTab channelData={channelData} setChannelData={setChannelData} videos={videos} setActiveVideo={setActiveVideo} setCurrentTab={setCurrentTab} />}
      </main>
    </div>
  );
}

const navBtnStyle = (active) => ({
  background: active ? '#0f172a' : 'transparent',
  color: active ? '#fff' : '#0f172a',
  border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px'
});

/* -------------------------------------------------------------
   COMPONENTE DE AUTENTICAÇÃO (LOGIN + CRIAR CONTA / REGISTAR)
------------------------------------------------------------- */
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
        alert('Conta criada com sucesso! Podes agora iniciar sessão.');
        setIsLogin(true);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Erro na autenticação.');
    }
  };

  return (
    <div style={{ maxWidth: '420px', margin: '40px auto', background: '#fff', padding: '30px', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
      <h2 style={{ textAlign: 'center', marginTop: 0, color: '#0f172a' }}>
        {isLogin ? '🔑 Iniciar Sessão' : '📝 Criar Nova Conta'}
      </h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
        {!isLogin && (
          <input 
            type="text" 
            placeholder="O teu Nome" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            required 
            style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} 
          />
        )}
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          required 
          style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} 
        />
        <input 
          type="password" 
          placeholder="Palavra-passe" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          required 
          style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} 
        />
        
        <button type="submit" style={{ background: '#ef4444', color: '#fff', padding: '12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
          {isLogin ? 'Entrar' : 'Criar Conta'}
        </button>
      </form>

      <div style={{ marginTop: '20px', textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
        <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 8px 0' }}>
          {isLogin ? 'Ainda não tens conta?' : 'Já tens uma conta?'}
        </p>
        <button 
          onClick={() => setIsLogin(!isLogin)} 
          style={{ background: 'transparent', color: '#2563eb', border: 'none', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px' }}
        >
          {isLogin ? 'Regista-te aqui' : 'Inicia sessão aqui'}
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
   COMPONENTE DE GESTÃO E PERSONALIZAÇÃO DO CANAL
------------------------------------------------------------- */
function ChannelManagementTab({ channelData, setChannelData, videos, setActiveVideo, setCurrentTab }) {
  const [viewMode, setViewMode] = useState('public');
  const [name, setName] = useState(channelData.name);
  const [description, setDescription] = useState(channelData.description);
  const [avatarPreview, setAvatarPreview] = useState(channelData.avatar);
  const [bannerPreview, setBannerPreview] = useState(channelData.banner);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBannerPreview(url);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    setChannelData({ 
      ...channelData, 
      name, 
      description,
      avatar: avatarPreview,
      banner: bannerPreview
    });
    setViewMode('public');
    alert('Canal e imagens atualizados com sucesso!');
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
                  <h4>{video.title}</h4>
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
              {avatarPreview && (
                <div>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0' }}>Pré-visualização:</p>
                  <img src={avatarPreview} alt="Preview Avatar" style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover' }} />
                </div>
              )}
            </div>

            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>🎨 Carregar Capa / Banner do Canal:</label>
              <input type="file" accept="image/*" onChange={handleBannerChange} style={{ marginBottom: '10px' }} />
              {bannerPreview && (
                <div>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0' }}>Pré-visualização:</p>
                  <img src={bannerPreview} alt="Preview Banner" style={{ width: '100%', height: '100px', borderRadius: '6px', objectFit: 'cover' }} />
                </div>
              )}
            </div>

            <button type="submit" style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
              Guardar Alterações do Canal
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------
   RESTANTES COMPONENTES (COMENTÁRIOS, ANALYTICS, SHORTS, ETC.)
------------------------------------------------------------- */
function CommentsSection({ videoId, token, userName }) {
  const [commentText, setCommentText] = useState('');
  const [mbwayPhone, setMbwayPhone] = useState('');
  const [superChatAmount, setSuperChatAmount] = useState('');
  const [comments, setComments] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/comments/${videoId}`)
      .then(res => setComments(res.data))
      .catch(() => console.log('Erro ao carregar comentários.'));
  }, [videoId]);

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!token) return alert('Faça login para comentar!');

    try {
      const res = await axios.post(`${API_URL}/comments`, { videoId, text: commentText, userName }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setComments([...comments, res.data]);
      setCommentText('');
    } catch (err) {
      alert('Erro ao guardar comentário.');
    }
  };

  const handleSendSuperChat = async (e) => {
    e.preventDefault();
    if (!token) return alert('Faça login para enviar um Super Chat!');
    if (!superChatAmount || !mbwayPhone) return alert('Preencha o valor e o número MB WAY.');

    try {
      const res = await axios.post(`${API_URL}/payments/superchat`, {
        videoId,
        amount: superChatAmount,
        message: commentText,
        phoneNumber: mbwayPhone,
        userName
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      alert(res.data.message);
      setComments([...comments, res.data.comment]);
      setCommentText('');
      setSuperChatAmount('');
      setMbwayPhone('');
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao processar MB WAY.');
    }
  };

  return (
    <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
      <h4>Comentários e Super Chats MB WAY ({comments.length})</h4>
      
      <form onSubmit={handleSendComment} style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <input type="text" placeholder="Escreva um comentário público..." value={commentText} onChange={e => setCommentText(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
        <button type="submit" style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Enviar</button>
      </form>

      <div style={{ background: '#f0fdf4', border: '1px solid #86efac', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h5 style={{ margin: '0 0 10px 0', color: '#166534' }}>💸 Apoiar Criador com Super Chat (MB WAY)</h5>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input type="number" placeholder="Valor €" value={superChatAmount} onChange={e => setSuperChatAmount(e.target.value)} style={{ width: '100px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          <input type="tel" placeholder="Nº Telemóvel MB WAY" value={mbwayPhone} onChange={e => setMbwayPhone(e.target.value)} style={{ width: '180px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          <button onClick={handleSendSuperChat} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            Pagar com MB WAY
          </button>
        </div>
      </div>

      {comments.map((c) => (
        <div key={c.id || Math.random()} style={{ fontSize: '13px', marginBottom: '8px', background: c.isSuperChat ? '#fef08a' : '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <strong>{c.userName}:</strong> {c.text}
        </div>
      ))}
    </div>
  );
}

function AnalyticsTab({ videos, handleDeleteVideo }) {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', background: '#fff', padding: '30px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
      <h2>📊 Painel de Criador & Analytics</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', margin: '20px 0' }}>
        <div style={{ background: '#f1f5f9', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ margin: 0, color: '#2563eb' }}>{videos.length}</h3>
          <p style={{ margin: '5px 0 0 0', color: '#64748b' }}>Vídeos Publicados</p>
        </div>
        <div style={{ background: '#f1f5f9', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ margin: 0, color: '#16a34a' }}>1.25K</h3>
          <p style={{ margin: '5px 0 0 0', color: '#64748b' }}>Subscritores Totais</p>
        </div>
        <div style={{ background: '#f1f5f9', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ margin: 0, color: '#dc2626' }}>€132.50</h3>
          <p style={{ margin: '5px 0 0 0', color: '#64748b' }}>Receita Estimada</p>
        </div>
      </div>

      <h3>Gestão de Conteúdo</h3>
      <div style={{ marginTop: '15px' }}>
        {videos.map(v => (
          <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #e2e8f0' }}>
            <div>
              <strong>{v.title}</strong>
              <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '10px' }}>({v.category})</span>
            </div>
            <button onClick={() => handleDeleteVideo(v.id)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShortsTab({ shortsList }) {
  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', color: '#0f172a' }}>📱 VideoTube Shorts</h2>
      {shortsList.map((short) => (
        <div key={short.id} style={{ background: '#000', borderRadius: '16px', overflow: 'hidden', height: '600px', position: 'relative', marginBottom: '30px' }}>
          <video src={short.url} controls autoPlay loop style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', bottom: '20px', left: '15px', color: '#fff' }}>
            <h4 style={{ margin: '0 0 5px 0' }}>@{short.channel}</h4>
            <p style={{ margin: 0, fontSize: '14px' }}>{short.title}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function LiveTab() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', background: '#fff', padding: '30px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
      <h2>🔴 Estúdio de Transmissão ao Vivo (RTMP)</h2>
      <div style={{ width: '100%', height: '400px', background: '#0f172a', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', marginTop: '20px' }}>
        <h3>A aguardar sinal do OBS Studio...</h3>
        <p style={{ color: '#94a3b8' }}>Servidor RTMP ativo na porta 1935.</p>
      </div>
      <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '8px', marginTop: '20px' }}>
        <p><strong>Servidor RTMP:</strong> <code>rtmp://localhost:1935/live</code></p>
        <p><strong>Chave de Stream:</strong> <code>pets_fofuras_live_key</code></p>
      </div>
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
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      setVideos([res.data.video, ...videos]);
      alert('Vídeo publicado com sucesso!');
      setCurrentTab('home');
    } catch (err) {
      alert('Erro ao enviar vídeo.');
    }
  };

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto', background: '#fff', padding: '30px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
      <h2>📤 Creator Studio (Upload)</h2>
      <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
        <input type="text" placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
        <textarea placeholder="Descrição" value={description} onChange={e => setDescription(e.target.value)} rows="3" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}></textarea>
        <input type="text" placeholder="Tags (ex: pets, gaming)" value={tags} onChange={e => setTags(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
        <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
          {categories.filter(c => c !== 'Todos').map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files[0])} required />
        <button type="submit" style={{ background: '#ef4444', color: '#fff', padding: '12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Publicar Vídeo</button>
      </form>
    </div>
  );
}

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
    } catch (err) {
      alert('Erro no levantamento.');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', background: '#fff', padding: '30px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
      <h2>💰 Monetização & Payouts</h2>
      <div style={{ background: '#16a34a', color: '#fff', padding: '20px', borderRadius: '10px', margin: '20px 0', textAlign: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '24px' }}>Saldo Disponível: €132.50</h3>
      </div>
      <form onSubmit={handlePayout} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
        <select value={payoutMethod} onChange={e => setPayoutMethod(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
          <option value="paypal">PayPal</option>
          <option value="iban">Stripe IBAN / Banco</option>
        </select>
        <input type="text" value={destination} onChange={e => setDestination(e.target.value)} placeholder="Email PayPal ou IBAN" required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} min="1" max="132.50" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
        <button type="submit" style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Solicitar Levantamento</button>
      </form>
    </div>
  );
}