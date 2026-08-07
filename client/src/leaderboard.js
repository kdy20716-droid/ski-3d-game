// ────────────────────────────────────────────────────────
// 🏆 SNOWFALL 3D - Firebase & Express Server Leaderboard API Module
// ────────────────────────────────────────────────────────
import { getFlagEmoji } from './i18n.js?v=13.0.0';

// Firebase Firestore Web SDK (Modular CDN imports)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { 
  getFirestore, collection, addDoc, getDocs, query, orderBy, limit 
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// ⚙️ Firebase 프로젝트 기본 설정 (본인의 Firebase Config가 있다면 언제든 교체 가능)
const firebaseConfig = {
  apiKey: "AIzaSyDemoSki3DAvalancheKey12345678",
  authDomain: "ski-3d-game.firebaseapp.com",
  projectId: "ski-3d-game",
  storageBucket: "ski-3d-game.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:demo12345678"
};

let db = null;
let useFirebase = false;

// Firebase 초기화 시도 (네트워크 또는 설정 비활성 시 로컬 Express API로 자동 폴백)
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  useFirebase = true;
  console.log('[Leaderboard] Firebase Firestore initialized successfully!');
} catch (err) {
  console.warn('[Leaderboard] Firebase init fallback to Local Express API (localhost:5000):', err);
  useFirebase = false;
}

const LOCAL_API_URL = 'http://localhost:5000/api';

// 1. 리더보드 조회 (sortType: 'score' | 'time')
export const fetchLeaderboardData = async (sortType = 'score') => {
  if (useFirebase && db) {
    try {
      const lbCol = collection(db, 'leaderboard');
      const qField = sortType === 'time' ? 'clearTime' : 'score';
      const qDir = sortType === 'time' ? 'asc' : 'desc';
      const q = query(lbCol, orderBy(qField, qDir), limit(10));
      const snapshot = await getDocs(q);
      const list = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      if (list.length > 0) return { sort: sortType, leaderboard: list };
    } catch (firebaseErr) {
      console.warn('[Leaderboard] Firebase query failed, falling back to local server:', firebaseErr);
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

  // 📌 오프라인 상태 백업 샘플 데이터
  const fallbackData = [
    { country: 'KR', nickname: '알프스스키왕', clearTime: 412.5, score: 48500 },
    { country: 'US', nickname: 'AlpineRider', clearTime: 435.0, score: 42100 },
    { country: 'JP', nickname: 'YukiMaster', clearTime: 460.2, score: 39500 },
    { country: 'FR', nickname: 'ChamonixPro', clearTime: 482.0, score: 36000 },
    { country: 'CN', nickname: 'SnowKing88', clearTime: 510.4, score: 31200 },
  ];

  if (sortType === 'time') {
    fallbackData.sort((a, b) => a.clearTime - b.clearTime);
  } else {
    fallbackData.sort((a, b) => b.score - a.score);
  }

  return { sort: sortType, leaderboard: fallbackData };
};

// 2. 점수/기록 등록 (POST)
export const submitLeaderboardScoreData = async (entryData) => {
  const payload = {
    country: entryData.country || 'KR',
    nickname: (entryData.nickname || 'SkiRider').trim().substring(0, 14),
    clearTime: Number(entryData.clearTime) || 0,
    score: Math.floor(Number(entryData.score) || 0),
    date: new Date().toISOString().split('T')[0]
  };

  let saved = false;

  // Firebase 저장 시도
  if (useFirebase && db) {
    try {
      await addDoc(collection(db, 'leaderboard'), payload);
      saved = true;
      console.log('[Leaderboard] Successfully saved to Firebase Firestore!');
    } catch (err) {
      console.warn('[Leaderboard] Firebase addDoc failed:', err);
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
