import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { getTerrainY } from './terrain.js?v=35.0.0';

export const createExplodingSnowballHazardSystem = (scene, camera) => {
  const bombs = [];
  const snowDustParticles = [];
  const fireworks = [];
  let spawnTimer = 0;
  let stompCombo = 0;

  // 기본 눈 구체 지오메트리 & 재질
  const baseSphereGeo = new THREE.IcosahedronGeometry(1.0, 2);
  const baseSnowMat = new THREE.MeshStandardMaterial({
    color: 0xF2F7FF, roughness: 0.7, emissive: 0x112233, emissiveIntensity: 0.15, flatShading: true
  });

  // 빨간 폭발 붉은 가시 돌기 지오메트리 & 발광 재질
  const spikeGeo = new THREE.DodecahedronGeometry(0.48, 1);
  const redEmissiveMat = new THREE.MeshStandardMaterial({
    color: 0xFF0022, roughness: 0.2, emissive: 0xFF0011, emissiveIntensity: 4.0, flatShading: true
  });

  // 💣 3D 돌눈덩이 스타일 폭발 눈덩이 생성 팩토리
  const createExplodingSnowballMesh = (radius) => {
    const group = new THREE.Group();
    const snowMat = baseSnowMat.clone();
    const snowMesh = new THREE.Mesh(baseSphereGeo, snowMat);
    snowMesh.scale.setScalar(radius);
    snowMesh.castShadow = true;
    group.add(snowMesh);

    // 표면에 콕콕 박혀 빠르게 깜빡이는 붉은 돌기들
    const spikes = [];
    const spikeCount = 8;
    for (let i = 0; i < spikeCount; i++) {
      const sMat = redEmissiveMat.clone();
      const spikeMesh = new THREE.Mesh(spikeGeo, sMat);
      const sScale = radius * (0.35 + Math.random() * 0.25);
      spikeMesh.scale.setScalar(sScale);

      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const rPos = radius * 0.90;

      spikeMesh.position.set(
        rPos * Math.sin(phi) * Math.cos(theta),
        rPos * Math.sin(phi) * Math.sin(theta),
        rPos * Math.cos(phi)
      );
      spikeMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      spikeMesh.castShadow = true;
      group.add(spikeMesh);
      spikes.push(sMat);
    }

    scene.add(group);
    return { group, snowMat, spikes };
  };

  // ❄️ 3D 순수 하얀 눈가루 폭발 파티클 (펑! 터질 때 사방으로 퍼지는 눈 조각)
  const triggerSnowExplosion = (x, y, z) => {
    const particleMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF, roughness: 0.3, transparent: true, opacity: 0.95,
      emissive: 0xEEF8FF, emissiveIntensity: 0.5
    });

    for (let i = 0; i < 45; i++) {
      const size = 0.35 + Math.random() * 0.75;
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(size, 8, 8), particleMat.clone());
      mesh.position.set(x, y, z);
      scene.add(mesh);

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const spd = 12.0 + Math.random() * 24.0;

      snowDustParticles.push({
        mesh,
        vx: Math.sin(phi) * Math.cos(theta) * spd,
        vy: Math.cos(phi) * spd * 0.8 + 6.0,
        vz: Math.sin(phi) * Math.sin(theta) * spd,
        life: 0.9, maxLife: 0.9
      });
    }
  };

  // 🎆 10-콤보 양옆 축하 폭죽 이펙트
  const triggerFireworks = (soundFx) => {
    if (soundFx && soundFx.playVictory) soundFx.playVictory();
    const colors = [0xFF0055, 0x00FFCC, 0xFFDD00, 0xFF33FF, 0x0099FF, 0xFF9900];
    [-18.0, 18.0].forEach(sideX => {
      for (let i = 0; i < 35; i++) {
        const pMat = new THREE.MeshBasicMaterial({
          color: colors[Math.floor(Math.random() * colors.length)],
          transparent: true, opacity: 1.0
        });
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.45, 6, 6), pMat);
        mesh.position.set(sideX, 14.0 + Math.random() * 6.0, -22.0);
        if (camera) camera.add(mesh);

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const spd = 12.0 + Math.random() * 18.0;

        fireworks.push({
          mesh,
          vx: Math.sin(phi) * Math.cos(theta) * spd,
          vy: Math.cos(phi) * spd,
          vz: Math.sin(phi) * Math.sin(theta) * spd,
          life: 1.8, maxLife: 1.8
        });
      }
    });
  };

  // 💣 스폰 함수 (돌눈덩이와 동일하게 플레이어 전방에서 스폰)
  const spawnExplodingSnowball = (playerX, playerZ, playerSpd, soundFx) => {
    const radius = 2.5 + Math.random() * 1.5;
    const sideOffset = (Math.random() < 0.5 ? -1 : 1) * (15.0 + Math.random() * 30.0);
    const startX = playerX + sideOffset;
    const startZ = playerZ - (15.0 + Math.random() * 25.0);

    const bObj = createExplodingSnowballMesh(radius);
    const startY = getTerrainY(startX, startZ) + radius;
    bObj.group.position.set(startX, startY, startZ);

    const currentPlayerSpd = Math.max(playerSpd, 24.0);

    bombs.push({
      group: bObj.group,
      snowMat: bObj.snowMat,
      spikes: bObj.spikes,
      radius,
      x: startX, y: startY, z: startZ,
      vx: (Math.random() - 0.5) * 8.0,
      vz: -(currentPlayerSpd * 1.5), // 돌눈덩이처럼 처음에 앞으로 슈웅-!
      braking: false,
      stateTimer: 0,
      active: true,
    });

    if (soundFx && soundFx.playSurprise) soundFx.playSurprise();
  };

  // 💣 메인 업데이트 (돌눈덩이 물리 + 다가오기 + 밟기 불발 + 3.8초 미해제 시 폭발 넉백)
  const update = (G, dt, soundFx, ui) => {
    const currentStage = G.effectiveStage || G.stage;
    // 7스테이지 이상 전용 (10스테이지 올-랜덤 난입)
    if (currentStage < 7 || G.isOpeningCutscene || G.isVictoryCeremony) {
      return;
    }

    // 🎯 콤보 초기화 규칙: 플레이어가 땅(설산 지면)을 밟으면 연속 밟기 콤보 리셋!
    if (!G.inAir) {
      stompCombo = 0;
    }

    // 눈가루 파티클 시뮬레이션
    for (let i = snowDustParticles.length - 1; i >= 0; i--) {
      const p = snowDustParticles[i];
      p.life -= dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt - 10.0 * dt * dt;
      p.mesh.position.z += p.vz * dt;
      p.mesh.material.opacity = Math.max(0, p.life / p.maxLife);
      p.mesh.scale.setScalar(1.0 + (1.0 - p.life / p.maxLife) * 0.8);

      if (p.life <= 0) {
        scene.remove(p.mesh);
        snowDustParticles.splice(i, 1);
      }
    }

    // 폭죽 이펙트 시뮬레이션
    for (let i = fireworks.length - 1; i >= 0; i--) {
      const fw = fireworks[i];
      fw.life -= dt;
      fw.mesh.position.x += fw.vx * dt;
      fw.mesh.position.y += fw.vy * dt - 9.8 * dt * dt;
      fw.mesh.position.z += fw.vz * dt;
      fw.mesh.material.opacity = Math.max(0, fw.life / fw.maxLife);

      if (fw.life <= 0) {
        if (camera) camera.remove(fw.mesh);
        fireworks.splice(i, 1);
      }
    }

    // 스폰 쿨다운 (Stage 7~9: 3.5초, Stage 10: 2.4초 올-랜덤 난입)
    spawnTimer += dt;
    const cooldown = G.stage === 10 ? 2.4 : 3.5;
    if (spawnTimer >= cooldown) {
      spawnTimer = 0;
      if (G.play && !G.dead) {
        spawnExplodingSnowball(G.px, G.pz, G.spd, soundFx);
      }
    }

    // 💣 돌눈덩이 동일 물리 & 다가오기 & 붉은 깜빡임 & 충돌/밟기
    for (let i = bombs.length - 1; i >= 0; i--) {
      const b = bombs[i];
      if (!b.active) continue;

      b.stateTimer += dt;

      // 🚨 [필수 해제 폭발 눈덩이 AI]: 돌눈덩이보다 천천히 내려가면서 유도 추격!
      if (b.stateTimer > 0.6 && !b.braking) {
        b.braking = true;
      }

      if (b.braking) {
        const targetVz = -(G.spd * 0.40); // 돌눈덩이보다 천천히 내려가 플레이어가 쉽게 접근 가능!
        b.vz += (targetVz - b.vz) * dt * 3.5;

        // 플레이어 캐릭터 쪽으로 끈질기게 유도 다가옴!
        const dxToPlayer = G.px - b.x;
        b.vx += (dxToPlayer * 2.2 - b.vx) * dt * 2.5;
      }

      b.x += b.vx * dt;
      b.z += b.vz * dt;
      b.y = getTerrainY(b.x, b.z) + b.radius;
      b.group.position.set(b.x, b.y, b.z);

      // 구르는 회전 애니메이션
      const speed = Math.sqrt(b.vx * b.vx + b.vz * b.vz);
      const rollAmount = (speed / b.radius) * dt;
      b.group.rotation.x -= rollAmount;

      // 🔴 빨간색 초강력 발광 점멸 연출 (해제 시간이 임박할수록 35Hz로 폭주 발광!)
      const blinkFreq = 6.0 + Math.min(1.0, b.stateTimer / 3.8) * 28.0;
      const isRed = Math.sin(performance.now() * 0.001 * blinkFreq) > 0;

      if (isRed) {
        b.snowMat.color.setHex(0xFF0022);
        b.snowMat.emissive.setHex(0xFF0011);
        b.snowMat.emissiveIntensity = 2.5;
        b.spikes.forEach(s => { s.emissiveIntensity = 7.0; });
      } else {
        b.snowMat.color.setHex(0xF2F7FF);
        b.snowMat.emissive.setHex(0x112233);
        b.snowMat.emissiveIntensity = 0.15;
        b.spikes.forEach(s => { s.emissiveIntensity = 3.5; });
      }

      // ── 1. 공중 밟기(Jump Stomp Disarm) 해제 판정 ─────────────────────────
      const dx = G.px - b.x;
      const dz = G.pz - b.z;
      const distXZSq = dx * dx + dz * dz;
      const hitRadiusXZ = b.radius + 1.85;

      const relY = G.py - b.y;
      const isStompHeight = G.inAir && (relY >= b.radius * 0.25) && (relY <= b.radius * 2.2);

      if (distXZSq < hitRadiusXZ * hitRadiusXZ && isStompHeight) {
        // 🎉 [필수 해제 성공!]: 밟으면 폭발하지 않고 눈가루 소멸 & 공중 36m 스프링 솟구침!
        b.active = false;
        scene.remove(b.group);
        triggerSnowExplosion(b.x, b.y, b.z);

        stompCombo += 1;
        const comboPts = Math.min(10, stompCombo) * 100;
        G.score += comboPts;
        if (ui && ui.updateScore) ui.updateScore(G.score);

        G.inAir = true;
        G.airTimeTimer = 0;
        G.vy = 36.0;
        if (soundFx && soundFx.playKickerLaunch) soundFx.playKickerLaunch();

        if (stompCombo === 10) {
          G.score += 10000;
          if (ui) {
            ui.showToast('👑 콤보왕! COMBO KING! 👑', '+10,000 BONUS PTS! 🎉');
            if (ui.showBonusToast) ui.showBonusToast('👑 콤보왕 10-COMBO MASTER! +10,000 PTS 🎆', true);
          }
          triggerFireworks(soundFx);
        } else {
          if (ui && ui.showBonusToast) ui.showBonusToast(`STOMP! +${comboPts} PTS (COMBO x${stompCombo}) 👟✨`, true);
        }
        bombs.splice(i, 1);
        continue;
      }

      // ── 2. 캐릭터와 가로로 같은 선상(Z 라인) 도달 시 펑! 대폭발 판정 ────────
      const hasReachedPlayerZ = (b.z >= G.pz - 0.5);

      if (hasReachedPlayerZ || b.stateTimer >= 4.5) {
        b.active = false;
        scene.remove(b.group);
        triggerSnowExplosion(b.x, b.y, b.z);

        // 💥 폭발 중심점과의 2D XZ 거리 계산
        const distXZ = Math.hypot(G.px - b.x, G.pz - b.z);
        const blastRadius = b.radius + 6.0; // 최대 폭발 반격 영역

        if (distXZ < blastRadius) {
          if (!G.inAir) {
            // 💥 타이밍 점프 실패: 폭발 충격파에 휩쓸려 거리 비례 방사형 넉백!
            if (G.selectedChar !== 'beta' && G.invincibleTimer <= 0) {
              const factor = Math.max(0.2, (blastRadius - distXZ) / blastRadius); // 0.2 ~ 1.0 거리 밀집도
              
              // 1) 후방 Z 넉백 (폭발 중심과 가까울수록 최소 8m ~ 최대 22m 강력 튕김!)
              const knockbackZ = 8.0 + factor * 14.0;
              G.pz += knockbackZ;

              // 2) 측면 X 방사형 넉백 (폭발 위치 기준 좌/우 밀쳐냄!)
              const dirX = (G.px - b.x) >= 0 ? 1 : -1;
              const knockbackX = dirX * (3.0 + factor * 7.0);
              G.px = Math.max(-28.0, Math.min(28.0, G.px + knockbackX));

              // 3) 속도 감속 & 감전 스턴
              if (factor > 0.55) {
                G.spd = 0;
                G.stunTimer = 0.6;
                if (ui && ui.showBonusToast) ui.showBonusToast('💣 DIRECT BLAST HIT! 💥', false);
              } else {
                G.spd = Math.max(0, G.spd - 24.0 * factor);
                G.stunTimer = 0.3;
                if (ui && ui.showBonusToast) ui.showBonusToast('💣 BLAST WAVE IMPACT! 💨', false);
              }

              G.invincibleTimer = 2.0;
            }
          } else {
            // 🦘 타이밍 점프 성공: 공중에 떠 있어서 같은 라인 폭발 피함 세이프!
            if (ui && ui.showBonusToast) ui.showBonusToast('SAFE TIMING JUMP! 🦘✨', true);
          }
        }

        if (soundFx && soundFx.playCrash) soundFx.playCrash();
        bombs.splice(i, 1);
      }
    }
  };

  const reset = () => {
    for (const b of bombs) {
      if (b.group) scene.remove(b.group);
    }
    for (const p of snowDustParticles) {
      if (p.mesh) scene.remove(p.mesh);
    }
    for (const fw of fireworks) {
      if (camera) camera.remove(fw.mesh);
    }
    bombs.length = 0;
    snowDustParticles.length = 0;
    fireworks.length = 0;
    spawnTimer = 0;
    stompCombo = 0;
  };

  return { update, reset };
};
