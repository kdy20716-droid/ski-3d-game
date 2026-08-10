import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { getTerrainY } from './terrain.js';
import { soundFx } from './soundSystem.js?v=9.0.0';

// ─────────────────────────────────────────────────────────────────
//  ❄️ 눈덩이 장애물: 거대 크기 + 진로 유지(-Z 직진) + 경고 UI 100% 연동
// ─────────────────────────────────────────────────────────────────
export const createSnowballHazardSystem = (scene) => {
  const snowballs = [];
  const breakParticles = [];
  let spawnTimer = 0;

  const sphereGeo = new THREE.IcosahedronGeometry(1.0, 2);
  const snowballMat = new THREE.MeshStandardMaterial({
    color: 0xEBF5FF,
    roughness: 0.82,
    metalness: 0.08,
    emissive: 0x152540,
    emissiveIntensity: 0.15,
    flatShading: true,
  });

  const particleGeo = new THREE.DodecahedronGeometry(0.45, 0);
  const particleMat = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF,
    roughness: 0.9,
    emissive: 0x88CCFF,
    emissiveIntensity: 0.35,
  });

  // ── 1. 스테이지별 스폰 설정 (큼직한 웅장한 크기!) ─────────────────
  const getStageConfig = (stageNum) => {
    if (stageNum <= 2) return null; // Stage 1~2 비활성 (게임 디자인 의도)

    switch (stageNum) {
      case 3:
        return { count: 2, radiusMin: 3.5, radiusMax: 4.3, spdMult: 1.0, cooldown: 4.5 };
      case 4:
        return { count: 2, radiusMin: 4.5, radiusMax: 5.4, spdMult: 1.0, cooldown: 4.2 }; // 거대화
      case 5:
        return { count: 2, radiusMin: 4.5, radiusMax: 5.4, spdMult: 1.08, cooldown: 4.0 };
      case 6:
        return { count: 3, radiusMin: 4.5, radiusMax: 5.4, spdMult: 1.08, cooldown: 3.8 };
      case 7:
        return { count: 3, radiusMin: 5.5, radiusMax: 6.8, spdMult: 1.10, cooldown: 3.5 }; // 초대형
      case 8:
        return { count: 3, radiusMin: 5.5, radiusMax: 6.8, spdMult: 1.20, cooldown: 3.2 };
      case 9:
        const rndCount = 3 + Math.floor(Math.random() * 3);
        return { count: rndCount, radiusMin: 4.2, radiusMax: 6.5, spdMult: 1.15, cooldown: 2.8 };
      default:
        // 10스테이지: 미니, 미디엄, 초대형 자이언트 눈덩이가 100% 무작위 올-랜덤 난입!
        const rndCount10 = 4 + Math.floor(Math.random() * 4);
        return { count: rndCount10, radiusMin: 2.0, radiusMax: 7.5, spdMult: 1.25, cooldown: 2.0 };
    }
  };

  // ── 2. 눈덩이 스폰 함수 (플레이어 좌/우 뒤쪽에서 발사 → 전방 향해 빠르게 굴러가다 천천히 감속!) ──
  const spawnSnowballGroup = (playerX, playerZ, playerSpd, stageNum) => {
    const cfg = getStageConfig(stageNum);
    if (!cfg) return;

    const currentPlayerSpd = Math.max(playerSpd, 26.0);

    for (let i = 0; i < cfg.count; i++) {
      const radius = cfg.radiusMin + Math.random() * (cfg.radiusMax - cfg.radiusMin);
      const side = (i % 2 === 0) ? -1 : 1; // 0번째: 좌측 뒤, 1번째: 우측 뒤

      // 🏔️ 내 좌/우 뒤쪽에서 발사 (좌우 ±55~80m, 뒤쪽 10~25m)
      const startX = playerX + side * (55.0 + Math.random() * 25.0);
      const startZ = playerZ + (10.0 + Math.random() * 15.0);

      // 🏎️ 초기 발사 속도: 플레이어보다 훨씬 빠르게(1.65~1.9배) 전방 향해 솟구침! (쭉 굴러감)
      const initialSpd = currentPlayerSpd * (1.65 + Math.random() * 0.25) * cfg.spdMult;

      // 🛑 전방으로 사격 후 감속 목표 속도: 플레이어 속도의 15~30% (천천히 감속)
      const brakeFinalSpd = currentPlayerSpd * (0.15 + Math.random() * 0.15) * cfg.spdMult;

      // 🎯 사선 크로스 궤적: 중앙/반대쪽으로 오도록 X 속도
      const vx = -side * (12.0 + Math.random() * 10.0);

      const mesh = new THREE.Mesh(sphereGeo, snowballMat);
      mesh.scale.setScalar(radius);
      mesh.castShadow = true;

      const startY = getTerrainY(startX, startZ) + radius;
      mesh.position.set(startX, startY, startZ);
      scene.add(mesh);

      // brakeDelay: 1.8~2.6초 동안 플레이어를 추월하며 앞으로 쭉 굴러간 뒤 천천히 브레이크!
      const brakeDelay = 1.8 + Math.random() * 0.8;

      snowballs.push({
        mesh,
        radius,
        x: startX,
        y: startY,
        z: startZ,
        vx,
        vz: -initialSpd,              // 발사 시 아주 빠름
        brakeFinalVz: -brakeFinalSpd, // 감속 후 목표 속도
        brakeDelay,                   // 쭉 굴러가는 시간
        stateTimer: 0,
        braking: false,
        spawnZ: startZ,
        active: true,
      });
    }

    soundFx.playSurprise();
  };

  // ── 3. 밟아 부쉈을 때 파티클 퐁-! 폭발 ──────────────────────
  const triggerBreakExplosion = (x, y, z, radius) => {
    soundFx.playCrash();
    const pCount = Math.floor(18 + radius * 4);
    for (let i = 0; i < pCount; i++) {
      const pMesh = new THREE.Mesh(particleGeo, particleMat);
      pMesh.scale.setScalar(0.6 + Math.random() * 0.8);
      pMesh.position.set(x, y, z);
      scene.add(pMesh);

      const angle = Math.random() * Math.PI * 2;
      const upSpd = 7.0 + Math.random() * 15.0;
      const outSpd = 6.0 + Math.random() * 16.0;

      breakParticles.push({
        mesh: pMesh,
        vx: Math.cos(angle) * outSpd,
        vy: upSpd,
        vz: Math.sin(angle) * outSpd,
        life: 1.0,
      });
    }
  };

  // ── 4. 메인 업데이트 루프 ───────────────────────────────────────
  const update = (G, dt, onWarningUpdate, onScoreAdd, showToast) => {
    const stageCfg = getStageConfig(G.stage);

    if (!stageCfg || G.isCutscene) {
      if (onWarningUpdate) onWarningUpdate({ show: false });
      cleanupFarObjects(G.pz, dt);
      return;
    }

    spawnTimer += dt;

    // ⚠️ [스폰 전 좌/우 모서리 붉은 느낌표 전조 경고]: 
    // 눈덩이를 쏘기 전 3.0초~0.1초 전까지만 좌/우 모서리 느낌표가 빠르게 깜빡이고, 쏘는 순간 OFF!
    const timeUntilSpawn = stageCfg.cooldown - spawnTimer;
    const isPreSpawnWarning = (timeUntilSpawn <= 3.0 && timeUntilSpawn > 0.10 && !G.isCrashed);

    if (onWarningUpdate) {
      if (isPreSpawnWarning) {
        onWarningUpdate({
          showLeft: true,
          showRight: true,
        });
      } else {
        onWarningUpdate({ showLeft: false, showRight: false });
      }
    }

    if (spawnTimer >= stageCfg.cooldown) {
      spawnTimer = 0;
      spawnSnowballGroup(G.px, G.pz, G.spd, G.stage);
    }

    // ── 눈덩이 물리: 내 좌/우 뒤에서 빠른 속도로 출발해 전방으로 굴러가다 천천히 감속 ─
    for (const b of snowballs) {
      if (!b.active) continue;

      b.stateTimer += dt;

      if (!b.braking && b.stateTimer >= b.brakeDelay) {
        // 🛑 전방 도착 후 부드러운 브레이크/감속 시작!
        b.braking = true;
      }

      if (b.braking) {
        // 약 2초에 걸쳐 부드럽게 감속
        const brakeLerp = 1.0 - Math.pow(1.0 - 0.25, dt * 60);
        b.vz += (b.brakeFinalVz - b.vz) * brakeLerp;
        b.vx *= 0.99; // 사선 이동도 부드럽게 줄어듦
      }

      // 🛹 점프대(Kicker Ramp) 상호작용: 점프대를 지나면 위로 살짝 붕-! 떠오름
      if (G.kickerRampList) {
        for (const ramp of G.kickerRampList) {
          if (Math.abs(b.x - ramp.x) < 7.5 && Math.abs(b.z - ramp.z) < 11.0) {
            if (!b.inAir) {
              b.inAir = true;
              b.vy = 14.0; // 점프대 끝에서 붕 떠오르는 Y 속도!
            }
          }
        }
      }

      b.x += b.vx * dt;
      b.z += b.vz * dt;

      const groundY = getTerrainY(b.x, b.z) + b.radius;

      if (b.inAir) {
        b.vy = (b.vy || 0) - 35.0 * dt; // 중력
        b.y += (b.vy || 0) * dt;

        if (b.y <= groundY) {
          b.y = groundY;
          b.inAir = false;
          b.vy = 0;
        }
      } else {
        b.y = groundY;
      }

      b.mesh.position.set(b.x, b.y, b.z);

      const speed = Math.abs(b.vz);
      const rollAmount = (speed / b.radius) * dt;
      b.mesh.rotation.x -= rollAmount;

      // ── 충돌 & 밟기(Jump Stomp Break) 판정 (X/Z 수평 거리와 Y 높이 독립 분리로 100% 밟기 보장!) ─────────────────────
      const dx = G.px - b.x;
      const dz = G.pz - b.z;
      const distXZSq = dx * dx + dz * dz;
      const hitRadiusXZ = b.radius + 1.65; // 수평 감지 범위 넉넉히 확보!

      if (G.selectedChar !== 'beta' && distXZSq < hitRadiusXZ * hitRadiusXZ && !G.isCrashed) {
        const groundY = getTerrainY(G.px, G.pz);
        const isJumpingState = G.inAir || (G.py > groundY + 0.15) || (G.vy > 0);
        // 플레이어 foot Y 높이가 눈덩이 중간 이상에 위치하는지 체크
        const isAboveSnowball = G.py >= (b.y - b.radius * 0.85);

        if (isJumpingState && isAboveSnowball) {
          // 🎉 [살짝이라도 점프 상태면 100% 밟기 점프 발동!]: 눈덩이 퐁-! 파괴 소멸 & 상공 36m 고공 점프!
          b.active = false;
          scene.remove(b.mesh);
          triggerBreakExplosion(b.x, b.y, b.z, b.radius);

          if (onScoreAdd) onScoreAdd(300);
          if (showToast) showToast('SNOWBALL STOMP JUMP! 💥', true);

          // 🚀 상공으로 붕- 솟구치는 밟기 점프!
          G.inAir = true;
          G.airTimeTimer = 0;
          G.vy = 36.0;
          soundFx.playKickerLaunch(); // 밟기 점프 도약음 사운드!
        } else if (G.invincibleTimer <= 0 && Math.abs(G.py - b.y) < b.radius + 0.6) {
          // 💥 지상 눈덩이 충돌: 0.3초 빠른 스턴 회복 + 붉은 충격 비넷 + 3초 무적!
          G.spd = 0;
          G.stunTimer = 0.3;       // 0.3초 빠른 스턴 회복!
          G.invincibleTimer = 3.0; // 3초 무적 반투명 깜빡임
          soundFx.playCrash();

          if (showToast) showToast('CRASH! 3초 무적 ⚡', false);
          b.active = false;
          scene.remove(b.mesh);
          triggerBreakExplosion(b.x, b.y, b.z, b.radius);

          // 🌌 붉은 충격 비넷 리스폰 연출
          if (G.triggerDissolveRespawn) {
            G.triggerDissolveRespawn(() => {
              G.px = b.x * 0.15; // 안전 지대로 리스폰
            });
          } else {
            G.px = b.x * 0.15;
          }
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

      p.vy -= 25.0 * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.mesh.rotation.x += dt * 5.0;
      p.mesh.scale.setScalar(p.life * 0.8);
    }

    cleanupFarObjects(G.pz, dt);
  };

  // ── 5. 소멸 조건: 플레이어가 지나쳤거나 너무 멀면 소멸 ─────────────
  const cleanupFarObjects = (playerZ, dt) => {
    for (let i = snowballs.length - 1; i >= 0; i--) {
      const b = snowballs[i];
      // 플레이어 뒤 30m 이상 지나쳤거나, 너무 앞에 있거나, 비활성
      if (b.z > playerZ + 30.0 || b.z < playerZ - 400.0 || !b.active) {
        scene.remove(b.mesh);
        b.mesh.geometry.dispose();
        snowballs.splice(i, 1);
      }
    }
  };

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
