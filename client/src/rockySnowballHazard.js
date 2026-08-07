import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { getTerrainY } from './terrain.js';
import { soundFx } from './soundSystem.js?v=9.0.0';

// ─────────────────────────────────────────────────────────────────
//  🪨 5스테이지 이상 전용: 돌덩이가 박힌 바위-눈덩이 (Rocky Snowball)
//  연출: 앞으로 진행하다가 갑자기 급감속하며 플레이어 쪽으로 다가옴!
// ─────────────────────────────────────────────────────────────────
export const createRockySnowballHazardSystem = (scene) => {
  const rockySnowballs = [];
  const rockBreakParticles = [];
  let spawnTimer = 0;

  // 기본 눈 구체
  const baseSphereGeo = new THREE.IcosahedronGeometry(1.0, 2);
  const snowMat = new THREE.MeshStandardMaterial({
    color: 0xDBE8F5,
    roughness: 0.85,
    metalness: 0.05,
    emissive: 0x102035,
    emissiveIntensity: 0.12,
    flatShading: true,
  });

  // 박혀있는 바위 돌기 geometry & material
  const rockGeo = new THREE.DodecahedronGeometry(0.48, 1);
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x4A4E54,
    roughness: 0.95,
    metalness: 0.25,
    emissive: 0x1A1C20,
    emissiveIntensity: 0.1,
    flatShading: true,
  });

  // 🪨 돌 박힌 눈덩이 3D 복합 메쉬 생성 팩토리
  const createRockySnowballMesh = (radius) => {
    const group = new THREE.Group();

    // 1. 코어 눈덩이
    const snowMesh = new THREE.Mesh(baseSphereGeo, snowMat);
    snowMesh.scale.setScalar(radius);
    snowMesh.castShadow = true;
    group.add(snowMesh);

    // 2. 표면에 콕콕 박힌 6~9개의 거친 바위돌기들
    const rockCount = 7 + Math.floor(Math.random() * 3);
    for (let i = 0; i < rockCount; i++) {
      const rockMesh = new THREE.Mesh(rockGeo, rockMat);
      const rScale = radius * (0.35 + Math.random() * 0.3);
      rockMesh.scale.setScalar(rScale);

      // 구체 표면 상의 랜덤 위치
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const rPos = radius * 0.88; // 표면 밖으로 삐죽 튀어나오게

      rockMesh.position.set(
        rPos * Math.sin(phi) * Math.cos(theta),
        rPos * Math.sin(phi) * Math.sin(theta),
        rPos * Math.cos(phi)
      );

      rockMesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      rockMesh.castShadow = true;
      group.add(rockMesh);
    }

    return group;
  };

  // ── 스폰 함수 ───────────────────────────────────────────────────
  const spawnRockySnowball = (playerX, playerZ, playerSpd, stageNum) => {
    const radius = 2.4 + Math.random() * 1.8; // 묵직한 크기

    // 플레이어 전방 약 15~35m 앞 좌우에서 스폰
    const sideOffset = (Math.random() < 0.5 ? -1 : 1) * (20.0 + Math.random() * 40.0);
    const startX = playerX + sideOffset;
    const startZ = playerZ - (15.0 + Math.random() * 25.0);

    const group = createRockySnowballMesh(radius);
    const startY = getTerrainY(startX, startZ) + radius;
    group.position.set(startX, startY, startZ);
    scene.add(group);

    const currentPlayerSpd = Math.max(playerSpd, 24.0);

    rockySnowballs.push({
      group,
      radius,
      x: startX,
      y: startY,
      z: startZ,
      vx: (Math.random() - 0.5) * 10.0,
      vz: -(currentPlayerSpd * 1.55), // 초반엔 플레이어보다 1.55배 매우 빠르게 전방으로 슈웅-!
      initialVz: -(currentPlayerSpd * 1.55),
      braking: false,                  // 급감속 상태 여부
      stateTimer: 0,                   // 상태 변경 타이머
      active: true,
    });

    // 🪨 바위 눈덩이 난입 특수 경고음
    soundFx.playSurprise();
  };

  // ── 붕괴 바위 파티클 이펙트 ───────────────────────────────────
  const triggerRockExplosion = (x, y, z, radius) => {
    soundFx.playCrash();
    for (let i = 0; i < 18; i++) {
      const pMesh = new THREE.Mesh(rockGeo, rockMat);
      pMesh.scale.setScalar(0.4 + Math.random() * 0.6);
      pMesh.position.set(x, y, z);
      scene.add(pMesh);

      const angle = Math.random() * Math.PI * 2;
      const upSpd = 8.0 + Math.random() * 14.0;
      const outSpd = 6.0 + Math.random() * 16.0;

      rockBreakParticles.push({
        mesh: pMesh,
        vx: Math.cos(angle) * outSpd,
        vy: upSpd,
        vz: Math.sin(angle) * outSpd,
        life: 1.0,
      });
    }
  };

  // ── 메인 업데이트 ───────────────────────────────────────────────
  const update = (G, dt, onScoreAdd, showToast) => {
    // 5스테이지 이상부터만 발동 (G.stage >= 5)
    if (G.stage < 5 || G.isCutscene) {
      cleanupFarObjects(G.pz, dt);
      return;
    }

    // 스폰 쿨다운 (Stage 5: ~4.5초, Stage 10: ~2.4초)
    const cooldown = Math.max(2.2, 5.0 - (G.stage - 5) * 0.5);
    spawnTimer += dt;

    if (spawnTimer >= cooldown) {
      spawnTimer = 0;
      if (!G.isCrashed) {
        spawnRockySnowball(G.px, G.pz, G.spd, G.stage);
      }
    }

    // ── 돌 바위 눈덩이 물리 및 급감속/추적 연출 ─────────────────
    for (const b of rockySnowballs) {
      if (!b.active) continue;

      b.stateTimer += dt;

      // 🚨 [핵심 연출]: 스폰 0.75초 후 갑자기 브레이크(급감속)를 밟으며 플레이어 쪽으로 다가옴!
      if (b.stateTimer > 0.75 && !b.braking) {
        b.braking = true;
      }

      if (b.braking) {
        // Z속도 급감속: 플레이어 속도의 0.35배 수준으로 급격히 속도가 줄어듦! (브레이크 잡힘)
        const targetVz = -(G.spd * 0.35);
        b.vz += (targetVz - b.vz) * dt * 3.5; // 급감속!

        // 🎯 동시에 플레이어 위치(G.px)를 추적하며 캐릭터 쪽으로 슥- 다가옴!
        const dxToPlayer = G.px - b.x;
        b.vx += (dxToPlayer * 1.8 - b.vx) * dt * 2.2;
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

      b.group.position.set(b.x, b.y, b.z);

      // 구르는 회전 애니메이션
      const speed = Math.sqrt(b.vx * b.vx + b.vz * b.vz);
      const rollAmount = (speed / b.radius) * dt;
      b.group.rotation.x -= rollAmount;
      b.group.rotation.y += b.vx * dt * 0.08;

      // ── 충돌 & 밟기 판정 (X/Z 수평 거리와 Y 높이 독립 분리로 100% 밟기 보장!) ───────────────────────────────────────
      const dx = G.px - b.x;
      const dz = G.pz - b.z;
      const distXZSq = dx * dx + dz * dz;
      const hitRadiusXZ = b.radius + 1.85;

      if (distXZSq < hitRadiusXZ * hitRadiusXZ && !G.isCrashed) {
        const groundY = getTerrainY(G.px, G.pz);
        // 🎯 [거대 바위 밟기 조건]: 플레이어가 절반 점프 이상 높이 (b.y - radius * 0.15 이상)에 닿아야만 밟기 성공!
        const isHalfJumpOrHigher = G.inAir && (G.py >= (b.y - b.radius * 0.15));

        if (isHalfJumpOrHigher) {
          // 🎉 [절반 점프 이상 고공 밟기 성공!]: 묵직하게 쿵-! 파괴 소멸되며 상공 52m 초고공 솟구침!
          b.active = false;
          scene.remove(b.group);
          triggerRockExplosion(b.x, b.y, b.z, b.radius);

          if (onScoreAdd) onScoreAdd(800);
          if (showToast) showToast('MEGA ROCKY STOMP HIGH LAUNCH! 🚀💥 (+800pt)', true);

          G.inAir = true;
          G.airTimeTimer = 0;
          G.vy = 52.0; // 거대 바위 반발력으로 하늘 높이 52m 메가 솟구침!
          soundFx.playKickerLaunch();
        } else if (G.invincibleTimer <= 0 && Math.abs(G.py - b.y) < b.radius + 0.8) {
          // 💥 돌눈덩이 충돌: 0.3초 빠른 스턴 회복 + 붉은 충격 비넷 + 3초 무적!
          G.spd = 0;
          G.stunTimer = 0.3;       // 0.3초 빠른 스턴 회복!
          G.invincibleTimer = 3.0; // 3초 무적 반투명 깜빡임
          soundFx.playCrash();

          if (showToast) showToast('CRASH! 3초 무적 ⚡', false);
          b.active = false;
          scene.remove(b.group);
          triggerRockExplosion(b.x, b.y, b.z, b.radius);

          if (G.triggerDissolveRespawn) {
            G.triggerDissolveRespawn(() => {
              G.px = b.x * 0.15;
            });
          } else {
            G.px = b.x * 0.15;
          }
        }
      }
    }

    // ── 붕괴 파티클 애니메이션 ──────────────────────────────────
    for (let i = rockBreakParticles.length - 1; i >= 0; i--) {
      const p = rockBreakParticles[i];
      p.life -= dt * 1.6;

      if (p.life <= 0) {
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        rockBreakParticles.splice(i, 1);
        continue;
      }

      p.vy -= 28.0 * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.mesh.rotation.x += dt * 6.0;
      p.mesh.scale.setScalar(p.life * 0.7);
    }

    cleanupFarObjects(G.pz, dt);
  };

  // ── 시야 밖 정리 ───────────────────────────────────────────────
  const cleanupFarObjects = (playerZ, dt) => {
    for (let i = rockySnowballs.length - 1; i >= 0; i--) {
      const b = rockySnowballs[i];
      if (b.z < playerZ - 280 || b.z > playerZ + 90 || !b.active) {
        scene.remove(b.group);
        rockySnowballs.splice(i, 1);
      }
    }
  };

  // ── 리셋 ───────────────────────────────────────────────────────
  const reset = () => {
    for (const b of rockySnowballs) {
      scene.remove(b.group);
    }
    rockySnowballs.length = 0;

    for (const p of rockBreakParticles) {
      scene.remove(p.mesh);
      p.mesh.geometry.dispose();
    }
    rockBreakParticles.length = 0;

    spawnTimer = 0;
  };

  return { update, reset };
};
