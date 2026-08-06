import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

// ─── 재질 헬퍼 ───────────────────────────────────────────────────
const mat = (color, rg = 0.6, mt = 0.1, emI = 0.12) =>
  new THREE.MeshStandardMaterial({ color, roughness: rg, metalness: mt, emissive: color, emissiveIntensity: emI });

// 메시 생성 + 위치 설정 헬퍼 (Object.assign 대신 .position.set() 사용)
const mk = (geo, material, x = 0, y = 0, z = 0) => {
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  return mesh;
};

// ─── 캐릭터 메타 목록 ─────────────────────────────────────────────
export const CHARACTER_LIST = [
  { id: 'beta',    name: '베타테스터', emoji: '🏂', desc: 'Original Tester' },
  { id: 'bear',    name: '곰돌이',    emoji: '🐻', desc: 'Mountain Bear'   },
  { id: 'penguin', name: '펭귄',      emoji: '🐧', desc: 'Ice Glider'      },
  { id: 'yeti',    name: '예티',      emoji: '🦣', desc: 'Snow Legend'     },
  { id: 'fiona',   name: '피오나',    emoji: '👩', desc: 'Snow Queen'      },
];

// ─── localStorage 저장/로드 ───────────────────────────────────────
export const saveSelectedCharacter = (id) => localStorage.setItem('snowfall_char', id);
export const loadSelectedCharacter = () => localStorage.getItem('snowfall_char') || 'beta';

// ─────────────────────────────────────────────────────────────────
//  캐릭터별 바디 그룹 생성
// ─────────────────────────────────────────────────────────────────

// ── 🏂 베타테스터 (원본 스키어) ────────────────────────────────────
const makeBeta = () => {
  const g = new THREE.Group();
  g.add(
    mk(new THREE.BoxGeometry(0.7,  0.74, 0.5),  mat(0x152045),           0, 0.44,  0),  // pants
    mk(new THREE.BoxGeometry(0.74, 1.1,  0.54), mat(0x00E0FF),           0, 1.13,  0),  // jacket
    mk(new THREE.SphereGeometry(0.33, 14, 10),  mat(0xFF3300, 0.3, 0.2), 0, 2.04,  0),  // helmet
    mk(new THREE.BoxGeometry(0.42, 0.18, 0.18), mat(0xFFB000, 0.1, 0.9), 0, 2.03, 0.24) // goggles
  );
  return { bodyGroup: g, headY: 2.04 };
};

// ── 🐻 곰돌이 ──────────────────────────────────────────────────────
const makeBear = () => {
  const g = new THREE.Group();
  const brown = mat(0x6B3A1F, 0.8, 0.05, 0.08);
  const cream = mat(0xF5DEB3, 0.7, 0.05, 0.06);
  const nose  = mat(0x1A0A05, 0.9, 0.0,  0.0);

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
  return { bodyGroup: g, headY: 2.06 };
};

// ── 🐧 펭귄 ───────────────────────────────────────────────────────
const makePenguin = () => {
  const g = new THREE.Group();
  const black  = mat(0x111114, 0.7, 0.1,  0.06);
  const white  = mat(0xF0F4FF, 0.7, 0.05, 0.08);
  const orange = mat(0xFF8800, 0.5, 0.1,  0.10);

  // 몸통 (달걀형)
  const bodyGeo = new THREE.SphereGeometry(0.52, 12, 10); bodyGeo.scale(1.0, 1.35, 0.88);
  g.add(mk(bodyGeo, black, 0, 0.88, 0));

  // 배 (흰)
  const bellyGeo = new THREE.SphereGeometry(0.38, 10, 8); bellyGeo.scale(1.0, 1.2, 0.7);
  g.add(mk(bellyGeo, white, 0, 0.9, 0.3));

  // 머리 + 눈흰자 + 눈동자 + 부리 + 날개 + 고글
  g.add(mk(new THREE.SphereGeometry(0.38, 12, 10), black,  0,     1.82,    0));   // 머리
  g.add(mk(new THREE.SphereGeometry(0.11,  8,  6), white, -0.17,  1.90, 0.30));   // 눈흰 L
  g.add(mk(new THREE.SphereGeometry(0.11,  8,  6), white,  0.17,  1.90, 0.30));   // 눈흰 R
  g.add(mk(new THREE.SphereGeometry(0.065, 6,  4), mat(0x050508), -0.17, 1.90, 0.38)); // 눈동자 L
  g.add(mk(new THREE.SphereGeometry(0.065, 6,  4), mat(0x050508),  0.17, 1.90, 0.38)); // 눈동자 R

  // 부리
  const beakGeo = new THREE.ConeGeometry(0.09, 0.22, 6); beakGeo.rotateX(Math.PI / 2);
  g.add(mk(beakGeo, orange, 0, 1.77, 0.48));

  // 날개 L/R
  const wingGeo = new THREE.SphereGeometry(0.18, 6, 4); wingGeo.scale(0.55, 1.4, 0.45);
  const wL = mk(wingGeo, black, -0.62, 0.9, 0); wL.rotation.z =  0.35;
  const wR = mk(wingGeo, black,  0.62, 0.9, 0); wR.rotation.z = -0.35;
  g.add(wL, wR);

  // 고글
  g.add(mk(new THREE.BoxGeometry(0.4, 0.14, 0.12), mat(0xFFCC00, 0.1, 0.9), 0, 1.88, 0.36));
  return { bodyGroup: g, headY: 1.82 };
};

// ── 🦣 예티 ───────────────────────────────────────────────────────
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

  // 팔 L/R
  const armGeo = new THREE.CylinderGeometry(0.14, 0.11, 0.85, 8);
  const aL = mk(armGeo, snow, -0.68, 1.18, 0); aL.rotation.z =  0.55;
  const aR = mk(armGeo, snow,  0.68, 1.18, 0); aR.rotation.z = -0.55;
  g.add(aL, aR);
  return { bodyGroup: g, headY: 2.22 };
};

// ── 👩 피오나 (여성 캐릭터) ────────────────────────────────────────
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

  // 포니테일
  const hairGeo = new THREE.CylinderGeometry(0.07, 0.04, 0.55, 6); hairGeo.rotateX(0.35);
  g.add(mk(hairGeo, gold, 0, 2.26, -0.36));

  // 고글
  g.add(mk(new THREE.BoxGeometry(0.38, 0.14, 0.14), mat(0xFF8FD0, 0.1, 0.9), 0, 2.18, 0.30));
  return { bodyGroup: g, headY: 2.25 };
};

// ─── 스키 메시 공통 생성 ─────────────────────────────────────────
const makeSkis = () => {
  const skiMat = new THREE.MeshStandardMaterial({
    color: 0x18182E,
    roughness: 0.65,   // 반사 억제 (기존 0.2 → 0.65)
    metalness: 0.55,   // 과도한 금속 반짝임 완화 (기존 0.8 → 0.55)
    side: THREE.FrontSide, // 하단면 렌더링 제거
  });
  // Y를 0.10으로 올려 지형과의 z-파이팅 방지 (기존 0.03)
  const skiL = mk(new THREE.BoxGeometry(0.16, 0.06, 3.2), skiMat, -0.28, 0.10, 0.2);
  const skiR = mk(new THREE.BoxGeometry(0.16, 0.06, 3.2), skiMat,  0.28, 0.10, 0.2);
  return [skiL, skiR];
};

// ─── 메인 팩토리 함수 ─────────────────────────────────────────────
export const makeCharacterModel = (id = 'beta') => {
  let result;
  switch (id) {
    case 'bear':    result = makeBear();    break;
    case 'penguin': result = makePenguin(); break;
    case 'yeti':    result = makeYeti();    break;
    case 'fiona':   result = makeFiona();   break;
    default:        result = makeBeta();    break;
  }
  // 스키 추가 (모든 캐릭터 공통)
  const [skiL, skiR] = makeSkis();
  result.bodyGroup.add(skiL, skiR);
  return result;
};
