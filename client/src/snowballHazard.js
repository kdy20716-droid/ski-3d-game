import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { getTerrainY } from './terrain.js';
import { soundFx } from './soundSystem.js';

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
    if (stageNum <= 2) return null; // Stage 1~2 비활성

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
        return { count: 10, radiusMin: 4.0, radiusMax: 6.8, spdMult: 1.25, cooldown: 2.4 };
    }
  };

  // 🏔️ 좌/우 모서리 끝쪽 스폰 위치 계산 (경고 UI 및 실제 스폰 동기화)
  const calculateSpawnPositions = (playerX, count, radiusMin) => {
    const list = [];
    for (let i = 0; i < count; i++) {
      // 0, 2, 4번째는 좌측 모서리 끝(-90m~-120m), 1, 3, 5번째는 우측 모서리 끝(+90m~+120m)
      const side = (i % 2 === 0) ? -1 : 1;
      const x = playerX + side * (85.0 + (i * 12.0) % 35.0);
      list.push(x);
    }
    return list;
  };

  // ── 2. 눈덩이 스폰 함수 (좌/우 모서리 끝쪽에서 출현!) ───────────────
  const spawnSnowballGroup = (playerX, playerZ, playerSpd, stageNum) => {
    const cfg = getStageConfig(stageNum);
    if (!cfg) return;

    const currentPlayerSpd = Math.max(playerSpd, 26.0);
    const spawnXList = calculateSpawnPositions(playerX, cfg.count, cfg.radiusMin);

    for (let i = 0; i < cfg.count; i++) {
      const radius = cfg.radiusMin + Math.random() * (cfg.radiusMax - cfg.radiusMin);
      const startX = spawnXList[i];
      const side = (i % 2 === 0) ? -1 : 1;
      const startZ = playerZ + (5.0 - Math.random() * 15.0); // 플레이어 측면/약간 전방

      // 🏎️ 초기 속도: 플레이어보다 빠른 속도로 전방 300m 향해 솟구침!
      const initialSpd = currentPlayerSpd * (1.65 + Math.random() * 0.25) * cfg.spdMult;
      
      // 🏎️ 300m 지나친 후 감속 목표 속도 (플레이어 속도의 0.75배로 직진 굴러감)
      const targetSpd = currentPlayerSpd * (0.75 + Math.random() * 0.12) * cfg.spdMult;

      // 🎯 [사선 크로스 궤적]:
      // 왼쪽 모서리 눈덩이는 전방 중앙~오른쪽으로, 오른쪽 모서리 눈덩이는 전방 중앙~왼쪽으로 가로지르는 X 속도
      const vx = -side * (14.0 + Math.random() * 18.0);

      const mesh = new THREE.Mesh(sphereGeo, snowballMat);
      mesh.scale.setScalar(radius);
      mesh.castShadow = true;

      const startY = getTerrainY(startX, startZ) + radius;
      mesh.position.set(startX, startY, startZ);
      scene.add(mesh);

      snowballs.push({
        mesh,
        radius,
        x: startX,
        y: startY,
        z: startZ,
        vx,
        vz: -initialSpd,
        targetVz: -targetSpd,
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

    // ── 눈덩이 물리 이동 & 300m 전방 감속 ───────────────────────
    for (const b of snowballs) {
      if (!b.active) continue;

      // 🏎️ 300m 전방으로 솟구친 후 내 진로 방향(-Z)으로 감속 굴러감!
      const distAhead = b.spawnZ - b.z;
      if (distAhead > 260.0 && b.vz < b.targetVz) {
        b.vz = Math.min(b.targetVz, b.vz + (G.spd * 0.75) * dt);
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

      // ── 충돌 & 밟기(Jump Stamp Break) 판정 ─────────────────────
      const dx = G.px - b.x;
      const dy = (G.py + 0.8) - b.y;
      const dz = G.pz - b.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      const hitRadius = b.radius + 1.35;

      if (distSq < hitRadius * hitRadius && !G.isCrashed) {
        const isAboveSnowball = G.py > (b.y + b.radius * 0.15);

        if (G.inAir && isAboveSnowball) {
          // 🎉 점프해서 밟아 부수기 성공!
          b.active = false;
          scene.remove(b.mesh);
          triggerBreakExplosion(b.x, b.y, b.z, b.radius);

          if (onScoreAdd) onScoreAdd(500);
          if (showToast) showToast('SNOWBALL STAMP! +500', true);

          G.vy = Math.max(G.vy, 15.0);
        } else if (G.invincibleTimer <= 0) {
          // 💥 눈덩이 충돌: 0.3초 빠른 스턴 회복 + 붉은 충격 비넷 + 3초 무적!
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

  // ── 5. 소멸 조건: 플레이어 뒤로 지나치면 소멸 ───────────────────
  const cleanupFarObjects = (playerZ, dt) => {
    for (let i = snowballs.length - 1; i >= 0; i--) {
      const b = snowballs[i];
      if (b.z > playerZ + 20.0 || b.z < playerZ - 550.0 || !b.active) {
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
