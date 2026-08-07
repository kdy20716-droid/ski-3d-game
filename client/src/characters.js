import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

// ─── 재질 헬퍼 ───────────────────────────────────────────────────
const mat = (color, rg = 0.6, mt = 0.1, emI = 0.12) =>
  new THREE.MeshStandardMaterial({ color, roughness: rg, metalness: mt, emissive: color, emissiveIntensity: emI });

// 메시 생성 + 위치 설정 헬퍼
const mk = (geo, material, x = 0, y = 0, z = 0) => {
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  return mesh;
};

// ─── 캐릭터 메타 목록 ─────────────────────────────────────────────
export const CHARACTER_LIST = [
  { id: 'blaze',    name: '블레이즈',     emoji: '🏎️', desc: 'Flame Racer'     },
  { id: 'cyber',    name: '프로스트바이트', emoji: '⚡', desc: 'Cyber Suit'      },
  { id: 'hunter',   name: '알파인 레인저', emoji: '🏔️', desc: 'Mountain Ranger' },
  { id: 'phantom',  name: '팬텀',         emoji: '❄️', desc: 'Stealth Suit'    },
  { id: 'champion', name: '챔피언',       emoji: '🥇', desc: 'Gold Medalist'   },
  { id: 'fiona',    name: '피오나',       emoji: '👩', desc: 'Snow Queen'      },
  { id: 'bear',     name: '곰돌이',       emoji: '🐻', desc: 'Mountain Bear'   },
  { id: 'penguin',  name: '펭귄',         emoji: '🐧', desc: 'Ice Glider'      },
  { id: 'yeti',     name: '예티',         emoji: '🦣', desc: 'Snow Legend'     },
  { id: 'beta',     name: '베타테스터',   emoji: '🏂', desc: 'Original Tester' },
];

// ─── localStorage 저장/로드 ───────────────────────────────────────
export const saveSelectedCharacter = (id) => localStorage.setItem('snowfall_char', id);
export const loadSelectedCharacter = () => localStorage.getItem('snowfall_char') || 'blaze';

// ─── 휴머노이드 팔 & 스키 폴 세트 생성 헬퍼 ────────────────────────
const addHumanoidArms = (group, jacketMat, gloveMat, poleMat = mat(0x9999AA, 0.3, 0.7), shoulderX = 0.37, shoulderY = 1.50) => {
  const armGeo = new THREE.CylinderGeometry(0.10, 0.085, 0.52, 8);
  const poleGeo = new THREE.CylinderGeometry(0.016, 0.016, 1.40, 6);
  const basketGeo = new THREE.TorusGeometry(0.075, 0.012, 6, 10);
  basketGeo.rotateX(Math.PI / 2);

  // Left Arm
  const armL = mk(armGeo, jacketMat, -shoulderX - 0.07, shoulderY - 0.22, 0.06);
  armL.rotation.z = 0.28;
  armL.rotation.x = -0.32;

  const gloveL = mk(new THREE.SphereGeometry(0.09, 8, 8), gloveMat, -shoulderX - 0.13, shoulderY - 0.45, 0.20);
  const poleL = mk(poleGeo, poleMat, -shoulderX - 0.13, shoulderY - 0.78, 0.18);
  poleL.rotation.x = 0.25;
  const basketL = mk(basketGeo, mat(0x111115), -shoulderX - 0.13, shoulderY - 1.30, 0.05);

  // Right Arm
  const armR = mk(armGeo, jacketMat, shoulderX + 0.07, shoulderY - 0.22, 0.06);
  armR.rotation.z = -0.28;
  armR.rotation.x = -0.32;

  const gloveR = mk(new THREE.SphereGeometry(0.09, 8, 8), gloveMat, shoulderX + 0.13, shoulderY - 0.45, 0.20);
  const poleR = mk(poleGeo, poleMat, shoulderX + 0.13, shoulderY - 0.78, 0.18);
  poleR.rotation.x = 0.25;
  const basketR = mk(basketGeo, mat(0x111115), shoulderX + 0.13, shoulderY - 1.30, 0.05);

  group.add(armL, gloveL, poleL, basketL, armR, gloveR, poleR, basketR);
};

// ─── 스키 메시 공통 생성 ─────────────────────────────────────────
const makeSkis = (skiColor = 0x18182E) => {
  const skiMat = new THREE.MeshStandardMaterial({
    color: skiColor,
    roughness: 0.5,
    metalness: 0.6,
    side: THREE.FrontSide,
  });
  const skiL = mk(new THREE.BoxGeometry(0.16, 0.06, 3.2), skiMat, -0.28, 0.10, 0.2);
  const skiR = mk(new THREE.BoxGeometry(0.16, 0.06, 3.2), skiMat,  0.28, 0.10, 0.2);
  return [skiL, skiR];
};

// ─────────────────────────────────────────────────────────────────
//  캐릭터별 바디 그룹 생성
// ─────────────────────────────────────────────────────────────────

// 1. 🏂 베타테스터 (오리지널 스키어)
const makeBeta = () => {
  const g = new THREE.Group();
  const jacketMat = mat(0x00E0FF);
  const pantsMat  = mat(0x152045);
  const gloveMat  = mat(0x0A1025);

  g.add(
    mk(new THREE.BoxGeometry(0.70, 0.74, 0.50), pantsMat,  0, 0.44, 0),  // pants
    mk(new THREE.BoxGeometry(0.74, 1.10, 0.54), jacketMat, 0, 1.13, 0),  // jacket
    mk(new THREE.SphereGeometry(0.33, 14, 10),  mat(0xFF3300, 0.3, 0.2), 0, 2.04, 0),   // helmet
    mk(new THREE.BoxGeometry(0.42, 0.18, 0.18), mat(0xFFB000, 0.1, 0.9), 0, 2.03, 0.24) // goggles
  );
  addHumanoidArms(g, jacketMat, gloveMat, mat(0xAAAAAA, 0.2, 0.8), 0.37, 1.50);
  return { bodyGroup: g, headY: 2.04 };
};

// 2. 🐻 곰돌이
const makeBear = () => {
  const g = new THREE.Group();
  const brown = mat(0x6B3A1F, 0.8, 0.05, 0.08);
  const cream = mat(0xF5DEB3, 0.7, 0.05, 0.06);
  const nose  = mat(0x1A0A05, 0.9, 0.0,  0.0);
  const dark  = mat(0x221105);

  g.add(
    mk(new THREE.CylinderGeometry(0.48, 0.52, 0.80, 10), brown,  0,    0.46,    0),   // 하체
    mk(new THREE.SphereGeometry(0.56, 12, 10),            brown,  0,    1.25,    0),   // 상체
    mk(new THREE.SphereGeometry(0.38, 10,  8),            cream,  0,    1.18, 0.28),   // 배
    mk(new THREE.SphereGeometry(0.48, 14, 12),            brown,  0,    2.06,    0),   // 머리
    mk(new THREE.SphereGeometry(0.15,  8,  6),            brown, -0.35, 2.46,    0),   // 귀 L
    mk(new THREE.SphereGeometry(0.15,  8,  6),            brown,  0.35, 2.46,    0),   // 귀 R
    mk(new THREE.SphereGeometry(0.09,  6,  4),            cream, -0.35, 2.46, 0.06),   // 귀안 L
    mk(new THREE.SphereGeometry(0.09,  6,  4),            cream,  0.35, 2.46, 0.06),   // 귀안 R
    mk(new THREE.SphereGeometry(0.22, 10,  8),            cream,  0,    1.98, 0.38),   // 주둥이
    mk(new THREE.SphereGeometry(0.08,  6,  4),            nose,   0,    2.08, 0.58),   // 코
    mk(new THREE.TorusGeometry(0.44, 0.12, 8, 20),        mat(0xFF2233, 0.5, 0.1), 0, 1.68, 0) // 스카프
  );
  addHumanoidArms(g, brown, dark, mat(0x8B5A2B, 0.8, 0.1), 0.44, 1.48);
  return { bodyGroup: g, headY: 2.06 };
};

// 3. 🐧 펭귄
const makePenguin = () => {
  const g = new THREE.Group();
  const black  = mat(0x111114, 0.7, 0.1,  0.06);
  const white  = mat(0xF0F4FF, 0.7, 0.05, 0.08);
  const orange = mat(0xFF8800, 0.5, 0.1,  0.10);

  const bodyGeo = new THREE.SphereGeometry(0.52, 12, 10); bodyGeo.scale(1.0, 1.35, 0.88);
  g.add(mk(bodyGeo, black, 0, 0.88, 0));

  const bellyGeo = new THREE.SphereGeometry(0.38, 10, 8); bellyGeo.scale(1.0, 1.2, 0.7);
  g.add(mk(bellyGeo, white, 0, 0.9, 0.3));

  g.add(mk(new THREE.SphereGeometry(0.38, 12, 10), black,  0,     1.82,    0));   // 머리
  g.add(mk(new THREE.SphereGeometry(0.11,  8,  6), white, -0.17,  1.90, 0.30));   // 눈흰 L
  g.add(mk(new THREE.SphereGeometry(0.11,  8,  6), white,  0.17,  1.90, 0.30));   // 눈흰 R
  g.add(mk(new THREE.SphereGeometry(0.065, 6,  4), mat(0x050508), -0.17, 1.90, 0.38)); // 눈동자 L
  g.add(mk(new THREE.SphereGeometry(0.065, 6,  4), mat(0x050508),  0.17, 1.90, 0.38)); // 눈동자 R

  const beakGeo = new THREE.ConeGeometry(0.09, 0.22, 6); beakGeo.rotateX(Math.PI / 2);
  g.add(mk(beakGeo, orange, 0, 1.77, 0.48));

  // 날개 (어깨 연결)
  const wingGeo = new THREE.SphereGeometry(0.18, 6, 4); wingGeo.scale(0.55, 1.4, 0.45);
  const wL = mk(wingGeo, black, -0.48, 1.15, 0.05); wL.rotation.z =  0.30; wL.rotation.x = -0.20;
  const wR = mk(wingGeo, black,  0.48, 1.15, 0.05); wR.rotation.z = -0.30; wR.rotation.x = -0.20;
  g.add(wL, wR);

  // 스키 폴
  const poleGeo = new THREE.CylinderGeometry(0.016, 0.016, 1.35, 6);
  const poleL = mk(poleGeo, mat(0xFF8800), -0.55, 0.70, 0.15); poleL.rotation.x = 0.25;
  const poleR = mk(poleGeo, mat(0xFF8800),  0.55, 0.70, 0.15); poleR.rotation.x = 0.25;
  g.add(poleL, poleR);
  return { bodyGroup: g, headY: 1.82 };
};

// 4. 🦣 예티
const makeYeti = () => {
  const g = new THREE.Group();
  const snow   = mat(0xEEF4FF, 0.85, 0.0, 0.10);
  const icBlue = mat(0xA0CFFF, 0.4,  0.2, 0.20);
  const dark   = mat(0x1A1A2E, 0.9,  0.0, 0.0);

  g.add(
    mk(new THREE.CylinderGeometry(0.55, 0.62, 0.85, 10), snow,   0,    0.50,    0),   // 하체
    mk(new THREE.BoxGeometry(1.0, 1.2, 0.7),              snow,   0,    1.25,    0),   // 상체
    mk(new THREE.BoxGeometry(0.82, 0.95, 0.2),            icBlue, 0,    1.30, 0.38),   // 털(앞)
    mk(new THREE.SphereGeometry(0.52, 14, 12),            snow,   0,    2.22,    0),   // 머리
    mk(new THREE.BoxGeometry(0.26, 0.07, 0.12),           dark,  -0.2,  2.40, 0.44),   // 눈썹 L
    mk(new THREE.BoxGeometry(0.26, 0.07, 0.12),           dark,   0.2,  2.40, 0.44),   // 눈썹 R
    mk(new THREE.SphereGeometry(0.10, 8, 6),              icBlue,-0.2,  2.30, 0.47),   // 눈 L
    mk(new THREE.SphereGeometry(0.10, 8, 6),              icBlue, 0.2,  2.30, 0.47),   // 눈 R
    mk(new THREE.SphereGeometry(0.12, 8, 6),              mat(0xD08070), 0, 2.16, 0.52) // 코
  );
  addHumanoidArms(g, snow, icBlue, mat(0x7090C0, 0.3, 0.7), 0.50, 1.55);
  return { bodyGroup: g, headY: 2.22 };
};

// 5. 👩 피오나
const makeFiona = () => {
  const g = new THREE.Group();
  const pink   = mat(0xFF4DA6, 0.5,  0.15, 0.12);
  const skin   = mat(0xFFCBA4, 0.75, 0.0,  0.08);
  const gold   = mat(0xFFD966, 0.4,  0.3,  0.12);
  const white  = mat(0xF5F5FF, 0.6,  0.0,  0.06);
  const purple = mat(0xCC66FF, 0.3,  0.2,  0.14);

  g.add(
    mk(new THREE.BoxGeometry(0.65, 0.72, 0.48), purple, 0, 0.43,    0),   // 팬츠
    mk(new THREE.BoxGeometry(0.70, 1.05, 0.52), pink,   0, 1.08,    0),   // 재킷
    mk(new THREE.TorusGeometry(0.32, 0.10, 8, 20), white, 0, 1.60,  0),   // 목도리
    mk(new THREE.SphereGeometry(0.31, 14, 10), skin,   0, 2.02,    0),    // 얼굴
    mk(new THREE.SphereGeometry(0.072, 8, 6),  purple,-0.13, 2.08, 0.27), // 눈 L
    mk(new THREE.SphereGeometry(0.072, 8, 6),  purple, 0.13, 2.08, 0.27), // 눈 R
    mk(new THREE.SphereGeometry(0.042, 6, 4),  mat(0xFFAA88), 0, 2.00, 0.30), // 코
    mk(new THREE.BoxGeometry(0.13, 0.042, 0.06), mat(0xFF5577), 0, 1.94, 0.30), // 입술
    mk(new THREE.SphereGeometry(0.34, 14, 10), pink,   0, 2.25,    0)    // 헬멧
  );

  const hairGeo = new THREE.CylinderGeometry(0.07, 0.04, 0.55, 6); hairGeo.rotateX(0.35);
  g.add(mk(hairGeo, gold, 0, 2.26, -0.36));
  g.add(mk(new THREE.BoxGeometry(0.38, 0.14, 0.14), mat(0xFF8FD0, 0.1, 0.9), 0, 2.18, 0.30));

  addHumanoidArms(g, pink, purple, mat(0xFFB3DA, 0.2, 0.8), 0.35, 1.48);
  return { bodyGroup: g, headY: 2.25 };
};

// 6. 🏎️ 블레이즈 (Red Racing Male Skier)
const makeBlaze = () => {
  const g = new THREE.Group();
  const redJacket  = mat(0xFF1E27, 0.4, 0.2, 0.20);
  const blackPants = mat(0x181822, 0.7, 0.1, 0.05);
  const redHelmet  = mat(0xFF2B35, 0.3, 0.3, 0.25);
  const orangeGog  = mat(0xFF6600, 0.1, 0.9, 0.80);
  const blackGlove = mat(0x111118);

  g.add(
    mk(new THREE.BoxGeometry(0.72, 0.74, 0.50), blackPants, 0, 0.44, 0), // 하의
    mk(new THREE.BoxGeometry(0.76, 1.10, 0.54), redJacket,  0, 1.13, 0), // 상의 레이싱 재킷
    // 가슴 레이싱 스포티 패널
    mk(new THREE.BoxGeometry(0.32, 0.90, 0.56), mat(0x111118), 0, 1.13, 0),
    mk(new THREE.SphereGeometry(0.34, 14, 10), redHelmet, 0, 2.05, 0),   // 헬멧
    mk(new THREE.BoxGeometry(0.44, 0.18, 0.18), orangeGog, 0, 2.04, 0.24) // 메탈 오렌지 고글
  );
  addHumanoidArms(g, redJacket, blackGlove, mat(0xFF4444, 0.3, 0.7), 0.38, 1.50);
  return { bodyGroup: g, headY: 2.05 };
};

// 7. ⚡ 프로스트바이트 (Cyber Male Skier)
const makeCyber = () => {
  const g = new THREE.Group();
  const cyberNavy = mat(0x1A2234, 0.5, 0.4, 0.15);
  const neonGreen  = mat(0x00FF66, 0.2, 0.1, 0.70);
  const darkPants  = mat(0x0E1420, 0.8, 0.1, 0.05);
  const cyanGog    = mat(0x00E5FF, 0.1, 0.95, 0.90);

  g.add(
    mk(new THREE.BoxGeometry(0.72, 0.74, 0.50), darkPants,  0, 0.44, 0),
    mk(new THREE.BoxGeometry(0.76, 1.10, 0.54), cyberNavy,  0, 1.13, 0),
    // 네온 라이프 라인
    mk(new THREE.BoxGeometry(0.78, 0.08, 0.56), neonGreen,  0, 1.25, 0),
    mk(new THREE.SphereGeometry(0.34, 14, 10), cyberNavy,   0, 2.05, 0),
    mk(new THREE.BoxGeometry(0.44, 0.16, 0.20), cyanGog,    0, 2.04, 0.24)
  );
  addHumanoidArms(g, cyberNavy, mat(0x0A0F1A), neonGreen, 0.38, 1.50);
  return { bodyGroup: g, headY: 2.05 };
};

// 8. 🏔️ 알파인 레인저 (Hunter Male Skier)
const makeHunter = () => {
  const g = new THREE.Group();
  const khakiJacket = mat(0x3B4E32, 0.7, 0.1, 0.10);
  const amberVest   = mat(0xD96B27, 0.6, 0.1, 0.15);
  const darkPants   = mat(0x222E1E, 0.8, 0.1, 0.05);
  const brownGlove  = mat(0x5A3C24, 0.8, 0.1, 0.05);
  const goldGog     = mat(0xFFB000, 0.1, 0.9, 0.70);

  g.add(
    mk(new THREE.BoxGeometry(0.74, 0.74, 0.50), darkPants,   0, 0.44, 0),
    mk(new THREE.BoxGeometry(0.78, 1.10, 0.54), khakiJacket, 0, 1.13, 0),
    // 택티컬 아웃도어 베스트
    mk(new THREE.BoxGeometry(0.80, 0.65, 0.56), amberVest,   0, 1.15, 0),
    mk(new THREE.SphereGeometry(0.34, 14, 10), khakiJacket, 0, 2.05, 0),
    mk(new THREE.BoxGeometry(0.44, 0.18, 0.18), goldGog,     0, 2.04, 0.24)
  );
  addHumanoidArms(g, khakiJacket, brownGlove, mat(0xB8860B, 0.5, 0.5), 0.39, 1.50);
  return { bodyGroup: g, headY: 2.05 };
};

// 9. ❄️ 팬텀 (Stealth White Male Skier)
const makePhantom = () => {
  const g = new THREE.Group();
  const snowWhite = mat(0xF0F4FF, 0.4, 0.2, 0.15);
  const nightBlue = mat(0x121A2E, 0.7, 0.2, 0.05);
  const purpleGog = mat(0xA000FF, 0.1, 0.95, 0.85);

  g.add(
    mk(new THREE.BoxGeometry(0.72, 0.74, 0.50), nightBlue, 0, 0.44, 0),
    mk(new THREE.BoxGeometry(0.76, 1.10, 0.54), snowWhite, 0, 1.13, 0),
    // 어깨 스텔스 딥 블루 패턴
    mk(new THREE.BoxGeometry(0.78, 0.35, 0.56), nightBlue, 0, 1.50, 0),
    mk(new THREE.SphereGeometry(0.34, 14, 10), snowWhite, 0, 2.05, 0),
    mk(new THREE.BoxGeometry(0.44, 0.18, 0.18), purpleGog, 0, 2.04, 0.24)
  );
  addHumanoidArms(g, snowWhite, nightBlue, mat(0xD5E0FF, 0.2, 0.8), 0.38, 1.50);
  return { bodyGroup: g, headY: 2.05 };
};

// 10. 🥇 챔피언 (Royal Champion Male Skier)
const makeChampion = () => {
  const g = new THREE.Group();
  const royalBlue = mat(0x0055FF, 0.4, 0.3, 0.20);
  const goldYellow = mat(0xFFC200, 0.5, 0.2, 0.25);
  const goldGog    = mat(0xFFD700, 0.1, 0.95, 0.90);
  const whiteAccent = mat(0xFFFFFF, 0.5, 0.1, 0.10);

  g.add(
    mk(new THREE.BoxGeometry(0.72, 0.74, 0.50), goldYellow, 0, 0.44, 0),
    mk(new THREE.BoxGeometry(0.76, 1.10, 0.54), royalBlue,  0, 1.13, 0),
    // 국대 가슴 흰색 쉐브론 패턴
    mk(new THREE.BoxGeometry(0.78, 0.24, 0.56), whiteAccent, 0, 1.30, 0),
    mk(new THREE.SphereGeometry(0.34, 14, 10), royalBlue,  0, 2.05, 0),
    mk(new THREE.BoxGeometry(0.44, 0.18, 0.18), goldGog,     0, 2.04, 0.24)
  );
  addHumanoidArms(g, royalBlue, royalBlue, mat(0xFFD700, 0.2, 0.9), 0.38, 1.50);
  return { bodyGroup: g, headY: 2.05 };
};

// ─── 메인 팩토리 함수 ─────────────────────────────────────────────
export const makeCharacterModel = (id = 'beta') => {
  let result;
  switch (id) {
    case 'bear':     result = makeBear();     break;
    case 'penguin':  result = makePenguin();  break;
    case 'yeti':     result = makeYeti();     break;
    case 'fiona':    result = makeFiona();    break;
    case 'blaze':    result = makeBlaze();    break;
    case 'cyber':    result = makeCyber();    break;
    case 'hunter':   result = makeHunter();   break;
    case 'phantom':  result = makePhantom();  break;
    case 'champion': result = makeChampion(); break;
    default:         result = makeBeta();     break;
  }

  // 스키 색상 옵션
  let skiColor = 0x18182E;
  if (id === 'blaze')    skiColor = 0x880000;
  if (id === 'cyber')    skiColor = 0x004455;
  if (id === 'hunter')   skiColor = 0x2A3822;
  if (id === 'phantom')  skiColor = 0xE0E8FF;
  if (id === 'champion') skiColor = 0xB8860B;

  const [skiL, skiR] = makeSkis(skiColor);
  result.bodyGroup.add(skiL, skiR);
  return result;
};
