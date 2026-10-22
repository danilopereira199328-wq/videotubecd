const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const ffmpeg = require('fluent-ffmpeg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const NodeMediaServer = require('node-media-server');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || 'videotube_secret_key_2026';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

const dbFile = path.join(__dirname, 'users.json');
const videosFile = path.join(__dirname, 'videos.json');
const commentsFile = path.join(__dirname, 'comments.json');

if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, JSON.stringify([]));
if (!fs.existsSync(videosFile)) fs.writeFileSync(videosFile, JSON.stringify([]));
if (!fs.existsSync(commentsFile)) fs.writeFileSync(commentsFile, JSON.stringify([]));

const readUsers = () => JSON.parse(fs.readFileSync(dbFile, 'utf8'));
const writeUsers = (users) => fs.writeFileSync(dbFile, JSON.stringify(users, null, 2));

const readVideos = () => JSON.parse(fs.readFileSync(videosFile, 'utf8'));
const writeVideos = (videos) => fs.writeFileSync(videosFile, JSON.stringify(videos, null, 2));

const readComments = () => JSON.parse(fs.readFileSync(commentsFile, 'utf8'));
const writeComments = (comments) => fs.writeFileSync(commentsFile, JSON.stringify(comments, null, 2));

// Servidor RTMP
const nmsConfig = {
  rtmp: { port: 1935, chunk_size: 60000, gop_cache: true, ping: 30, ping_timeout: 60 },
  http: { port: 8000, allow_origin: '*', mediaroot: './media' }
};
const nms = new NodeMediaServer(nmsConfig);
nms.run();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido ou expirado.' });
    req.user = user;
    next();
  });
};

// WebSockets para Notificações em Tempo Real
io.on('connection', (socket) => {
  console.log('Cliente ligado via WebSocket:', socket.id);
  socket.on('disconnect', () => console.log('Cliente desligado'));
});

// Autenticação
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Preencha todos os campos.' });

    const users = readUsers();
    if (users.find(u => u.email === email)) return res.status(400).json({ error: 'Email já registado.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: uuidv4(), name, email, password: hashedPassword, subscriptions: [], history: [], payouts: [] };
    users.push(newUser);
    writeUsers(users);

    res.status(201).json({ message: 'Conta criada com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = readUsers();
    const user = users.find(u => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, subscriptions: user.subscriptions || [] } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Subscrições
app.post('/api/subscribe', authenticateToken, (req, res) => {
  try {
    const { channelName } = req.body;
    const users = readUsers();
    const user = users.find(u => u.id === req.user.userId);
    if (!user.subscriptions) user.subscriptions = [];

    const idx = user.subscriptions.indexOf(channelName);
    let isSubscribed = false;
    if (idx === -1) {
      user.subscriptions.push(channelName);
      isSubscribed = true;
    } else {
      user.subscriptions.splice(idx, 1);
    }
    writeUsers(users);
    res.json({ isSubscribed, subscriptions: user.subscriptions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Algoritmo de Recomendações e Tendências
app.get('/api/videos/recommendations', (req, res) => {
  try {
    const videos = readVideos();
    const comments = readComments();

    const rankedVideos = videos.map(video => {
      let score = 0;
      const videoComments = comments.filter(c => c.videoId === video.id).length;
      
      score += (video.likes || 0) * 5;
      score += (video.viewsCount || 0) * 2;
      score += videoComments * 4;

      return { ...video, score };
    });

    rankedVideos.sort((a, b) => b.score - a.score);
    res.json(rankedVideos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lista Geral de Vídeos
app.get('/api/videos', (req, res) => {
  try {
    let videos = readVideos();
    const { sortBy } = req.query;

    if (sortBy === 'date') {
      videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'views') {
      videos.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
    }

    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Likes
app.post('/api/videos/:id/like', authenticateToken, (req, res) => {
  try {
    const videos = readVideos();
    const video = videos.find(v => v.id === req.params.id);
    if (!video) return res.status(404).json({ error: 'Vídeo não encontrado.' });

    video.likes = (video.likes || 0) + 1;
    writeVideos(videos);
    res.json({ likes: video.likes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Comentários Persistentes
app.get('/api/comments/:videoId', (req, res) => {
  try {
    const comments = readComments();
    res.json(comments.filter(c => c.videoId === req.params.videoId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/comments', authenticateToken, (req, res) => {
  try {
    const { videoId, text, userName } = req.body;
    if (!text || !videoId) return res.status(400).json({ error: 'Comentário inválido.' });

    const comments = readComments();
    const newComment = {
      id: uuidv4(),
      videoId,
      userName: userName || req.user.email,
      text,
      createdAt: new Date().toISOString()
    };

    comments.push(newComment);
    writeComments(comments);

    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pagamento de Super Chat (MB WAY)
app.post('/api/payments/superchat', authenticateToken, (req, res) => {
  try {
    const { videoId, amount, message, phoneNumber, userName } = req.body;
    if (!amount || amount <= 0 || !phoneNumber) return res.status(400).json({ error: 'Dados de MB WAY inválidos.' });

    const comments = readComments();
    const superChatComment = {
      id: uuidv4(),
      videoId,
      userName: userName || req.user.email,
      text: `💰 SUPER CHAT (€${parseFloat(amount).toFixed(2)}): ${message}`,
      isSuperChat: true,
      amount: parseFloat(amount),
      createdAt: new Date().toISOString()
    };

    comments.push(superChatComment);
    writeComments(comments);

    io.emit('superChatNotification', superChatComment);

    res.json({
      success: true,
      message: `Notificação MB WAY enviada para o número ${phoneNumber}. Confirme o pagamento na app MB WAY!`,
      comment: superChatComment
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload de Vídeo
app.post('/api/upload', authenticateToken, upload.single('video'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Ficheiro não recebido.' });

    const { title, description, tags, category } = req.body;
    const newVideo = {
      id: uuidv4(),
      title: title || 'Vídeo sem título',
      description: description || '',
      tags: tags || '',
      category: category || 'Geral',
      url: `http://localhost:${PORT}/uploads/${req.file.filename}`,
      channel: req.user.email,
      viewsCount: 1,
      likes: 0,
      createdAt: new Date().toISOString()
    };

    const videos = readVideos();
    videos.unshift(newVideo);
    writeVideos(videos);

    io.emit('newVideoNotification', {
      title: newVideo.title,
      channel: newVideo.channel,
      message: `O canal ${newVideo.channel} acabou de publicar: "${newVideo.title}"!`
    });

    res.json({ message: 'Vídeo publicado com sucesso!', video: newVideo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar Vídeo
app.delete('/api/videos/:id', authenticateToken, (req, res) => {
  try {
    let videos = readVideos();
    const index = videos.findIndex(v => v.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Vídeo não encontrado.' });

    videos.splice(index, 1);
    writeVideos(videos);
    res.json({ message: 'Vídeo removido!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Payouts
app.post('/api/monetization/payout', authenticateToken, (req, res) => {
  try {
    const { payoutMethod, destination, amount } = req.body;
    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === req.user.userId);
    if (userIndex === -1) return res.status(404).json({ error: 'Utilizador não encontrado.' });

    if (!users[userIndex].payouts) users[userIndex].payouts = [];
    const payoutRecord = { id: uuidv4(), method: payoutMethod, destination, amount: parseFloat(amount), date: new Date().toISOString() };

    users[userIndex].payouts.push(payoutRecord);
    writeUsers(users);

    res.json({ message: `Levantamento de €${parseFloat(amount).toFixed(2)} solicitado com sucesso!`, payout: payoutRecord });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

server.listen(PORT, () => console.log(`Servidor ativo na porta ${PORT}`));