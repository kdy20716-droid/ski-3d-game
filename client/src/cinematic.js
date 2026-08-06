import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { soundFx } from './soundSystem.js?v=2.3.2';

// 🎬 오프닝 시네마틱 컷씬 (산사태 바짝 덮침 ➔ 놀란 스키어 ! 경고 팝업 ➔ 빠르게 전속력 하강!)
export const updateOpeningCutscene = (G, dt, camera, skier, ui, getTerrainY, avalancheSystem, CFG, skierData) => {
  G.cutsceneTimer += dt;
  const t = G.cutsceneTimer;

  // 1. 산사태 3D 벽 추격 위치 (220m 뒤에서 출발하여 바짝 덮쳐오는 웅장한 긴장감 75m 유지!)
  G.avalancheZ = G.pz + Math.max(75.0, 220.0 - t * 45.0);
  if (avalancheSystem) avalancheSystem.updateAvalanche(G.avalancheZ);

  // 2. 3D ! 경고 뱃지: 컷씬 시작 직후(0.05s) 3D 스키어 머리 위 2.9m 위치에 팝업 ➔ 1.1초 후 스르륵 페이드 아웃!
  if (t > 0.05 && t < 1.10) {
    if (!G.wasSurpriseSound) {
      G.wasSurpriseSound = true;
      soundFx.playSurprise(); // ❗ 깜짝 놀람 사운드 FX
    }
    if (skierData && skierData.updateSurpriseBadge3D) skierData.updateSurpriseBadge3D('show');
  } else if (t >= 1.10 && t < 1.70) {
    if (skierData && skierData.updateSurpriseBadge3D) skierData.updateSurpriseBadge3D('fadeout');
  } else {
    if (skierData && skierData.updateSurpriseBadge3D) skierData.updateSurpriseBadge3D('off');
  }

  // 3. SKIP - SPACEBAR 하단 깜빡임 힌트 컷씬 동안 표출
  if (ui && ui.showSkipHint) ui.showSkipHint(true);

  // 4. 깜짝 놀란 스키어가 공중 튀어오른 후 빠르게 전속력 하강 내려오는 연출!
  if (t > 0.40 && t < 1.40) {
    G.py = getTerrainY(G.px, G.pz) + Math.sin((t - 0.40) * Math.PI / 1.0) * 4.5;
  } else {
    G.py = getTerrainY(G.px, G.pz);
  }

  // 놀란 스키어가 0.8초 후부터 앞으로 부드럽고 스피디하게 하강 내달림! (dt 프레임 기반 - 광속 이동 100% 완치!)
  if (t > 0.80) {
    const cutsceneSpd = CFG.BASE_SPD * 1.15;
    G.pz -= cutsceneSpd * dt;
    G.dist = -G.pz;
  }

  skier.position.set(0, G.py, G.pz);

  // 5. 하강하는 스키어를 바짝 따라가는 다이내믹 카메라 보간
  const startCamY = G.py + 48;
  const startCamZ = G.pz - 55.0;
  const targetCamY = G.py + CFG.CAM_H;
  const targetCamZ = G.pz + CFG.CAM_D;

  const startLookY = G.py + 1.5;
  const startLookZ = G.pz;
  const targetLookY = G.py + 0.5;
  const targetLookZ = G.pz - 22.0;

  if (t <= 1.2) {
    G.cx = 0; G.cy = startCamY; G.cz = startCamZ;
    G.lx = 0; G.ly = startLookY; G.lz = startLookZ;
  } else {
    const p = Math.min(1.0, (t - 1.2) / 2.0);
    const easeP = p * p * (3 - 2 * p); // Smoothstep 이징 곡선

    G.cx = 0;
    G.cy = THREE.MathUtils.lerp(startCamY, targetCamY, easeP);
    G.cz = THREE.MathUtils.lerp(startCamZ, targetCamZ, easeP);

    G.lx = 0;
    G.ly = THREE.MathUtils.lerp(startLookY, targetLookY, easeP);
    G.lz = THREE.MathUtils.lerp(startLookZ, targetLookZ, easeP);
  }

  camera.position.set(G.cx, G.cy, G.cz);
  camera.lookAt(G.lx, G.ly, G.lz);

  if (t >= 3.2) {
    G.isOpeningCutscene = false;
    G.inAir = false;
    G.vy = 0;
    G.py = getTerrainY(G.px, G.pz);
    G.spd = CFG.BASE_SPD; // 인게임 정상 시작 속도로 무결점 안착!
    
    // 🏔️ 컷씬 종료 직후 3초 유예 시간 시작 및 산사태를 1스테이지 최상급 95m 뒤로 넉넉하게 배치!
    G.avalancheGraceTimer = 3.0;
    G.avalancheZ = G.pz + 95.0;
    if (avalancheSystem) avalancheSystem.updateAvalanche(G.avalancheZ);

    // 카메라 좌표 100% 인게임 3인칭 뷰와 일치화
    G.cx = G.px; G.cy = G.py + CFG.CAM_H; G.cz = G.pz + CFG.CAM_D;
    G.lx = G.px; G.ly = G.py + 0.5; G.lz = G.pz - 22.0;

    if (skierData && skierData.updateSurpriseBadge3D) skierData.updateSurpriseBadge3D('off');
    if (ui && ui.showSkipHint) ui.showSkipHint(false);
  }
};

// 🤸‍♂️ 도전 모드 10스테이지 완주 360도 공중제비 (Backflip Kick) 피날레 세레머니
export const updateVictoryCeremony = (G, dt, camera, skier, ui, getTerrainY) => {
  if (!G.wasVictorySound) {
    G.wasVictorySound = true;
    soundFx.playVictory(); // 🏆 승리 팡파르 soundFx
  }
  G.victoryTimer += dt;
  const vt = G.victoryTimer;

  // 캐릭터 360도 공중제비 (Backflip Kick)
  skier.rotation.x = Math.min(Math.PI * 2, vt * Math.PI * 2.2);
  G.py = getTerrainY(G.px, G.pz) + Math.sin(Math.min(1.0, vt / 1.2) * Math.PI) * 10.0;
  skier.position.set(G.px, G.py, G.pz);

  // 전면 앵글 세레머니 카메라
  camera.position.set(G.px, G.py + 3.0, G.pz - 9.0);
  camera.lookAt(G.px, G.py + 1.8, G.pz);

  if (ui && ui.showVictoryOverlay) ui.showVictoryOverlay(true);

  if (vt >= 2.8) {
    G.play = false;
    if (ui) ui.showScreen('over', `🏆 <strong>SURVIVED! CHAMPION VICTORY!</strong><br>최종 점수: <strong>${Math.floor(G.score)} pts</strong><br>산사태 탈출 성공 및 리더보드 등록 완료!`);
  }
};
