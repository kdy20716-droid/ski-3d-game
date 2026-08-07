// ────────────────────────────────────────────────────────
// 🏆 SNOWFALL 3D - Firebase Realtime Database & Express Server Module
// ────────────────────────────────────────────────────────
import { getFlagEmoji } from './i18n.js?v=14.0.0';

// Firebase Realtime Database Web SDK (v10 Modular CDN imports)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { 
  getDatabase, ref, push, get, child
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';

// ⚙️ 유저 실제 파이어베이스 프로젝트 & 싱가포르 Realtime Database URL 연동!
const firebaseConfig = {
  apiKey: "AIzaSyD1QIETWAlLJZHOeQ1jzCIx96XhF5JjtU4",
  authDomain: "ski-3d-game.firebaseapp.com",
  databaseURL: "https://ski-3d-game-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ski-3d-game",
  storageBucket: "ski-3d-game.firebasestorage.app",
  messagingSenderId: "513558276883",
  appId: "1:513558276883:web:04509768f9115a29b308e6",
  measurementId: "G-0QSMX43RSX"
};

let rtdb = null;
let useFirebase = false;

// 파이어베이스 Realtime Database 초기화 시도
try {
  const app = initializeApp(firebaseConfig);
  rtdb = getDatabase(app);
  useFirebase = true;
  console.log('[Leaderboard] Firebase Realtime Database (Singapore) initialized successfully!');
} catch (err) {
  console.warn('[Leaderboard] Firebase init fallback to Local Express API (localhost:5000):', err);
  useFirebase = false;
}

const LOCAL_API_URL = 'http://localhost:5000/api';

// 1. 리더보드 조회 (sortType: 'score' | 'time')
export const fetchLeaderboardData = async (sortType = 'score') => {
  if (useFirebase && rtdb) {
    try {
      const dbRef = ref(rtdb);
      const snapshot = await get(child(dbRef, 'leaderboard'));
      if (snapshot.exists()) {
        const dataObj = snapshot.val();
        const list = Object.keys(dataObj).map(key => ({ id: key, ...dataObj[key] }));
        
        if (sortType === 'time') {
          list.sort((a, b) => (Number(a.clearTime) || 0) - (Number(b.clearTime) || 0));
        } else {
          list.sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));
        }
        return { sort: sortType, leaderboard: list.slice(0, 10) };
      }
    } catch (firebaseErr) {
      console.warn('[Leaderboard] Firebase RTDB fetch failed, falling back to local server:', firebaseErr);
    }
  }

  // 🔄 Local Express Server Fallback
  try {
    const res = await fetch(`${LOCAL_API_URL}/leaderboard?sort=${sortType}`);
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (localErr) {
    console.warn('[Leaderboard] Local Express server not available, using offline default mockup:', localErr);
  }

  // 📌 오프라인 상태 빈 순위 데이터 (초기 상태)
  const fallbackData = [];
  return { sort: sortType, leaderboard: fallbackData };
};

// 2. 점수/기록 등록 (POST)
export const submitLeaderboardScoreData = async (entryData) => {
  const payload = {
    country: entryData.country || 'KR',
    nickname: (entryData.nickname || 'SkiRider').trim().substring(0, 14),
    clearTime: Number(entryData.clearTime) || 0,
    score: Math.floor(Number(entryData.score) || 0),
    date: new Date().toISOString().split('T')[0],
    timestamp: Date.now()
  };

  let saved = false;

  // Firebase Realtime Database 저장 시도
  if (useFirebase && rtdb) {
    try {
      const scoresRef = ref(rtdb, 'leaderboard');
      await push(scoresRef, payload);
      saved = true;
      console.log('[Leaderboard] Successfully saved to Firebase Realtime Database!');
    } catch (err) {
      console.warn('[Leaderboard] Firebase RTDB push failed:', err);
    }
  }

  // Express 로컬 서버 동시 저장 시도
  try {
    const res = await fetch(`${LOCAL_API_URL}/score/challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) saved = true;
  } catch (err) {
    console.warn('[Leaderboard] Express server save failed:', err);
  }

  return saved;
};
