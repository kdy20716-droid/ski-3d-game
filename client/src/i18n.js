// 🌐 다국어 (i18n) 및 국적 Flag 매핑 매니저

export const FLAGS = {
  KR: { name: '대한민국 (Korea)', flag: '🇰🇷', lang: 'ko' },
  US: { name: 'USA (United States)', flag: '🇺🇸', lang: 'en' },
  JP: { name: '日本 (Japan)', flag: '🇯🇵', lang: 'ja' },
  CN: { name: '中国 (China)', flag: '🇨🇳', lang: 'zh' },
  FR: { name: 'France', flag: '🇫🇷', lang: 'fr' },
};

const TRANSLATIONS = {
  en: {
    title: '3D SKI AVALANCHE',
    subTitle: 'ESCAPE THE AVALANCHE! HIGH-SPEED ALPINE DESCENT',
    start: 'PLAY GAME',
    leaderboard: 'LEADERBOARD',
    characters: 'CHARACTERS',
    profile: 'PROFILE / LANG',
    challengeMode: 'CHALLENGE MODE',
    customMode: 'CUSTOM MODE',
    challengeDesc: 'Default spec fixed. Score registered to Global Leaderboard!',
    customDesc: 'Ride with your upgraded character. Personal record only.',
    fastestTime: 'Fastest Time ⏱️',
    highScore: 'High Score ⭐',
    rank: 'Rank',
    flag: 'Flag',
    nickname: 'Player',
    time: 'Clear Time',
    score: 'Score',
    date: 'Date',
    boostText: 'INSTANT BOOST! ⚡',
    rampBoost: 'RAMP BOOST! +5s 🚀',
    driftBoost: 'DRIFT BOOST! ⚡',
    gameOver: 'AVALANCHE OVERTOOK YOU!',
    retry: 'TRY AGAIN',
    stage: 'STAGE',
    close: 'CLOSE',
    save: 'SAVE PROFILE',
  },
  ko: {
    title: '3D 스키 아발란체',
    subTitle: '산사태를 탈출하라! 목숨을 건 초고속 스키 탈출',
    start: '게임 시작',
    leaderboard: '글로벌 랭킹',
    characters: '캐릭터 & 스펙',
    profile: '프로필 / 언어',
    challengeMode: '🏆 도전 모드 (공정 실력)',
    customMode: '⭐ 자신만의 모드 (스펙 업)',
    challengeDesc: '기본 스펙 고정 주행. 완주 기록이 글로벌 랭킹 서버에 정식 등록됩니다!',
    customDesc: '해금/업그레이드한 내 캐릭터로 자유 주행. 본인 개인 기록에 저장됩니다.',
    fastestTime: '완주 시간 순 ⏱️',
    highScore: '최고 점수 순 ⭐',
    rank: '순위',
    flag: '국적',
    nickname: '선수명',
    time: '완주 시간',
    score: '점수',
    date: '달성일',
    boostText: '순간 부스터! ⚡',
    rampBoost: '점프대 5초 부스터! 🚀',
    driftBoost: '드리프트 부스트! ⚡',
    gameOver: '산사태에 삼켜졌습니다!',
    retry: '다시 도전',
    stage: '스테이지',
    close: '닫기',
    save: '프로필 저장',
  },
  ja: {
    title: '3D スキーアバランチ',
    subTitle: '雪崩から脱出せよ！命がけの超高速滑走',
    start: 'ゲーム開始',
    leaderboard: 'ランキング',
    characters: 'キャラ＆スペック',
    profile: 'プロフィール/言語',
    challengeMode: '🏆 チャレンジモード',
    customMode: '⭐ カスタムモード',
    challengeDesc: '基本スペック固定。公式世界ランキングに記録が登録されます！',
    customDesc: 'アップグレードしたキャラで自由に滑走。個人記録に保存されます。',
    fastestTime: 'タイム順 ⏱️',
    highScore: 'スコア順 ⭐',
    rank: '順位',
    flag: '国籍',
    nickname: 'プレイヤー',
    time: 'タイム',
    score: 'スコア',
    date: '日付',
    boostText: '瞬間ブースター！ ⚡',
    rampBoost: 'ジャンプ5秒ブースト！ 🚀',
    driftBoost: 'ドリフトブースト！ ⚡',
    gameOver: '雪崩に飲み込まれた！',
    retry: '再挑戦',
    stage: 'ステージ',
    close: '閉じる',
    save: '保存',
  },
  zh: {
    title: '3D 极限雪崩滑雪',
    subTitle: '逃离雪崩！生死一瞬的极速滑雪',
    start: '开始游戏',
    leaderboard: '全球排行榜',
    characters: '角色与属性',
    profile: '个人资料/语言',
    challengeMode: '🏆 挑战模式',
    customMode: '⭐ 自定义模式',
    challengeDesc: '基础属性固定，成绩上传至全球排行榜！',
    customDesc: '使用已升级的角色自由滑雪，保存至个人最佳纪录。',
    fastestTime: '用时排序 ⏱️',
    highScore: '积分排序 ⭐',
    rank: '排名',
    flag: '国籍',
    nickname: '选手',
    time: '用时',
    score: '积分',
    date: '日期',
    boostText: '瞬间加速！ ⚡',
    rampBoost: '跳台5秒加速！ 🚀',
    driftBoost: '漂移加速！ ⚡',
    gameOver: '已被雪崩吞没！',
    retry: '重新开始',
    stage: '关卡',
    close: '关闭',
    save: '保存资料',
  },
  fr: {
    title: '3D SKI AVALANCHE',
    subTitle: "ÉCHAPPEZ À L'AVALANCHE! DESCENTE DE SURVIE",
    start: 'JOUER',
    leaderboard: 'CLASSEMENT',
    characters: 'PERSONNAGES',
    profile: 'PROFIL / LANGUE',
    challengeMode: '🏆 MODE DÉFI',
    customMode: '⭐ MODE PERSONNALISÉ',
    challengeDesc: 'Stats de base fixées. Score enregistré au classement mondial!',
    customDesc: 'Skiez avec votre personnage amélioré. Record personnel uniquement.',
    fastestTime: 'Meilleur Temps ⏱️',
    highScore: 'Meilleur Score ⭐',
    rank: 'Rang',
    flag: 'Drapeau',
    nickname: 'Joueur',
    time: 'Temps',
    score: 'Score',
    date: 'Date',
    boostText: 'BOOST INSTANTANÉ! ⚡',
    rampBoost: 'BOOST TREMPLIN! +5s 🚀',
    driftBoost: 'BOOST DERIVE! ⚡',
    gameOver: "L'AVALANCHE VOUS A RATTRAPÉ!",
    retry: 'RÉESSAYER',
    stage: 'STAGE',
    close: 'FERMER',
    save: 'SAUVEGARDER',
  }
};

let currentLang = 'en';

export const getLang = () => currentLang;

export const setLang = (langCode) => {
  if (TRANSLATIONS[langCode]) {
    currentLang = langCode;
    console.log(`[i18n] Language changed to: ${langCode}`);
    return true;
  }
  return false;
};

export const t = (key) => {
  const langObj = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  return langObj[key] || TRANSLATIONS.en[key] || key;
};

export const getFlagEmoji = (countryCode) => {
  const code = (countryCode || 'KR').toUpperCase();
  return FLAGS[code] ? FLAGS[code].flag : '🚩';
};

export const i18n = { getLang, setLang, t, getFlagEmoji, FLAGS };

// 브라우저 글로벌 디버그용 노출
if (typeof window !== 'undefined') {
  window.i18n = i18n;
}
