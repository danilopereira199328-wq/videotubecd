const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// Configuração do Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuração do Multer com Cloudinary para Upload Directo na Nuvem
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'videotube_uploads',
    resource_type: 'auto'
  }
});
const upload = multer({ storage: storage });

const SECRET_KEY = process.env.JWT_SECRET || 'videotube_secret_key_2026';

let videos = [];
let comments = [];
let users = [];

// Middleware de Autenticação
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Acesso negado.' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido.' });
    req.user = user;
    next();
  });
}

// 📤 Rota de Upload Directo para a Nuvem (Cloudinary)
app.post('/api/upload', authenticateToken, upload.single('video'), (req, res) => {
  try {
    const { title, description, category, tags } = req.body;
    const videoUrl = req.file ? req.file.path : 'https://www.w3schools.com/html/mov_bbb.mp4';

    const newVideo = {
      id: Date.now().toString(),
      title,
      description,
      category: category || 'Geral',
      tags: tags || '',
      url: videoUrl,
      channel: req.user.name || 'Criador VideoTube',
      viewsCount: 0,
      likes: 0,
      dislikes: 0,
      createdAt: new Date()
    };

    videos.unshift(newVideo);
    io.emit('newVideoNotification', { message: `Novo vídeo publicado: ${title}` });

    res.status(201).json({ message: 'Vídeo publicado na nuvem com sucesso!', video: newVideo });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao processar upload na nuvem.' });
  }
});

// 💬 Rota de Comentários em Tempo Real
app.post('/api/comments', authenticateToken, (req, res) => {
  const { videoId, text, userName } = req.body;
  if (!text || !videoId) return res.status(400).json({ error: 'Dados inválidos.' });

  const newComment = {
    id: Date.now().toString(),
    videoId,
    userName: userName || req.user.email,
    text,
    createdAt: new Date()
  };

  comments.unshift(newComment);
  io.emit('newComment', newComment);

  res.status(201).json(newComment);
});

app.get('/api/comments/:videoId', (req, res) => {
  const videoComments = comments.filter(c => c.videoId === req.params.videoId);
  res.json(videoComments);
});

// Autenticação básica de exemplo
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now().toString(), name, email, password: hashedPassword };
    users.push(newUser);
    res.status(201).json({ message: 'Utilizador registado com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro no registo.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user) return res.status(400).json({ error: 'Utilizador não encontrado.' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Palavra-passe incorreta.' });

    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, SECRET_KEY);
    res.json({ token, user: { name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Erro no login.' });
  }
});

io.on('connection', (socket) => {
  console.log('Cliente ligado via WebSocket:', socket.id);
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Servidor de Produção a correr na porta ${PORT}`);
});