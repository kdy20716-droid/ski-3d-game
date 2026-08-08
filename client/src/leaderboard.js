// ────────────────────────────────────────────────────────
// 🏆 SNOWFALL 3D - Pure Firebase Realtime Database Module
// ────────────────────────────────────────────────────────
import { getFlagEmoji } from './i18n.js?v=32.0.0';

// Firebase Realtime Database Web SDK (v10 Modular CDN imports)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { 
  getDatabase, ref, push, get, child
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';

// ⚙️ 유저 실제 파이어베이스 프로젝트 & 싱가포르 Realtime Database 연동
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
  console.log('[Leaderboard] Pure Firebase Realtime Database (Singapore Cloud) Ready!');
} catch (err) {
  console.warn('[Leaderboard] Firebase init failed:', err);
  useFirebase = false;
}

// 1. 순위 리더보드 조회 (sortType: 'time' | 'score')
export const fetchLeaderboardData = async (sortType = 'time') => {
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
      console.warn('[Leaderboard] Firebase fetch failed:', firebaseErr);
    }
  }

  // 📌 랭킹 데이터가 비어있을 때 반환하는 초기 빈 배열
  return { sort: sortType, leaderboard: [] };
};

// 2. 완주 클리어 점수/기록 등록 (POST)
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

  // 순수 Firebase Realtime Database 구글 클라우드 서버로 실시간 등록!
  if (useFirebase && rtdb) {
    try {
      const scoresRef = ref(rtdb, 'leaderboard');
      await push(scoresRef, payload);
      saved = true;
      console.log('[Leaderboard] Successfully registered record to Firebase Cloud!');
    } catch (err) {
      console.warn('[Leaderboard] Firebase RTDB push failed:', err);
    }
  }

  return saved;
};
