import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { getTerrainY } from './terrain.js';
import { soundFx } from './soundSystem.js';

// ─────────────────────────────────────────────────────────────────
//  ❄️ 눈덩이 장애물 레벨 디자인 & 밟기(Jump Break) & 3초 전 경고 시스템
// ─────────────────────────────────────────────────────────────────
export const createSnowballHazardSystem = (scene) => {
  const snowballs = [];
  const breakParticles = []; // 밟아 부쉈을 때 산산조각 나는 파티클
  let spawnTimer = 0;

  // 눈덩이 geometry & material (파셋된 디테일 3D 눈 덩어리)
  const sphereGeo = new THREE.IcosahedronGeometry(1.0, 2);
  const snowballMat = new THREE.MeshStandardMaterial({
    color: 0xEBF5FF,
    roughness: 0.82,
    metalness: 0.08,
    emissive: 0x152540,
    emissiveIntensity: 0.15,
    flatShading: true,
  });

  // 💥 붕괴 눈가루 파티클 geometry & material
  const particleGeo = new THREE.DodecahedronGeometry(0.35, 0);
  const particleMat = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF,
    roughness: 0.9,
    emissive: 0x88CCFF,
    emissiveIntensity: 0.3,
  });

  // ── 1. 스테이지별 스폰 설정 획득 ──────────────────────────────
  const getStageConfig = (stageNum) => {
    // Stage 3 ~ 10 레벨 디자인
    if (stageNum <= 2) return null; // Stage 1~2는 비활성

    switch (stageNum) {
      case 3:
        return { count: 2, radiusMin: 1.8, radiusMax: 2.3, spdMult: 0.92, cooldown: 3.8 };
      case 4:
        return { count: 2, radiusMin: 2.6, radiusMax: 3.3, spdMult: 0.95, cooldown: 3.6 }; // 크기 증가
      case 5:
        return { count: 2, radiusMin: 2.6, radiusMax: 3.3, spdMult: 1.05, cooldown: 3.4 }; // 속도 살짝 빨라짐
      case 6:
        return { count: 3, radiusMin: 2.6, radiusMax: 3.3, spdMult: 1.05, cooldown: 3.2 }; // 3개 스폰
      case 7:
        return { count: 3, radiusMin: 3.4, radiusMax: 4.4, spdMult: 1.08, cooldown: 3.0 }; // 크기 더 커짐
      case 8:
        return { count: 3, radiusMin: 3.4, radiusMax: 4.4, spdMult: 1.18, cooldown: 2.8 }; // 더 빠르게
      case 9:
        // 3~8 종합 + 3~5개 랜덤 스폰
        const rndCount = 3 + Math.floor(Math.random() * 3); // 3, 4, 5개
        return { count: rndCount, radiusMin: 2.4, radiusMax: 4.2, spdMult: 1.15, cooldown: 2.5 };
      default:
        // Stage 10+: 폭풍 10개! 크기 랜덤, 속도 8스테이지 이상(1.22)
        return { count: 10, radiusMin: 2.2, radiusMax: 4.3, spdMult: 1.22, cooldown: 2.2 };
    }
  };

  // ── 2. 눈덩이 스폰 함수 ─────────────────────────────────────────
  const spawnSnowballGroup = (playerX, playerZ, playerSpd, stageNum) => {
    const cfg = getStageConfig(stageNum);
    if (!cfg) return;

    for (let i = 0; i < cfg.count; i++) {
      const radius = cfg.radiusMin + Math.random() * (cfg.radiusMax - cfg.radiusMin);

      // X 위치: 플레이어 근처 (-65m ~ +65m 범위에 분산)
      const offsetFactor = (i - (cfg.count - 1) / 2);
      const laneX = playerX + offsetFactor * (radius * 3.4 + 9.0) + (Math.random() - 0.5) * 16.0;
      
      // Z 스폰 위치: 플레이어 좌우/약간 뒤 (+15m ~ -10m)에서 쌩- 하고 출현
      const startZ = playerZ + (15.0 - Math.random() * 25.0);

      // 🏎️ 1. 초기 질주 속도: 플레이어 속도의 1.45~1.65배로 슈웅- 하고 전방을 향해 난입!
      const currentPlayerSpd = Math.max(playerSpd, 24.0);
      const initialSpd = currentPlayerSpd * (1.45 + Math.random() * 0.20) * cfg.spdMult;
      
      // 🏎️ 2. 감속 목표 속도: 전방으로 지나친 후 플레이어 속도의 0.75~0.92배로 서서히 감속!
      const targetSpd = currentPlayerSpd * (0.75 + Math.random() * 0.17) * cfg.spdMult;

      const vz = -initialSpd;
      const targetVz = -targetSpd;

      // X축 미세 횡단 흐름
      const vx = (Math.random() - 0.5) * 14.0;

      const mesh = new THREE.Mesh(sphereGeo, snowballMat);
      mesh.scale.setScalar(radius);
      mesh.castShadow = true;

      const startY = getTerrainY(laneX, startZ) + radius;
      mesh.position.set(laneX, startY, startZ);
      scene.add(mesh);

      snowballs.push({
        mesh,
        radius,
        x: laneX,
        y: startY,
        z: startZ,
        vx,
        vz,         // 현재 Z 속도
        targetVz,   // 감속 목표 Z 속도
        decelRate: currentPlayerSpd * 0.45, // 감속 비율 (약 1.5초에 걸쳐 스무스 감속)
        active: true,
        fadeOpacity: 1.0,
      });
    }

    // 스폰 시 슈웅- 지나치는 사운드 연출
    soundFx.playSurprise();
  };

  // ── 3. 눈덩이 밟아 부쉈을 때 파티클 퐁-! 폭발 ──────────────────────
  const triggerBreakExplosion = (x, y, z, radius) => {
    soundFx.playCrash(); // 부서지는 사운드

    const pCount = Math.floor(12 + radius * 5);
    for (let i = 0; i < pCount; i++) {
      const pMesh = new THREE.Mesh(particleGeo, particleMat);
      const scale = 0.6 + Math.random() * 0.8;
      pMesh.scale.setScalar(scale);
      pMesh.position.set(x, y, z);
      scene.add(pMesh);

      // 3D 사방으로 튕겨나가는 속도
      const angle = Math.random() * Math.PI * 2;
      const upSpd = 6.0 + Math.random() * 12.0;
      const outSpd = 5.0 + Math.random() * 14.0;

      breakParticles.push({
        mesh: pMesh,
        vx: Math.cos(angle) * outSpd,
        vy: upSpd,
        vz: Math.sin(angle) * outSpd,
        life: 1.0, // 1초 유지
      });
    }
  };

  // ── 4. 메인 업데이트 루프 ───────────────────────────────────────
  const update = (G, dt, onWarningUpdate, onScoreAdd, showToast) => {
    const stageCfg = getStageConfig(G.stage);

    // Stage 3 미만이거나 컷씬 중일 때는 미발동
    if (!stageCfg || G.isCutscene) {
      if (onWarningUpdate) onWarningUpdate({ show: false });
      cleanupFarObjects(G.pz, dt);
      return;
    }

    // 스폰 쿨다운 타이머
    spawnTimer += dt;

    // ⚠️ 스폰 3초 전 전조 경고 시스템 (쿨다운 종료 3초 전 ~ 1초 전까지 2초간 빨간 네모 느낌표 점등)
    const timeUntilSpawn = stageCfg.cooldown - spawnTimer;
    const isWarningActive = (timeUntilSpawn <= 3.0 && timeUntilSpawn >= 1.0 && !G.isCrashed);

    if (onWarningUpdate) {
      if (isWarningActive) {
        // 경고 표시: 플레이어 전방 좌/우/중앙 3영역 점등 판단
        onWarningUpdate({
          show: true,
          blink: Math.floor(timeUntilSpawn * 6) % 2 === 0, // 2초간 빠르게 점등(깜빡임)
          count: stageCfg.count,
          stage: G.stage,
        });
      } else {
        onWarningUpdate({ show: false });
      }
    }

    // 스폰 타이머 만료 시 눈덩이들 출현!
    if (spawnTimer >= stageCfg.cooldown) {
      spawnTimer = 0;
      if (!G.isCrashed) {
        spawnSnowballGroup(G.px, G.pz, G.spd, G.stage);
      }
    }

    // ── 눈덩이 물리 이동 & 회전 & 밟기/충돌 판정 ─────────────────
    for (const b of snowballs) {
      if (!b.active) continue;

      // 🏎️ 슈웅- 난입 후 플레이어 속도 이하로 서서히 스무스 감속!
      if (b.vz < b.targetVz) { // vz는 음수이므로 targetVz가 더 0에 가까움 (더 큼)
        b.vz = Math.min(b.targetVz, b.vz + b.decelRate * dt);
      }

      b.x += b.vx * dt;
      b.z += b.vz * dt;
      b.y = getTerrainY(b.x, b.z) + b.radius;

      b.mesh.position.set(b.x, b.y, b.z);

      // 플레이어와 비슷한 속도로 아래로 굴러떨어지는 자연스러운 3D 회전
      const speed = Math.sqrt(b.vx * b.vx + b.vz * b.vz);
      const rollAmount = (speed / b.radius) * dt;
      b.mesh.rotation.x -= rollAmount;

      // ── 충돌 & 밟기(Jump Stamp Break) 판정 ─────────────────────
      const dx = G.px - b.x;
      const dy = (G.py + 0.8) - b.y; // 플레이어 발/몸통 기준
      const dz = G.pz - b.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      const hitRadius = b.radius + 1.2;

      if (distSq < hitRadius * hitRadius && !G.isCrashed) {
        // 🦶 💥 파해법: 플레이어가 공중에 떠 있고(inAir) 발이 눈덩이 상단보다 위에 있을 때 밟아 부수기!
        const isAboveSnowball = G.py > (b.y + b.radius * 0.25);

        if (G.inAir && isAboveSnowball) {
          // 🎉 밟아서 눈덩이 부수기 성공!!
          b.active = false;
          scene.remove(b.mesh);
          triggerBreakExplosion(b.x, b.y, b.z, b.radius);

          // 점수 보너스 + Toast 연출
          if (onScoreAdd) onScoreAdd(500);
          if (showToast) showToast('SNOWBALL STAMP! +500', true);

          // 점프 반발력 (살짝 뿅 튀어오름)
          G.vy = Math.max(G.vy, 14.0);
        } else if (G.invincibleTimer <= 0) {
          // 💥 지상에서 그냥 부딪힘 → 와이프아웃 (Crash)
          G.isCrashed = true;
          G.crashTimer = 0;
          soundFx.playCrash();
        }
      }
    }

    // ── 붕괴 파티클 애니메이션 ─────────────────────────────────
    for (let i = breakParticles.length - 1; i >= 0; i--) {
      const p = breakParticles[i];
      p.life -= dt * 1.5;

      if (p.life <= 0) {
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        breakParticles.splice(i, 1);
        continue;
      }

      p.vy -= 25.0 * dt; // 중력
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.mesh.rotation.x += dt * 5.0;
      p.mesh.rotation.y += dt * 5.0;

      // 크기 스르륵 축소
      p.mesh.scale.setScalar(p.life * 0.8);
    }

    cleanupFarObjects(G.pz, dt);
  };

  // ── 5. 시야 벗어난 눈덩이 스르륵 소멸 ───────────────────────────
  const cleanupFarObjects = (playerZ, dt) => {
    for (let i = snowballs.length - 1; i >= 0; i--) {
      const b = snowballs[i];

      // 플레이어보다 너무 멀리 전방 아래로 지나치거나(z < playerZ - 280), 지나쳐서 뒤로 멀어지면 (z > playerZ + 80)
      if (b.z < playerZ - 280 || b.z > playerZ + 80) {
        b.fadeOpacity -= dt * 2.0;
        if (b.fadeOpacity <= 0 || !b.active) {
          scene.remove(b.mesh);
          b.mesh.geometry.dispose();
          snowballs.splice(i, 1);
        }
      }
    }
  };

  // ── 6. 리셋 ───────────────────────────────────────────────────
  const reset = () => {
    for (const b of snowballs) {
      scene.remove(b.mesh);
      b.mesh.geometry.dispose();
    }
    snowballs.length = 0;

    for (const p of breakParticles) {
      scene.remove(p.mesh);
      p.mesh.geometry.dispose();
    }
    breakParticles.length = 0;

    spawnTimer = 0;
  };

  return { update, reset };
};
