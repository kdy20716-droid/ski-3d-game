import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { CFG } from './config.js?v=4.2.0';
import { STAGES } from './stages.js?v=4.2.0';
import { createSky } from './sky.js?v=4.2.0';
import { createTerrainSystem, getTerrainY } from './terrain.js?v=4.2.0';
import { makeSkier } from './skier.js?v=4.2.0';
import { createEnvironment } from './environment.js?v=4.2.0';
import { createDiamondArchSystem } from './diamondArch.js?v=4.2.0';
import { createKickerRampSystem } from './kickerRamp.js?v=4.2.0';
import { createSpawnManager } from './spawnManager.js?v=4.2.0';
import { createDriftSystem } from './driftSystem.js?v=4.2.0';
import { setupUI } from './ui.js?v=4.2.0';
import { i18n, getLang, setLang, t, getFlagEmoji } from './i18n.js?v=4.2.0';
import { createAvalancheSystem } from './avalancheSystem.js?v=4.2.0';
import { updateOpeningCutscene, updateVictoryCeremony } from './cinematic.js?v=4.2.0';
import { soundFx } from './soundSystem.js?v=4.2.0';
import { loadSelectedCharacter } from './characters.js?v=4.2.0';
import { createSnowballHazardSystem } from './snowballHazard.js?v=4.2.0';
import { createRockySnowballHazardSystem } from './rockySnowballHazard.js?v=4.2.0';

// ─────────────────────────────────────────
//  RENDERER & SCENE SETUP
// ─────────────────────────────────────────
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(STAGES[0].fogCol, 0.00015);

const camera = new THREE.PerspectiveCamera(66, innerWidth / innerHeight, 0.1, 4500);

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ─────────────────────────────────────────
//  LIGHTING
// ─────────────────────────────────────────
const sunLight = new THREE.DirectionalLight(STAGES[0].lightCol, 2.8);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.near = 1; sunLight.shadow.camera.far = 1000;
sunLight.shadow.camera.left = -220; sunLight.shadow.camera.right = 220;
sunLight.shadow.camera.top = 220;  sunLight.shadow.camera.bottom = -220;
sunLight.shadow.bias = -0.0008;
scene.add(sunLight);

const ambientLight = new THREE.AmbientLight(STAGES[0].ambientCol, 0.95);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(STAGES[0].hemiSky, STAGES[0].hemiGround, 0.65);
scene.add(hemiLight);

// ─────────────────────────────────────────
//  MODULE INITIALIZATION
// ─────────────────────────────────────────
const { skyMesh, skyMaterial } = createSky();
scene.add(skyMesh);

const { snowMat, updateDoubleBufferedTerrain, resetTerrain } = createTerrainSystem(scene);

const skierData = makeSkier(loadSelectedCharacter());
const skier = skierData.group;
const skierBodyGroup = skierData.bodyGroup;
const skierShadowMat = skierData.shadowMat;
scene.add(skier);

const env = createEnvironment(scene);
const archSystem = createDiamondArchSystem(scene);
const kickerSystem = createKickerRampSystem(scene);
const driftSystem = createDriftSystem(scene, skier);
const avalancheSystem = createAvalancheSystem(scene);
const snowballHazard = createSnowballHazardSystem(scene);
const rockySnowballHazard = createRockySnowballHazardSystem(scene);

// 눈 파티클을 camera 자식으로 등록 → 카메라 로컬 좌표 유지
// 플레이어가 아무리 멀리 내려가도 항상 카메라 주변에 눈이 존재
camera.add(env.snowPts);
scene.add(camera); // camera를 scene에 추가해야 camera child가 렌더링됨

// ─────────────────────────────────────────
//  GAME STATE & STAGE TRANSITIONS
// ─────────────────────────────────────────
const G = {
  play: false, paused: false, dead: false,
  spd: CFG.BASE_SPD, px: 0, pz: 0, py: 0, vy: 0, vx: 0,
  lean: 0, dist: 0, score: 0, stage: 1, stageMedals: 0,
  nextFlagDist: 10000,
  jumpCharge: 0, isCharging: false, inAir: false,
  boosterTimer: 0, wasRampJump: false, wasFullJump: false, was5sBooster: false,
  elapsed: 0, bonusTimer: 0, cx: 0, cy: 12, cz: 24, lx: 0, ly: 5, lz: -25,
};

const transitionState = { currentStageIdx: 0, targetStageIdx: 0, progress: 1.0, dur: 2.0 };
const curFogColor = new THREE.Color(STAGES[0].fogCol);
const curLightColor = new THREE.Color(STAGES[0].lightCol);
const curAmbientColor = new THREE.Color(STAGES[0].ambientCol);
const curHemiSky = new THREE.Color(STAGES[0].hemiSky);
const curHemiGround = new THREE.Color(STAGES[0].hemiGround);
const curSnowGlow = new THREE.Color(STAGES[0].snowGlow);
const curSunDir = new THREE.Vector3().copy(STAGES[0].sunDir);
const curSkyCol = new THREE.Vector3(...STAGES[0].skyCol);

const triggerStageTransition = (nextIdx) => {
  transitionState.targetStageIdx = Math.min(nextIdx, STAGES.length - 1);
  transitionState.progress = 0.0;
};

const updateStageTransition = (dt) => {
  if (transitionState.progress < 1.0) {
    transitionState.progress = Math.min(1.0, transitionState.progress + dt / transitionState.dur);
    const p = transitionState.progress;
    const easeP = p < 0.5 ? 2*p*p : -1 + (4 - 2*p)*p;

    const sFrom = STAGES[transitionState.currentStageIdx];
    const sTo   = STAGES[transitionState.targetStageIdx];

    curFogColor.setHex(sFrom.fogCol).lerp(new THREE.Color(sTo.fogCol), easeP);
    curLightColor.setHex(sFrom.lightCol).lerp(new THREE.Color(sTo.lightCol), easeP);
    curAmbientColor.setHex(sFrom.ambientCol).lerp(new THREE.Color(sTo.ambientCol), easeP);
    curHemiSky.setHex(sFrom.hemiSky).lerp(new THREE.Color(sTo.hemiSky), easeP);
    curHemiGround.setHex(sFrom.hemiGround).lerp(new THREE.Color(sTo.hemiGround), easeP);
    curSnowGlow.setHex(sFrom.snowGlow).lerp(new THREE.Color(sTo.snowGlow), easeP);
    curSunDir.copy(sFrom.sunDir).lerp(sTo.sunDir, easeP).normalize();

    const fromSky = new THREE.Vector3(...sFrom.skyCol);
    const toSky   = new THREE.Vector3(...sTo.skyCol);
    curSkyCol.copy(fromSky).lerp(toSky, easeP);

    const lerpStageVal = sFrom.stageVal + (sTo.stageVal - sFrom.stageVal) * easeP;

    scene.fog.color.copy(curFogColor);
    sunLight.color.copy(curLightColor);
    sunLight.position.copy(curSunDir).multiplyScalar(200);
    ambientLight.color.copy(curAmbientColor);
    hemiLight.color.copy(curHemiSky);
    hemiLight.groundColor.copy(curHemiGround);
    snowMat.emissive.copy(curSnowGlow);

    skyMaterial.uniforms.uSun.value.copy(curSunDir);
    skyMaterial.uniforms.uSkyCol.value.copy(curSkyCol);
    skyMaterial.uniforms.uStage.value = lerpStageVal;

    if (p >= 1.0) transitionState.currentStageIdx = transitionState.targetStageIdx;
  }
};

// ─────────────────────────────────────────
//  🤫 개발자 전용 비밀 스테이지 워프 연습 모드 (Alt + Shift + 숫자 3초 홀드)
// ─────────────────────────────────────────
let cheatWarpKey = null;
let cheatWarpStartTime = 0;
let cheatWarpTargetStage = 0;

const warpToStage = (stageNum) => {
  const targetIdx = Math.max(1, Math.min(10, stageNum));
  soundFx.playVictory(); // 🎺 스테이지 워프 완료 사운드

  G.play = true;
  G.paused = false;
  G.dead = false;
  G.isCrashed = false;
  G.spd = CFG.BASE_SPD;
  G.px = 0;
  G.pz = 0;
  G.py = getTerrainY(0, 0);
  G.vy = 0; G.vx = 0; G.lean = 0;
  G.dist = 0; G.score = 0;
  G.stage = targetIdx;
  G.nextFlagDist = 10000;
  G.jumpCharge = 0; G.isCharging = false; G.inAir = false; G.airTimeTimer = 0.0;
  G.boosterTimer = 0; G.wasRampJump = false; G.wasFullJump = false;
  G.elapsed = 0; G.bonusTimer = 0;
  
  // 시네마틱 스킵 상태
  G.isOpeningCutscene = false;
  G.cutsceneTimer = 0.0;
  G.avalancheGraceTimer = 3.0;
  G.invincibleTimer = 3.0; // 워프 직후 3초 무적
  G.stunTimer = 0.0;
  G.avalancheZ = 95.0;
  G.isVictoryCeremony = false;

  skier.position.set(0, G.py, 0);
  skier.rotation.set(0, 0, 0);

  // 스테이지 환경 변환
  const sIdx = targetIdx - 1;
  const targetStageObj = STAGES[sIdx];
  transitionState.currentStageIdx = sIdx;
  transitionState.targetStageIdx = sIdx;
  transitionState.progress = 1.0;

  scene.fog.color.setHex(targetStageObj.fogCol);
  sunLight.color.setHex(targetStageObj.lightCol);
  sunLight.position.copy(targetStageObj.sunDir).multiplyScalar(200);
  ambientLight.color.setHex(targetStageObj.ambientCol);
  hemiLight.color.setHex(targetStageObj.hemiSky);
  hemiLight.groundColor.setHex(targetStageObj.hemiGround);
  snowMat.emissive.setHex(targetStageObj.snowGlow);

  skyMaterial.uniforms.uSun.value.copy(targetStageObj.sunDir);
  skyMaterial.uniforms.uSkyCol.value.set(...targetStageObj.skyCol);
  skyMaterial.uniforms.uStage.value = targetStageObj.stageVal;

  resetTerrain();
  if (env && env.resetEnvironment) env.resetEnvironment();
  if (archSystem && archSystem.reset) archSystem.reset();
  if (kickerSystem && kickerSystem.reset) kickerSystem.reset();
  if (driftSystem && driftSystem.reset) driftSystem.reset();
  if (snowballHazard && snowballHazard.reset) snowballHazard.reset();
  if (rockySnowballHazard && rockySnowballHazard.reset) rockySnowballHazard.reset();

  if (ui) {
    ui.showScreen('game');
    ui.updateStageTitle(targetIdx, targetStageObj.name);
    ui.showBonusToast(`WARP: STAGE ${targetIdx} · ${targetStageObj.name}`, true);
    if (ui.showVictoryOverlay) ui.showVictoryOverlay(false);
    if (ui.showSurpriseBadge) ui.showSurpriseBadge(false);
  }
};

const checkSecretCheatWarp = (dt) => {
  if (!cheatWarpKey) return;
  const elapsed = performance.now() - cheatWarpStartTime;
  if (elapsed >= 3000.0) { // 3.0초 꾹 누르기 완료!
    const targetStage = cheatWarpTargetStage;
    cheatWarpKey = null;
    cheatWarpStartTime = 0;
    cheatWarpTargetStage = 0;
    warpToStage(targetStage);
  }
};

const parseDigitKey = (code) => {
  if (code === 'Digit1' || code === 'Numpad1') return 1;
  if (code === 'Digit2' || code === 'Numpad2') return 2;
  if (code === 'Digit3' || code === 'Numpad3') return 3;
  if (code === 'Digit4' || code === 'Numpad4') return 4;
  if (code === 'Digit5' || code === 'Numpad5') return 5;
  if (code === 'Digit6' || code === 'Numpad6') return 6;
  if (code === 'Digit7' || code === 'Numpad7') return 7;
  if (code === 'Digit8' || code === 'Numpad8') return 8;
  if (code === 'Digit9' || code === 'Numpad9') return 9;
  if (code === 'Digit0' || code === 'Numpad0') return 10;
  return 0;
};

// ─────────────────────────────────────────
//  CONTROLS & UI HANDLERS
// ─────────────────────────────────────────
let ui = null;
const keys = new Set();
window.addEventListener('keydown', e => {
  if (e.code === 'Escape' && G.play && !G.dead) togglePause();
  if ((e.code === 'Space' || e.code === 'Enter') && !G.play && !G.dead) startGame();
  // 🎬 오프닝 시네마틱 컷씬 Spacebar / Enter 스킵 기능!
  if ((e.code === 'Space' || e.code === 'Enter') && G.play && G.isOpeningCutscene) {
    G.isOpeningCutscene = false;
    G.avalancheGraceTimer = 3.0; // 3초 유예 시간 시작!
    G.avalancheZ = G.pz + 95.0;  // 1스테이지 최상급 95m 여유 배치!
    if (avalancheSystem) avalancheSystem.updateAvalanche(G.avalancheZ);
    if (skierData && skierData.updateSurpriseBadge3D) skierData.updateSurpriseBadge3D('off');
    if (ui && ui.showSkipHint) ui.showSkipHint(false);
  }

  // 🤫 개발자 전용 3초 홀드 워프 타이머 시작 (Ctrl + 숫자 1~0 3초간 꾹 누르기)
  if (e.ctrlKey || e.metaKey) {
    const stageNum = parseDigitKey(e.code);
    if (stageNum > 0) {
      if (cheatWarpKey !== e.code) {
        cheatWarpKey = e.code;
        cheatWarpStartTime = performance.now();
        cheatWarpTargetStage = stageNum;
      }
    }
  }

  keys.add(e.code);
});

window.addEventListener('keyup', e => {
  keys.delete(e.code);
  if (cheatWarpKey === e.code || (!e.ctrlKey && !e.metaKey)) {
    cheatWarpKey = null;
    cheatWarpStartTime = 0;
    cheatWarpTargetStage = 0;
  }
});

const togglePause = () => {
  G.paused = !G.paused;
  if (ui) ui.showScreen(G.paused ? 'pause' : 'unpause');
};

const startGame = () => {
  soundFx.playStart(); // 🎬 게임 시작 / 오프닝 컷씬 웅장한 soundFx
  Object.assign(G, {
    play: true, paused: false, dead: false, spd: CFG.BASE_SPD,
    px: 0, pz: 0, py: getTerrainY(0, 0), vy: 0, vx: 0, lean: 0, dist: 0, score: 0, stage: 1, stageMedals: 0,
    nextFlagDist: 10000, jumpCharge: 0, isCharging: false, inAir: false, airTimeTimer: 0.0,
    boosterTimer: 0, wasRampJump: false, wasFullJump: false, elapsed: 0, bonusTimer: 0,
    // 🎬 산사태 시네마틱 컷씬 & 3초 유예 시간 & 3초 무적 리스폰 & 완주 세레머니 상태 변수
    isOpeningCutscene: true, cutsceneTimer: 0.0, avalancheGraceTimer: 3.0, wasSurpriseSound: false, wasVictorySound: false,
    invincibleTimer: 0.0, stunTimer: 0.0, avalancheZ: 220.0,
    isVictoryCeremony: false, victoryTimer: 0.0,
  });

  if (ui && ui.updateMedalHUD) ui.updateMedalHUD(0);
  
  skier.position.set(0, G.py, 0);
  skier.rotation.set(0, 0, 0);

  // 🚨 [가시성 100% 리셋 방어막]: 이전 충돌/사망 무적 깜빡임 중 트라이 어게인 시 캐릭터 안 보이는 버그 완전 방지!
  skier.visible = true;
  if (skierData && skierData.bodyGroup) {
    skierData.bodyGroup.visible = true;
  }
  skier.traverse((child) => {
    if (child.isMesh) child.visible = true;
  });

  // 🎬 오프닝 시네마틱 카메라 구도 (하늘 정면에서 캐릭터를 내다보는 뷰)
  camera.position.set(0, G.py + 16, -14);
  camera.lookAt(0, G.py + 1.5, 0);

  // 1. 지형 2중 버퍼 Z=0 원점 리셋
  resetTerrain();

  // 2. 나무, 다이아몬드, 산맥 오브젝트 100% 원점 리셋
  if (env && env.resetEnvironment) env.resetEnvironment();
  if (archSystem && archSystem.reset) archSystem.reset();
  if (kickerSystem && kickerSystem.reset) kickerSystem.reset();
  if (driftSystem && driftSystem.reset) driftSystem.reset();
  if (snowballHazard && snowballHazard.reset) snowballHazard.reset();
  if (rockySnowballHazard && rockySnowballHazard.reset) rockySnowballHazard.reset();

  if (ui) ui.showScreen('game');
  if (ui && ui.showVictoryOverlay) ui.showVictoryOverlay(false);
  if (ui && ui.showSurpriseBadge) ui.showSurpriseBadge(false);

  transitionState.currentStageIdx = 0;
  transitionState.targetStageIdx = 0;
  transitionState.progress = 1.0;
  
  const s0 = STAGES[0];
  scene.fog.color.setHex(s0.fogCol);
  sunLight.color.setHex(s0.lightCol);
  sunLight.position.copy(s0.sunDir).multiplyScalar(200);
  ambientLight.color.setHex(s0.ambientCol);
  hemiLight.color.setHex(s0.hemiSky);
  hemiLight.groundColor.setHex(s0.hemiGround);
  snowMat.emissive.setHex(s0.snowGlow);
  skyMaterial.uniforms.uSun.value.copy(s0.sunDir);
  skyMaterial.uniforms.uSkyCol.value.set(...s0.skyCol);
  skyMaterial.uniforms.uStage.value = 0;
  if (ui) ui.updateStageTitle(1, s0.name);

  env.spawnFlagGate(G.nextFlagDist);
  if (ui) ui.showToast('AVALANCHE ESCAPE', '산사태를 탈출하라!');
};

const endGame = () => {
  G.play = false; G.dead = true;
  if (ui) ui.showScreen('over', `획득 점수: <strong>${Math.floor(G.score)} pts</strong><br>달성 스테이지: STAGE ${G.stage}`);
};

ui = setupUI({ onStart: startGame, onTogglePause: togglePause });
if (ui && ui.triggerDissolveRespawn) {
  G.triggerDissolveRespawn = ui.triggerDissolveRespawn;
}

// ─────────────────────────────────────────
//  MAIN UPDATE LOOP
// ─────────────────────────────────────────
const update = (dt, time) => {
  // 🤫 개발자 전용 3초 홀드 워프 타이머 체킹 (메인메뉴/인게임 어디서나 동작!)
  checkSecretCheatWarp(dt);

  if (G.paused) return;
  G.elapsed += dt;

  // 🛑 1초 자리고정 스턴 처리 (나무에 박았을 때 1초간 자리에 완전 고정!)
  if (G.stunTimer > 0) {
    G.stunTimer -= dt;
    G.spd = 0;
    if (skierData && skierData.updateInvincibleFlash) skierData.updateInvincibleFlash(G.invincibleTimer);
    return;
  }

  // ── 1. 부스터 타이머 & 5초 부스터 완주 시 +500점 보너스 ──
  if (G.boosterTimer > 0) {
    G.boosterTimer = Math.max(0, G.boosterTimer - dt);
    if (ui) ui.setBoosterUI(true);

    // 5초 부스터를 멈추지 않고 끝까지 완주 성공 시 500점 획득!
    if (G.boosterTimer === 0 && G.was5sBooster) {
      G.was5sBooster = false;
      G.score += 500;
      if (ui) ui.showBonusToast('BOOST COMPLETED! +500', true);
    }
  } else {
    if (ui) ui.setBoosterUI(false);
    G.was5sBooster = false;
  }



  const left  = keys.has('ArrowLeft')  || keys.has('KeyA');
  const right = keys.has('ArrowRight') || keys.has('KeyD');
  const accel = keys.has('ArrowUp')    || keys.has('KeyW');
  const brake = keys.has('ArrowDown')  || keys.has('KeyS');
  const shift = keys.has('ShiftLeft') || keys.has('ShiftRight');
  const space = keys.has('Space');
  const turn  = (right?1:0) - (left?1:0);

  const turnForce = shift ? CFG.TURN_FAST : CFG.TURN;

  // ── 2. 독립 키커 점프대(kickerRamp.js) 3D AABB 콜라이더 체크 및 자동 도약 ──
  if (kickerSystem) {
    kickerSystem.checkCollisionAndLaunch(G, (txt, gold) => {
      soundFx.playJump(); // 🦘 점프대 도약 사운드
      if (ui) ui.showBonusToast(txt, gold);
    });
  }

  // ── 3. 수동 점프 도약 ──
  if (space && !G.inAir) {
    G.isCharging = true;
    G.jumpCharge = Math.min(1.0, G.jumpCharge + dt * 2.2);
  } else if (G.isCharging && !space && !G.inAir) {
    G.inAir = true;
    G.airTimeTimer = 0.0; // 체공 시간 타이머 0.0s 초기화!
    soundFx.playJump(); // 🦘 수동 점프 도약 사운드
    const isFullCharge = G.jumpCharge >= 0.82;
    G.vy = 20.0 + G.jumpCharge * 24.0;
    G.wasRampJump = false;
    G.wasFullJump = isFullCharge;

    G.isCharging = false;
    G.jumpCharge = 0;
  }

  // 🏎️ 동적 최고 속도 계산 (원래의 340+ km/h 초고속 속도감 복구!)
  const isBoosterActive = G.boosterTimer > 0;
  const currentMaxSpd = CFG.MAX_SPD + (G.stage - 1) * 5.0 + (isBoosterActive ? 35.0 : 0);

  // ⚡ 만화 방사형 흑백 집중선 오버레이 연출 (차징 중엔 꺼지고, 순수 부스트 주행 시만 고정 발동!)
  const isShiftPressing = keys.has('ShiftLeft') || keys.has('ShiftRight');
  const showSpeedLines = isBoosterActive && !G.isCharging && !isShiftPressing;
  if (ui && ui.setMangaSpeedLines) ui.setMangaSpeedLines(showSpeedLines);

  // 🏎️ 4. 독립 드리프트 시스템 모듈 (driftSystem.js) 안전하게 구동
  let driftRes = null;
  if (driftSystem) {
    driftRes = driftSystem.update(G, keys, dt, ui);
  }

  const targetSpd = Math.min(currentMaxSpd, (G.boosterTimer > 0 ? currentMaxSpd : CFG.BASE_SPD) + (G.stage-1)*5 + G.elapsed*1.8);
  if (accel) G.spd = Math.min(currentMaxSpd, G.spd + CFG.ACCEL * dt * 4.2);
  else if (brake) G.spd = Math.max(8, G.spd - CFG.ACCEL * dt * 7.5);
  else G.spd += (targetSpd - G.spd) * dt * (G.boosterTimer > 0 ? 2.5 : 0.6);

  G.vx += turn * turnForce * dt;
  G.vx *= CFG.TURN_FRIC;

  G.px += G.vx * dt;
  G.pz -= G.spd * dt;
  G.dist = -G.pz;

  // 3초마다 속도 보너스 계산 (최고속도: +300, 일반속도: +100, 최저속도: 0)
  G.bonusTimer += dt;
  if (G.bonusTimer >= 3.0) {
    G.bonusTimer -= 3.0;

    const spdKmh = G.spd * 3.6;
    const maxSpdKmh = currentMaxSpd * 3.6;
    const isMinSpd = spdKmh <= 32;
    const isMaxSpd = spdKmh >= (maxSpdKmh - 8.0);

    if (!isMinSpd) {
      if (isMaxSpd) {
        G.score += 300;
        if (ui) ui.showBonusToast('Speed Bonus +300', true);
      } else {
        G.score += 100;
        if (ui) ui.showBonusToast('Bonus +100', false);
      }
    }
  }

  if (Math.abs(G.px) > CFG.MAX_LATERAL_X) {
    G.px = Math.sign(G.px) * CFG.MAX_LATERAL_X;
    G.vx *= -0.2;
  }

  // ── 4. 물리 Y 및 착지 판정 ──
  const gy = getTerrainY(G.px, G.pz);
  if (G.inAir) {
    G.airTimeTimer = Math.min(5.0, G.airTimeTimer + dt); // 체공 시간 (최대 5.0초 누적!)
    G.py += G.vy * dt;
    G.vy -= 58 * dt;
    if (G.py <= gy) {
      G.py = gy;
      G.vy = 0;
      G.inAir = false;
      soundFx.playLand(); // 🛬 착지 성공 사운드

      // 🚀 순수 체공 시간이 최소 0.85초 이상(airBoostDuration >= 0.85s) 확실히 떴을 때만 착지 부스터 발동!
      const airBoostDuration = Math.min(5.0, G.airTimeTimer);
      if (airBoostDuration >= 0.85) {
        const actualBoost = Math.min(4.2, airBoostDuration * 0.85); // 0.7s ~ 4.2s 절제된 비례 부스터!
        G.boosterTimer = Math.max(G.boosterTimer, actualBoost);
        soundFx.playBoost(); // 🚀 착지 부스터 발동 사운드!
        if (ui && ui.showBonusToast) {
          ui.showBonusToast(`AIR BOOST! +${actualBoost.toFixed(1)}s 🚀`, true);
        }
      }
      G.wasRampJump = false;
      G.wasFullJump = false;
    }
  } else {
    G.py = gy;
  }

  // ── 5. 환경 & 독립 모듈 업데이트 ──
  env.updateEndlessSideMountains(G.pz);
  env.updateEndlessObstaclesAndItems(G.pz, time);
  env.updateContinuousSnow(dt);

  // 🌈 원래 포물선 다이아몬드 아치 모듈 업데이트 (diamondArch.js)
  if (archSystem) {
    archSystem.update(G.pz, G.px, G.py, dt, time, (pts) => { G.score += pts; }, (txt, gold) => {
      soundFx.playGold(); // 💎 아치 다이아몬드 사운드
      if (ui) ui.showBonusToast(txt, gold);
    });
  }

  // 🛹 삼각 나무 키커 점프대 및 황금 메달 3개 모듈 업데이트 (kickerRamp.js)
  if (kickerSystem) {
    G.kickerRampList = kickerSystem.rampList;
    kickerSystem.update(
      G.pz, G.px, G.py, dt, time,
      (pts) => { G.score += pts; },
      (txt, gold) => { if (ui) ui.showBonusToast(txt, gold); },
      () => {
        // 🥇 황금 메달 획득 콜백: 최대 3개 카운트 업 & HUD 인디케이터 업데이트
        G.stageMedals = Math.min(3, G.stageMedals + 1);
        if (ui && ui.updateMedalHUD) ui.updateMedalHUD(G.stageMedals);
      }
    );
  }
  
  if (snowballHazard) {
    snowballHazard.update(
      G, dt,
      (warnInfo) => {
        if (ui && ui.updateCornerWarningUI) {
          ui.updateCornerWarningUI(warnInfo.showLeft, warnInfo.showRight);
        }
      },
      (pts) => { G.score += pts; },
      (txt, gold) => { if (ui) ui.showBonusToast(txt, gold); }
    );
  }

  if (rockySnowballHazard) {
    rockySnowballHazard.update(
      G, dt,
      (pts) => { G.score += pts; },
      (txt, gold) => { if (ui) ui.showBonusToast(txt, gold); }
    );
  }

  updateDoubleBufferedTerrain(G.pz);

  skier.position.set(G.px, G.py, G.pz);
  
  // 🏎️ 마리오 카트 100% 동일 비주얼! 스키어 전체 3D 모델을 Y축으로 80도(1.40 rad) 획 돌려 옆 모습 넙적하게 보이기!
  if (driftRes && driftRes.driftYawAngle !== undefined) {
    skier.rotation.y = driftRes.driftYawAngle; // 루트 Y축 80도 직접 회전!
    if (skierBodyGroup) skierBodyGroup.rotation.y = 0;
  } else {
    skier.rotation.y = 0;
  }
  
  const maxLeanAngle = G.wasDrifting ? CFG.DRIFT_LEAN_MAX : 0.38;
  G.lean += (turn * maxLeanAngle - G.vx * 0.015 - G.lean) * 0.22;
  skier.rotation.z = -G.lean;

  if (G.inAir) {
    const airH = G.py - gy;
    if (skierShadowMat) skierShadowMat.opacity = Math.max(0.1, 0.65 - airH * 0.06);
  } else {
    if (skierShadowMat) skierShadowMat.opacity = 0.65;
  }

  updateStageTransition(dt);

  for (const item of env.scoreItems) {
    if (!item.active) continue;
    item.mesh.rotation.y += dt * 3.5;
    
    const dx = G.px - item.mesh.position.x;
    const dy = (G.py + 1.2) - item.mesh.position.y;
    const dz = G.pz - item.mesh.position.z;
    const distSq3D = dx * dx + dy * dy + dz * dz;

    if (distSq3D < 100.0 && distSq3D > 0.1) {
      item.mesh.position.x += dx * dt * 28.0;
      item.mesh.position.z += dz * dt * 28.0;
      item.mesh.position.y += dy * dt * 28.0;
    }

    if (distSq3D < 36.0) {
      item.active = false;
      item.mesh.visible = false;
      G.score += item.pts;
      soundFx.playGold(); // 💎 크리스탈 점수 아이템 획득 사운드
    }
  }

  // 🌟 점프대 공중 황금 다이아몬드 5개 전용 획득 처리 (각 1,000pt)
  if (env && env.rampGoldItems) {
    for (const gItem of env.rampGoldItems) {
      if (!gItem.active) continue;
      gItem.mesh.rotation.y += dt * 4.0;

      const dx = G.px - gItem.mesh.position.x;
      const dy = (G.py + 1.2) - gItem.mesh.position.y;
      const dz = G.pz - gItem.mesh.position.z;
      const distSq3D = dx * dx + dy * dy + dz * dz;

      // 3D 자석 흡입
      if (distSq3D < 120.0 && distSq3D > 0.1) {
        gItem.mesh.position.x += dx * dt * 32.0;
        gItem.mesh.position.z += dz * dt * 32.0;
        gItem.mesh.position.y += dy * dt * 32.0;
      }

      // 획득 판정 (3D 거리 6.5m 이내 도달 시 1,000점 획득!)
      if (distSq3D < 42.0) {
        gItem.active = false;
        gItem.mesh.visible = false;
        G.score += gItem.pts;
        soundFx.playGoldenDiamond(); // 🌟 황금 다이아몬드 전용 화려한 챠링-! Sound FX!
        if (ui) ui.showBonusToast('GOLD DIAMOND! +1000', true);
      }
    }
  }

  // 🎬 1. 오프닝 시네마틱 컷씬 (cinematic.js 모듈 호출)
  if (G.isOpeningCutscene) {
    updateOpeningCutscene(G, dt, camera, skier, ui, getTerrainY, avalancheSystem, CFG, skierData);
    return;
  }

  // 🤸‍♂️ 2. 도전 모드 10스테이지 완주 360도 공중제비 (Backflip Kick) 피날레 세레머니 (cinematic.js 모듈 호출)
  if (G.isVictoryCeremony) {
    updateVictoryCeremony(G, dt, camera, skier, ui, getTerrainY);
    return;
  }

  // 🛡️ 5초 무적 반투명 깜빡임 업데이트
  if (G.invincibleTimer > 0) {
    G.invincibleTimer -= dt;
    if (skierData && skierData.updateInvincibleFlash) skierData.updateInvincibleFlash(G.invincibleTimer);
  } else {
    if (skierData && skierData.updateInvincibleFlash) skierData.updateInvincibleFlash(0);
  }

  // 🏔️ 거대 3D 산사태 실시간 전진 (1스테이지 95m 여유 ➔ 스테이지 진행 시 서서히 최소거리 좁혀짐!)
  if (G.avalancheGraceTimer > 0) {
    G.avalancheGraceTimer -= dt; // 컷씬 종료 직후 3.0초 유예 안전시간!
  }

  // 1) 1스테이지는 65% 속도로 아주 여유롭게, 스테이지가 올라갈수록 서서히 속도 상향!
  const isGrace = G.avalancheGraceTimer > 0;
  const stageSpeedFactor = 0.65 + Math.min(0.24, (G.stage - 1) * 0.026); // Stage 1: 0.65 ➔ Stage 10: 0.89
  const baseAvSpd = currentMaxSpd * (isGrace ? 0.15 : stageSpeedFactor);
  let currentAvSpd = baseAvSpd;

  // 2) 스테이지별 최소/안전 거리: Stage 1 = 95m (최고 여유) ➔ Stage 10 = 20m (서서히 짧아짐!)
  const targetSafetyGap = Math.max(20.0, 95.0 - (G.stage - 1) * 8.3);
  const currentGap = Math.abs(G.pz - G.avalancheZ);

  // 3) 플레이어가 멀어져 targetSafetyGap 이상 벌어졌을 때만 천천히 추격
  if (!isGrace && currentGap > targetSafetyGap + 20.0) {
    currentAvSpd = Math.max(G.spd * 0.98, baseAvSpd * 1.15);
  }

  // 3) 산사태 실시간 Z 하강 전진!
  G.avalancheZ -= currentAvSpd * dt;
  if (avalancheSystem) avalancheSystem.updateAvalanche(G.avalancheZ);

  // 🚨 4) 산사태 및 눈덩이 접근 붉은 모서리 위험 경고 비넷 펄스 (65m 전부터 멀리서 미리 감지 & 서서히 진해짐!)
  if (ui && ui.setDangerVignette) {
    if (currentGap < 65.0 && G.play && !G.dead) {
      // 65m -> 15m 거리 감축에 비례하여 0.0 ~ 0.65까지 서서히 부드럽게 진해짐!
      const intensity = Math.min(0.65, (65.0 - currentGap) / 50.0);
      ui.setDangerVignette(intensity);
    } else {
      ui.setDangerVignette(0);
    }
  }

  // 💀 산사태 덮침 사망 판정
  if (G.avalancheZ <= G.pz + 3.5) {
    G.play = false; G.dead = true;
    if (ui && ui.setDangerVignette) ui.setDangerVignette(0);
    soundFx.playGameOver(); // 💀 산사태 삼켜짐 저음 사운드 FX
    if (ui) ui.showScreen('over', `💀 <strong>AVALANCHE OVERTOOK YOU!</strong><br>거대 산사태에 삼켜졌습니다!<br>최종 점수: <strong>${Math.floor(G.score)} pts</strong>`);
    return;
  }

  // ── 6. 체크포인트 깃발 & STAGE 10 15km 피날레 거대 골대 통과 판정 ──
  if (G.pz <= -G.nextFlagDist) {
    const isChallengeMode = G.mode === 'challenge';
    
    // 도전 모드이고 10스테이지 골대를 지난 경우: 360도 공중제비 완주 세레머니 트리거!
    if (isChallengeMode && G.stage >= 10) {
      G.isVictoryCeremony = true;
      G.victoryTimer = 0.0;
    } else {
      // 🥇 [스테이지 클리어 메달 보너스 점수 산정]: 1개 +3,000 / 2개 +6,000 / 3개 퍼펙트 +10,000 pts!
      let medalBonusPts = 0;
      let bonusToastText = '';
      if (G.stageMedals === 1) {
        medalBonusPts = 3000;
        bonusToastText = 'MEDAL CLEAR BONUS +3,000! 🥇';
      } else if (G.stageMedals === 2) {
        medalBonusPts = 6000;
        bonusToastText = 'DOUBLE MEDAL BONUS +6,000! 🥇🥇';
      } else if (G.stageMedals >= 3) {
        medalBonusPts = 10000;
        bonusToastText = 'PERFECT 3 MEDALS BONUS +10,000! 🥇🥇🥇';
      }

      if (medalBonusPts > 0) {
        G.score += medalBonusPts;
        soundFx.playGoldenDiamond();
        if (ui) ui.showBonusToast(bonusToastText, true);
      }

      // 다음 스테이지 진입 (11, 12... 무한 순환) & 메달 수집 0개 리셋
      G.stage += 1;
      G.stageMedals = 0;
      if (ui && ui.updateMedalHUD) ui.updateMedalHUD(0);

      const stageIdx = (G.stage - 1) % STAGES.length;
      const sNext = STAGES[stageIdx];
      triggerStageTransition(stageIdx);
      if (ui) ui.updateStageTitle(G.stage, sNext.name);

      const isFinalGate = (G.stage === 10);
      const nextStepDist = isFinalGate ? 15000 : 10000;
      G.nextFlagDist += nextStepDist;
      
      env.spawnFlagGate(G.nextFlagDist, isFinalGate);

      if (isFinalGate) {
        if (ui) ui.showToast('STAGE 10 FINAL', '15km 챔피언의 영광 피날레 코스!');
      } else {
        if (ui) ui.showToast(`STAGE ${G.stage}`, sNext.name);
      }
    }
  }

  // 💥 나무 충돌 시 5초 무적 리스폰! (사망 끝이 아니라 속도 0 & 안전 지대 리스폰)
  const hitRadiusMult = 1.1 + Math.min(0.4, (G.stage - 1) * 0.06);
  for (const tree of env.treeList) {
    const dx = G.px - tree.x, dz = G.pz - tree.z;
    if (dx*dx + dz*dz < tree.r2 * hitRadiusMult && !G.inAir) {
      if (G.invincibleTimer <= 0) {
        G.spd = 0;
        G.stunTimer = 0.3; // 0.3초 빠른 스턴 회복!
        G.invincibleTimer = 3.0; // 3초 무적 반투명 깜빡임
        soundFx.playCrash(); // 💥 나무 충돌 타격음 FX
        
        // 🌌 디졸브 어두워짐 빠른 암전 ➔ 옆 안전 지대 리스폰 연출!
        if (ui && ui.triggerDissolveRespawn) {
          ui.triggerDissolveRespawn(() => {
            G.px = tree.x * 0.15; // 절정 타임에 안전 지대 리스폰!
          });
        } else {
          G.px = tree.x * 0.15;
        }

        if (ui) ui.showBonusToast('CRASH! 3초 무적 ⚡', false);
      }
    }
  }

  G.cx += (G.px * 0.95 - G.cx) * (dt * 12);
  const targetCamY = G.py + CFG.CAM_H;
  G.cy += (targetCamY - G.cy) * (dt * 12);
  G.cz += (G.pz + CFG.CAM_D - G.cz) * (dt * 15);
  
  G.lx += (G.px * 0.98 - G.lx) * (dt * 15);
  G.ly += (G.py + 0.5 - G.ly) * (dt * 15);
  G.lz += (G.pz - 22 - G.lz) * (dt * 15);

  camera.position.set(G.cx, G.cy, G.cz);
  camera.lookAt(G.lx, G.ly, G.lz);
  skyMesh.position.copy(camera.position);

  if (ui) ui.updateHUD(G.score, G.spd, CFG.MAX_SPD, G.jumpCharge);
};

const idleCamera = (t) => {
  const a = t * 0.06; // 아주 느긋하고 유려하게 회전하는 고공 시점
  const r = 115.0; // 카메라를 멀리 115m 떨어뜨려 시원하고 웅장한 설산 전경 확보!
  camera.position.set(Math.sin(a) * r, 38, Math.cos(a) * r * 0.75 - 90);
  camera.lookAt(0, 4, -180);
  skyMesh.position.copy(camera.position);

  // 🏔️ 메인 메뉴 대기 시에는 산사태 벽을 멀리 치워 100% 시원하고 깔끔한 배경 전경만 유지!
  if (avalancheSystem) avalancheSystem.updateAvalanche(-9999);
  if (skierData && skierData.updateSurpriseBadge3D) skierData.updateSurpriseBadge3D('off');
};

let prev = 0;
const animate = (ts) => {
  requestAnimationFrame(animate);
  const t = ts * 0.001;
  if (prev === 0) prev = t;
  const dt = Math.min(Math.max(0.001, t - prev), 0.033); // max 30fps delta cap for zero warp speed
  prev = t;

  skyMaterial.uniforms.uTime.value = t;

  // 🤫 개발자 비밀 스테이지 3초 홀드 워프 타이머 체킹 (메인메뉴/인게임 무관 항상 동작!)
  checkSecretCheatWarp(dt);

  if (G.play) {
    update(dt, t);
  } else if (!G.dead) {
    idleCamera(t);
  }

  // 눈은 카메라 로컬 좌표 → 플레이어 위치 파라미터 불필요
  env.updateContinuousSnow(dt);

  renderer.render(scene, camera);
};
animate(0);
