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
    start: 'CHALLENGE MODE',
    endlessStart: 'ENDLESS MODE',
    editChar: '✏ EDIT',
    charSelectTitle: 'CHARACTER SELECT',
    back: '← BACK',
    selected: 'SELECTED',
    speedLabel: 'SPEED',
    paused: 'PAUSED',
    pauseHint: 'PRESS ESC TO RESUME',
    gameOver: 'AVALANCHE OVERTOOK YOU!',
    retry: 'TRY AGAIN',
    stage: 'STAGE',
    close: 'CLOSE',
    save: 'SAVE PROFILE',
    recordTitle: '🏆 SUBMIT RANKING!',
    recordDesc: 'Congratulations! You set a new record. Leave your name on the global leaderboard!',
    submitBtn: 'REGISTER 🚀',
    quit: 'MAIN MENU',
  },
  ko: {
    title: '3D 스키 아발란체',
    subTitle: '산사태를 탈출하라! 목숨을 건 초고속 스키 탈출',
    start: '도전 모드 시작',
    endlessStart: '무한 모드 시작',
    editChar: '✏ 캐릭터 변경',
    charSelectTitle: '캐릭터 선택',
    back: '← 뒤로가기',
    selected: '선택됨',
    speedLabel: '속도',
    paused: '일시정지',
    pauseHint: 'ESC를 눌러 계속하기',
    gameOver: '산사태에 삼켜졌습니다!',
    retry: '다시 도전',
    stage: '스테이지',
    close: '닫기',
    save: '프로필 저장',
    recordTitle: '🏆 랭킹 등록!',
    recordDesc: '축하합니다! 신기록을 달성했습니다. 전 세계 랭킹표에 이름을 남겨보세요!',
    submitBtn: '랭킹 등록 🚀',
    quit: '메인 메뉴로 나가기',
  },
  ja: {
    title: '3D スキーアバランチ',
    subTitle: '雪崩から脱出せよ！命がけの超高速滑走',
    start: 'チャレンジモード',
    endlessStart: 'エンドレスモード',
    editChar: '✏ キャラ変更',
    charSelectTitle: 'キャラクター選択',
    back: '← 戻る',
    selected: '選択中',
    speedLabel: '速度',
    paused: '一時停止',
    pauseHint: 'ESCキーで再開',
    gameOver: '雪崩に飲み込まれた！',
    retry: '再挑戦',
    stage: 'ステージ',
    close: '閉じる',
    save: '保存',
    recordTitle: '🏆 ランキング登録!',
    recordDesc: 'おめでとうございます！新記録を達成しました。世界ランキングに名を刻もう！',
    submitBtn: '登録する 🚀',
    quit: 'メインメニューへ',
  },
  zh: {
    title: '3D 极限雪崩滑雪',
    subTitle: '逃离雪崩！生死一瞬的极速滑雪',
    start: '挑战模式',
    endlessStart: '无尽模式',
    editChar: '✏ 更改角色',
    charSelectTitle: '角色选择',
    back: '← 返回',
    selected: '已选择',
    speedLabel: '速度',
    paused: '暂停',
    pauseHint: '按 ESC 继续',
    gameOver: '已被雪崩吞没！',
    retry: '重新开始',
    stage: '关卡',
    close: '关闭',
    save: '保存资料',
    recordTitle: '🏆 提交排行榜!',
    recordDesc: '恭喜！您创造了新纪录。在全球排行榜上留下您的名字！',
    submitBtn: '立即提交 🚀',
    quit: '返回主菜单',
  },
  fr: {
    title: '3D SKI AVALANCHE',
    subTitle: "ÉCHAPPEZ À L'AVALANCHE! DESCENTE DE SURVIE",
    start: 'MODE DÉFI',
    endlessStart: 'MODE INFINI',
    editChar: '✏ CHANGER',
    charSelectTitle: 'SÉLECTION DU PERSONNAGE',
    back: '← RETOUR',
    selected: 'SÉLECTIONNÉ',
    speedLabel: 'VITESSE',
    paused: 'PAUSE',
    pauseHint: 'APPUYEZ SUR ECHAP POUR REPRENDRE',
    gameOver: "L'AVALANCHE VOUS A RATTRAPÉ!",
    retry: 'RÉESSAYER',
    stage: 'STAGE',
    close: 'FERMER',
    save: 'SAUVEGARDER',
    recordTitle: '🏆 ENREGISTRER LE SCORE!',
    recordDesc: 'Félicitations! Vous avez établi un nouveau record. Inscrivez votre nom!',
    submitBtn: 'ENREGISTRER 🚀',
    quit: 'MENU PRINCIPAL',
  }
};

export const CHARACTER_TRANSLATIONS = {
  blaze:    { ko: { name: '블레이즈', desc: '불꽃 스피더' },       en: { name: 'Blaze', desc: 'Flame Speed Racer' },       ja: { name: 'ブレイズ', desc: '炎のスピードレーサー' },   zh: { name: '烈焰赛手', desc: '烈焰赛车手' },         fr: { name: 'Blaze', desc: 'Skieur de Feu' } },
  cyber:    { ko: { name: '프로스트바이트', desc: '사이버 수트' }, en: { name: 'Frostbite', desc: 'Cyber Suit' },          ja: { name: 'フロストバイト', desc: 'サイバースーツ' },   zh: { name: '霜冻战士', desc: '赛博雪装' },           fr: { name: 'Frostbite', desc: 'Combinaison Cyber' } },
  hunter:   { ko: { name: '알파인 레인저', desc: '산악 레인저' },  en: { name: 'Alpine Ranger', desc: 'Mountain Ranger' }, ja: { name: 'アルパインレンジャー', desc: '山岳レンジャー' }, zh: { name: '高山巡逻员', desc: '高山护林员' },     fr: { name: 'Chasseur des Alpes', desc: 'Garde-Forestier' } },
  phantom:  { ko: { name: '팬텀', desc: '스텔스 수트' },           en: { name: 'Phantom', desc: 'Stealth Suit' },          ja: { name: 'ファントム', desc: 'ステルススーツ' },     zh: { name: '幽灵潜行者', desc: '隐形战服' },         fr: { name: 'Fantôme', desc: 'Combinaison Furtive' } },
  champion: { ko: { name: '챔피언', desc: '골드 메달리스트' },     en: { name: 'Champion', desc: 'Gold Medalist' },        ja: { name: 'チャンピオン', desc: '金メダリスト' },     zh: { name: '金牌冠军', desc: '金牌得主' },           fr: { name: 'Champion', desc: 'Médaillé d\'Or' } },
  fiona:    { ko: { name: '피오나', desc: '눈의 여왕' },           en: { name: 'Fiona', desc: 'Snow Queen' },              ja: { name: 'フィオナ', desc: '雪の女王' },             zh: { name: '菲奥娜', desc: '冰雪女王' },             fr: { name: 'Fiona', desc: 'Reine des Neiges' } },
  bear:     { ko: { name: '곰돌이', desc: '설산 마스코트' },       en: { name: 'Mountain Bear', desc: 'Alpine Bear' },     ja: { name: 'クマさん', desc: '雪山のマスコット' },       zh: { name: '雪山熊', desc: '雪山吉祥物' },           fr: { name: 'Ours', desc: 'Mascotte des Alpes' } },
  penguin:  { ko: { name: '펭귄', desc: '빙하 미끄럼꾼' },         en: { name: 'Ice Penguin', desc: 'Glacier Glider' },    ja: { name: 'ペンギン', desc: '氷河のグライダー' },       zh: { name: '冰川企鹅', desc: '冰川滑翔者' },         fr: { name: 'Pingouin', desc: 'Glisseur des Glaces' } },
  yeti:     { ko: { name: '예티', desc: '설산의 전설' },           en: { name: 'Snow Yeti', desc: 'Legend of Alps' },      ja: { name: 'イエティ', desc: '雪山の伝説' },           zh: { name: '雪人伊提', desc: '雪山传说' },           fr: { name: 'Yéti', desc: 'Légende des Alpes' } },
  beta:     { ko: { name: '베타테스터', desc: '원조 테스트 스키어' },en: { name: 'Beta Tester', desc: 'Original Skier' },    ja: { name: 'ベータテスター', desc: '元祖テスター' },     zh: { name: '测试员', desc: '元老测试员' },           fr: { name: 'Bêta Testeur', desc: 'Testeur d\'Origine' } }
};

let currentLang = 'ko'; // Default to Korean

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
  const langObj = TRANSLATIONS[currentLang] || TRANSLATIONS.ko;
  return langObj[key] || TRANSLATIONS.ko[key] || key;
};

export const getCharTranslation = (charId, langCode = currentLang) => {
  const charObj = CHARACTER_TRANSLATIONS[charId] || CHARACTER_TRANSLATIONS.blaze;
  return charObj[langCode] || charObj.ko || charObj.en;
};

export const getFlagEmoji = (countryCode) => {
  const code = (countryCode || 'KR').toUpperCase();
  return FLAGS[code] ? FLAGS[code].flag : '🚩';
};

export const i18n = { getLang, setLang, t, getCharTranslation, getFlagEmoji, FLAGS };

// 브라우저 글로벌 디버그용 노출
if (typeof window !== 'undefined') {
  window.i18n = i18n;
}
