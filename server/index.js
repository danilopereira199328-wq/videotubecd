// server/index.js
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import ffmpeg from 'fluent-ffmpeg';
import { v4 as uuidv4 } from 'uuid';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Pastas de trabalho ───────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const HLS_DIR = path.join(__dirname, 'hls');

[UPLOADS_DIR, HLS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ─── Middlewares ──────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Servir os segmentos HLS de forma estática
app.use(
  '/hls',
  express.static(HLS_DIR, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.m3u8')) {
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      } else if (filePath.endsWith('.ts')) {
        res.setHeader('Content-Type', 'video/mp2t');
      }
      res.setHeader('Access-Control-Allow-Origin', '*');
    },
  })
);

// ─── Upload com Multer ────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp4';
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['video/mp4', 'video/quicktime', 'video/x-matroska', 'video/webm'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Formato não suportado. Envia MP4, MOV, MKV ou WebM.'));
  },
});

// ─── Função: transcodificar para HLS ──────────────────────────────────
function transcodeToHls(inputPath, outputDir) {
  return new Promise((resolve, reject) => {
    const playlistPath = path.join(outputDir, 'index.m3u8');

    ffmpeg(inputPath)
      .outputOptions([
        // Vídeo — H.264 baseline para máxima compatibilidade
        '-c:v libx264',
        '-profile:v baseline',
        '-level 3.0',
        '-preset veryfast',
        '-crf 23',
        '-vf scale=-2:720', // 720p
        '-g 48',            // keyframe a cada 2s @24fps
        '-keyint_min 48',
        '-sc_threshold 0',

        // Áudio
        '-c:a aac',
        '-b:a 128k',
        '-ac 2',

        // HLS
        '-f hls',
        '-hls_time 6',
        '-hls_playlist_type vod',
        '-hls_segment_filename',
        path.join(outputDir, 'segment_%03d.ts'),
      ])
      .output(playlistPath)
      .on('start', (cmd) => console.log('[FFmpeg] Comando:', cmd))
      .on('progress', (p) => {
        if (p.percent) console.log(`[FFmpeg] Progresso: ${p.percent.toFixed(1)}%`);
      })
      .on('end', () => {
        console.log('[FFmpeg] Transcodificação concluída.');
        resolve(playlistPath);
      })
      .on('error', (err) => {
        console.error('[FFmpeg] Erro:', err.message);
        reject(err);
      })
      .run();
  });
}

// ─── Rota: /api/upload ────────────────────────────────────────────────
app.post('/api/upload', upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum ficheiro recebido.' });
  }

  const inputPath = req.file.path;
  const videoId = uuidv4();
  const outputDir = path.join(HLS_DIR, videoId);

  try {
    fs.mkdirSync(outputDir, { recursive: true });

    await transcodeToHls(inputPath, outputDir);

    // Apagar o ficheiro temporário original
    fs.unlink(inputPath, (err) => {
      if (err) console.warn('[Cleanup] Não foi possível apagar o upload:', err.message);
    });

    // Devolver a URL pública do playlist
    const hlsUrl = `${req.protocol}://${req.get('host')}/hls/${videoId}/index.m3u8`;

    res.json({
      success: true,
      videoId,
      hlsUrl,
    });
  } catch (err) {
    console.error('[Upload] Falha:', err);
    // Limpar lixo em caso de erro
    fs.rm(outputDir, { recursive: true, force: true }, () => {});
    fs.unlink(inputPath, () => {});
    res.status(500).json({ error: 'Falha ao processar o vídeo.' });
  }
});

// ─── Rota: healthcheck ────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ─── Handler de erros (ex.: ficheiro demasiado grande) ────────────────
app.use((err, _req, res, _next) => {
  console.error('[Erro global]', err.message);
  res.status(400).json({ error: err.message });
});

// ─── Arranque ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Servidor a correr em http://localhost:${PORT}`);
  console.log(`   Uploads: ${UPLOADS_DIR}`);
  console.log(`   HLS:     ${HLS_DIR}`);
});