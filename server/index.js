import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'database.json');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// DB 로드 / 저장 헬퍼
const readDB = () => {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const initDB = { challengeLeaderboard: [], users: {} };
      fs.writeFileSync(DB_PATH, JSON.stringify(initDB, null, 2), 'utf-8');
      return initDB;
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database.json:', err);
    return { challengeLeaderboard: [], users: {} };
  }
};

const writeDB = (dbData) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(dbData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing database.json:', err);
  }
};

// 1. Health Check API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// 2. Leaderboard 조회 API (GET /api/leaderboard?sort=time|score)
app.get('/api/leaderboard', (req, res) => {
  const db = readDB();
  const sortType = req.query.sort || 'score';
  let list = [...(db.challengeLeaderboard || [])];

  if (sortType === 'time') {
    // 완주시간 순 (오름차순: 빠른 시간 우선)
    list.sort((a, b) => a.clearTime - b.clearTime);
  } else {
    // 점수 순 (내림차순: 높은 점수 우선)
    list.sort((a, b) => b.score - a.score);
  }

  // TOP 10 반환
  res.json({
    sort: sortType,
    leaderboard: list.slice(0, 10)
  });
});

// 3. 도전 모드 점수/기록 등록 API (POST /api/score/challenge)
app.post('/api/score/challenge', (req, res) => {
  const { country, nickname, clearTime, score } = req.body;

  if (!nickname) {
    return res.status(400).json({ error: 'Nickname is required' });
  }

  const db = readDB();
  if (!db.challengeLeaderboard) db.challengeLeaderboard = [];

  const newEntry = {
    id: Date.now(),
    country: country || 'KR',
    nickname: nickname.trim().substring(0, 14),
    clearTime: Number(clearTime) || 0,
    score: Math.floor(Number(score) || 0),
    date: new Date().toISOString().split('T')[0]
  };

  db.challengeLeaderboard.push(newEntry);
  writeDB(db);

  console.log(`[LEADERBOARD NEW ENTRY] ${newEntry.nickname} (${newEntry.country}): Score=${newEntry.score}, Time=${newEntry.clearTime}s`);
  res.json({ success: true, entry: newEntry });
});

// 4. 유저 프로필 및 스펙 저장 API (POST /api/user/profile)
app.post('/api/user/profile', (req, res) => {
  const { userId, nickname, country, coins, unlockedChars, personalBest } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const db = readDB();
  if (!db.users) db.users = {};

  db.users[userId] = {
    nickname: nickname || 'SkiRider',
    country: country || 'KR',
    coins: coins || 0,
    unlockedChars: unlockedChars || ['skier'],
    personalBest: personalBest || { highScore: 0, fastestTime: 0 },
    updatedAt: new Date().toISOString()
  };

  writeDB(db);
  res.json({ success: true, user: db.users[userId] });
});

app.listen(PORT, () => {
  console.log(`🚀 Ski 3D Leaderboard Express Server is running on http://localhost:${PORT}`);
});
