import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { getTerrainY } from './terrain.js?v=24.0.0';

export const createExplodingSnowballHazardSystem = (scene) => {
  const bombs = [];
  let spawnTimer = 0.0;

  // 💣 폭발 눈덩이 3D 지오메트리 & 재질 (하얀 눈 껍질 + 빨갛게 깜빡이는 코어 코어)
  const snowShellGeo = new THREE.SphereGeometry(2.2, 12, 12);
  const snowShellMat = new THREE.MeshStandardMaterial({
    color: 0xF5F9FF, roughness: 0.8, transparent: true, opacity: 0.92
  });

  const coreGeo = new THREE.SphereGeometry(1.6, 10, 10);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xFF0033, wireframe: false });

  // 💣 3D 폭발 눈덩이 메쉬 생성
  const createBombMesh = () => {
    const group = new THREE.Group();
    const shell = new THREE.Mesh(snowShellGeo, snowShellMat);
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(shell, core);
    scene.add(group);
    return { group, shell, core };
  };

  // 💣 폭발 눈덩이 스폰 (스테이지 7부터 스폰)
  const spawnBomb = (playerZ, playerX) => {
    const bombMesh = createBombMesh();
    
    // 플레이어 전방 30~45m 거리, X축 ±4m~12m 측면에 던져짐
    const side = Math.random() < 0.5 ? -1 : 1;
    const spawnX = playerX + side * (4.0 + Math.random() * 8.0);
    const spawnZ = playerZ - (30.0 + Math.random() * 15.0);
    const gy = getTerrainY(spawnX, spawnZ) + 2.2;

    bombMesh.group.position.set(spawnX, gy, spawnZ);

    bombs.push({
      group: bombMesh.group,
      core: bombMesh.core,
      x: spawnX,
      y: gy,
      z: spawnZ,
      fuseTimer: 0.0,
      active: true,
    });
  };

  // 💣 업데이트 루프
  const update = (playerZ, playerX, playerY, playerSpeed, stageNum, dt, time, soundFx, onExplodeKnockback) => {
    // 1) 7스테이지부터 폭발 눈덩이 스폰 (4.5초 마다 1개)
    if (stageNum >= 7) {
      spawnTimer += dt;
      const interval = stageNum === 10 ? 3.5 : 4.5;
      if (spawnTimer >= interval) {
        spawnTimer = 0;
        spawnBomb(playerZ, playerX);
      }
    }

    // 2) 폭발 눈덩이 동기화 & 2초 빨간색 펄스 타이머 & 폭발 물리 처리
    for (let i = bombs.length - 1; i >= 0; i--) {
      const b = bombs[i];
      if (!b.active) continue;

      b.fuseTimer += dt;

      // 🎯 내 내리막 속도(playerSpeed)와 100% 동일하게 내려가서 나랑 시종일관 좌우 거리를 유지!
      b.z -= playerSpeed * dt;
      b.y = getTerrainY(b.x, b.z) + 2.2;
      b.group.position.set(b.x, b.y, b.z);

      // 🔴 2초간 점점 빠르게 빨간색 깜빡깜빡 비주얼 연출!
      const progress = Math.min(1.0, b.fuseTimer / 2.0);
      const blinkFreq = 4.0 + progress * 24.0; // 4Hz -> 28Hz 초고속 점멸
      const isRed = Math.sin(time * blinkFreq) > 0;
      b.core.material.color.setHex(isRed ? 0xFF0022 : 0x440000);
      b.core.scale.setScalar(1.0 + Math.sin(time * blinkFreq) * 0.25);

      // 💣 2초 후 펑! 폭발 처리
      if (b.fuseTimer >= 2.0) {
        b.active = false;
        b.group.position.set(0, -9999, 0); // 씬 즉시 이동

        if (soundFx && soundFx.playCrash) soundFx.playCrash(); // 폭발음 FX

        // 💥 폭발 넉백 충격파 범위 판정 (폭발 중심 18m 이내)
        const dx = playerX - b.x;
        const dy = (playerY + 1.2) - b.y;
        const dz = playerZ - b.z; // dz > 0 이면 폭발이 내 앞에 위치함 (뒤로 밀림)
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

        if (dist < 18.0) {
          // 폭발 중심부터 플레이어 방향으로의 정규화된 넉백 3D 벡터 계산
          const normX = dist > 0.001 ? dx / dist : 0;
          const normZ = dist > 0.001 ? dz / dist : 1; // dz > 0 (앞 폭발) -> normZ > 0 (뒤로 밀림)
          const knockForce = (1.0 - dist / 18.0) * 32.0; // 폭발 중심에 가까울수록 강한 밀림!

          if (onExplodeKnockback) {
            onExplodeKnockback({
              dirX: normX,
              dirZ: normZ,
              force: knockForce,
              isFrontExplosion: dz > 0
            });
          }
        }

        scene.remove(b.group);
        bombs.splice(i, 1);
      }
    }
  };

  const reset = () => {
    for (const b of bombs) {
      if (b.group) scene.remove(b.group);
    }
    bombs.length = 0;
    spawnTimer = 0;
  };

  return { update, reset };
};
