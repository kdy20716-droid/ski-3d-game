export const i18n = {
  en: {
    title: '3D SKI AVALANCHE',
    subTitle: 'ESCAPE THE AVALANCHE! HIGH-SPEED SURVIVAL DESCENT',
    start: 'START CHALLENGE',
    endlessStart: 'START ENDLESS',
    editChar: '✏ EDIT CHARACTER',
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
    resume: 'RESUME',
    selectChar: 'SELECT CHARACTER',
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
    resume: '계속하기',
    selectChar: '캐릭터 선택하기',
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
    resume: 'ゲーム再開',
    selectChar: 'キャラクター決定',
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
    resume: '继续游戏',
    selectChar: '确认选择角色',
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
    resume: 'REPRENDRE',
    selectChar: 'CHOISIR LE PERSONNAGE',
  }
};

let currentLang = 'ko';

export const getLang = () => currentLang;

export const setLang = (lang) => {
  if (i18n[lang]) {
    currentLang = lang;
    localStorage.setItem('ski_lang', lang);
  }
};

export const t = (key) => {
  const dict = i18n[currentLang] || i18n.ko;
  return dict[key] || key;
};

export const getFlagEmoji = (lang) => {
  switch (lang) {
    case 'ko': return '🇰🇷';
    case 'en': return '🇺🇸';
    case 'ja': return '🇯🇵';
    case 'zh': return '🇨🇳';
    case 'fr': return '🇫🇷';
    default: return '🌐';
  }
};
