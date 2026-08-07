import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { getTerrainY } from './terrain.js';
import { soundFx } from './soundSystem.js';

// ─────────────────────────────────────────────────────────────────
//  3스테이지 이상부터 발동하는 대형 구르는 눈덩이 장애물 시스템
// ─────────────────────────────────────────────────────────────────
export const createSnowballHazardSystem = (scene) => {
  const snowballs = [];
  let spawnTimer = 0;

  // 눈덩이 3D 기하구조 & 재질 (로우폴리 파셋 느낌의 사실적인 굴러가는 눈 덩어리)
  const sphereGeo = new THREE.IcosahedronGeometry(1.0, 2);
  const snowballMat = new THREE.MeshStandardMaterial({
    color: 0xE8F4FF,
    roughness: 0.82,
    metalness: 0.08,
    emissive: 0x152540,
    emissiveIntensity: 0.15,
    flatShading: true,
  });

  // 스폰 헬퍼
  const spawnSnowball = (playerX, playerZ, stageNum) => {
    // 눈덩이 반지름 (2.2m ~ 4.2m 크기)
    const radius = 2.2 + Math.random() * 2.0;

    // 스폰 패턴선택:
    // 0: 왼쪽 뒤/옆 -> 오른쪽 전방 가로지르기
    // 1: 오른쪽 뒤/옆 -> 왼쪽 전방 가로지르기
    // 2: 바로 뒤 -> 앞쪽으로 빠른 대각선 질주
    const pattern = Math.floor(Math.random() * 3);

    let startX = 0, startZ = 0;
    let vx = 0, vz = 0;

    const baseSpeed = 85.0 + Math.min(stageNum * 4.0, 35.0); // 스테이지가 높을수록 스피드 증가!

    if (pattern === 0) {
      // 왼쪽에서 오른쪽 전방으로 크로스
      startX = playerX - (80 + Math.random() * 40);
      startZ = playerZ + (20 - Math.random() * 60);
      vx = (60 + Math.random() * 35);
      vz = -baseSpeed;
    } else if (pattern === 1) {
      // 오른쪽에서 왼쪽 전방으로 크로스
      startX = playerX + (80 + Math.random() * 40);
      startZ = playerZ + (20 - Math.random() * 60);
      vx = -(60 + Math.random() * 35);
      vz = -baseSpeed;
    } else {
      // 플레이어 약간 뒤에서 전방으로 빠르게 가로질러 덮침
      startX = playerX + (Math.random() - 0.5) * 70;
      startZ = playerZ + (30 + Math.random() * 25);
      vx = (Math.random() - 0.5) * 50;
      vz = -(baseSpeed + 25.0); // 플레이어보다 더 빠르게 추월!
    }

    const mesh = new THREE.Mesh(sphereGeo, snowballMat);
    mesh.scale.setScalar(radius);
    mesh.castShadow = true;

    const initialY = getTerrainY(startX, startZ) + radius;
    mesh.position.set(startX, initialY, startZ);
    scene.add(mesh);

    snowballs.push({
      mesh,
      radius,
      x: startX,
      y: initialY,
      z: startZ,
      vx,
      vz,
      rotX: Math.random() * Math.PI * 2,
      rotZ: Math.random() * Math.PI * 2,
      active: true,
    });

    // 화면 근처에서 스폰될 때 웅장한 사운드 연출
    if (Math.abs(startZ - playerZ) < 80) {
      soundFx.playSurprise();
    }
  };

  const update = (G, dt) => {
    // 3스테이지 이상부터만 눈덩이 스폰 (G.stage >= 3)
    if (G.stage < 3 || G.isCrashed || G.isCutscene) {
      // 화면 밖으로 멀어진 눈덩이만 정리
      cleanupFarSnowballs(G.pz);
      return;
    }

    // 스테이지가 높을수록 쿨다운 단축 (Stage 3: ~3.8초, Stage 10: ~1.4초)
    const cooldown = Math.max(1.3, 4.2 - (G.stage - 3) * 0.42);
    spawnTimer += dt;

    if (spawnTimer >= cooldown) {
      spawnTimer = 0;
      spawnSnowball(G.px, G.pz, G.stage);

      // 높은 스테이지에서는 간혹 2연속 스폰
      if (G.stage >= 6 && Math.random() < 0.45) {
        spawnSnowball(G.px, G.pz, G.stage);
      }
    }

    // 눈덩이 물리 이동 & 구르기 애니메이션
    for (const b of snowballs) {
      if (!b.active) continue;

      b.x += b.vx * dt;
      b.z += b.vz * dt;
      b.y = getTerrainY(b.x, b.z) + b.radius;

      b.mesh.position.set(b.x, b.y, b.z);

      // 구르는 회전 애니메이션 (이동 속도 및 방향 연동)
      const speed = Math.sqrt(b.vx * b.vx + b.vz * b.vz);
      const rollAmount = (speed / b.radius) * dt;
      b.mesh.rotation.x -= rollAmount * (b.vz / speed);
      b.mesh.rotation.z += rollAmount * (b.vx / speed);

      // 플레이어 충돌 판정
      if (G.invincibleTimer <= 0 && !G.isCrashed) {
        const dx = G.px - b.x;
        const dy = (G.py + 1.0) - b.y;
        const dz = G.pz - b.z;
        const distSq = dx * dx + dy * dy + dz * dz;
        const minDist = b.radius + 1.1;

        if (distSq < minDist * minDist) {
          // 💥 구르는 눈덩이와 강렬한 충돌 발생!
          G.isCrashed = true;
          G.crashTimer = 0;
          soundFx.playCrash();
        }
      }
    }

    cleanupFarSnowballs(G.pz);
  };

  const cleanupFarSnowballs = (playerZ) => {
    for (let i = snowballs.length - 1; i >= 0; i--) {
      const b = snowballs[i];
      // 플레이어 전방 350m 벗어나거나, 지나쳐서 뒤로 120m 이상 멀어지면 제거
      if (b.z < playerZ - 380 || b.z > playerZ + 120) {
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
    spawnTimer = 0;
  };

  return { update, reset };
};
