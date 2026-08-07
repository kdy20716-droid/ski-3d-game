import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { getTerrainY } from './terrain.js';
import { soundFx } from './soundSystem.js?v=9.0.0';

export const createDiamondArchSystem = (scene) => {
  const archItems = [];

  // 💎 100% 뾰족하고 각진 3D 다이아몬드 팔면체 지오메트리 (동그라미 ❌ ➔ 팔면체 다이아몬드 ⭕)
  const diamondGeo = new THREE.OctahedronGeometry(2.4, 0);

  // 💎 맑고 선명하며 밀도 높은 사파이어 파란 다이아몬드 (살짝 불투명도 보강!)
  const blueMat = new THREE.MeshPhysicalMaterial({
    color: 0x0088FF,
    emissive: 0x0033CC,
    emissiveIntensity: 0.45,
    roughness: 0.05,
    metalness: 0.20,
    transmission: 0.12,          // 살짝만 투명하여 비비드한 파란색이 묵직하고 선명함!
    ior: 2.417,
    thickness: 1.5,
    reflectivity: 1.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
    transparent: true,
    opacity: 0.98,
  });

  // 💎 묵직하고 선명한 비비드 붉은 루비 다이아몬드 (살짝 불투명도 보강!)
  const redMat = new THREE.MeshPhysicalMaterial({
    color: 0xFF0044,
    emissive: 0xCC0022,
    emissiveIntensity: 0.45,
    roughness: 0.05,
    metalness: 0.20,
    transmission: 0.12,          // 살짝만 투명하여 붉은색이 묵직하고 선명함!
    ior: 2.417,
    thickness: 1.5,
    reflectivity: 1.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
    transparent: true,
    opacity: 0.98,
  });

  // 포물선 아치 스폰 (5개 다이아몬드, 정점 1개만 강렬한 붉은 300pt 다이아몬드)
  const spawnSingleArch = (archStartX, archStartZ, archLength, peakHeight) => {
    const count = 5;
    for (let k = 0; k < count; k++) {
      const t = k / (count - 1);
      const isPeak = (k === 2);

      let type = 'blue', mat = blueMat, pts = 100;
      if (isPeak) { type = 'red'; mat = redMat; pts = 300; }

      const mesh = new THREE.Mesh(diamondGeo, mat);
      const x = archStartX;
      const z = archStartZ - t * archLength;
      const archH = 4.0 * peakHeight * t * (1.0 - t);
      const gy = getTerrainY(x, z) + 1.8 + archH;

      mesh.position.set(x, gy, z);
      scene.add(mesh);

      archItems.push({
        mesh, x, z, baseY: gy, type, pts, active: true,
        archT: t, archStartX, archStartZ, archLength, peakHeight
      });
    }
  };

  // 🎲 무작위 동적 포물선 아치 스폰
  const initArches = () => {
    archItems.length = 0;
    let curZ = -420;
    for (let i = 0; i < 8; i++) {
      const aZ = curZ;
      const aX = (Math.random() - 0.5) * 160; // 100% 무작위 X 위치!
      const aLen = 105 + Math.random() * 30;
      const aH = 8.5 + Math.random() * 7.5;
      spawnSingleArch(aX, aZ, aLen, aH);
      curZ -= (320 + Math.random() * 180);
    }
  };

  initArches();

  const update = (playerZ, playerX, playerY, dt, time, onScoreAdd, showToast) => {
    for (const item of archItems) {
      if (!item.active) continue;
      item.mesh.rotation.y += dt * 3.5;

      if (item.type === 'red') {
        item.mesh.scale.setScalar(1.0 + Math.sin(time * 6.0 + item.x) * 0.18);
      }

      const dx = playerX - item.mesh.position.x;
      const dy = (playerY + 1.2) - item.mesh.position.y;
      const dz = playerZ - item.mesh.position.z;
      const distSq3D = dx * dx + dy * dy + dz * dz;

      // 3D 자석 흡입
      if (distSq3D < 100.0 && distSq3D > 0.1) {
        item.mesh.position.x += dx * dt * 28.0;
        item.mesh.position.z += dz * dt * 28.0;
        item.mesh.position.y += dy * dt * 28.0;
      }

      // 획득 판정 (100% 빠짐없는 soundFx.playGold() 띵-! 울림 보장)
      if (distSq3D < 36.0) {
        item.active = false;
        item.mesh.visible = false;
        soundFx.playGold(); // 💎 100% 또렷한 맑은 띵-! 사운드!
        if (onScoreAdd) onScoreAdd(item.pts);
      }
    }

    // 무한 순환 (플레이어가 지나치면 전방으로 무작위 이동)
    for (let i = 0; i < archItems.length; i += 5) {
      const archHeadItem = archItems[i];
      if (archHeadItem && archHeadItem.z - playerZ > 280) {
        const nextZ = playerZ - (320 + Math.random() * 260);
        const nextX = (Math.random() - 0.5) * 160;
        for (let k = 0; k < 5; k++) {
          if (i + k < archItems.length) {
            const item = archItems[i + k];
            item.x = nextX;
            item.z = nextZ - item.archT * item.archLength;
            const archH = 4.0 * item.peakHeight * item.archT * (1.0 - item.archT);
            item.baseY = getTerrainY(item.x, item.z) + 1.8 + archH;
            item.mesh.position.set(item.x, item.baseY, item.z);
            item.mesh.scale.setScalar(1.0);
            item.active = true;
            item.mesh.visible = true;
          }
        }
      }
    }
  };

  const reset = () => {
    let curZ = -420;
    for (let i = 0; i < archItems.length; i += 5) {
      const newX = (Math.random() - 0.5) * 160;
      for (let k = 0; k < 5; k++) {
        if (i + k < archItems.length) {
          const item = archItems[i + k];
          item.x = newX;
          item.z = curZ - item.archT * item.archLength;
          const archH = 4.0 * item.peakHeight * item.archT * (1.0 - item.archT);
          item.baseY = getTerrainY(item.x, item.z) + 1.8 + archH;
          item.mesh.position.set(item.x, item.baseY, item.z);
          item.mesh.scale.setScalar(1.0);
          item.active = true;
          item.mesh.visible = true;
        }
      }
      curZ -= (320 + Math.random() * 180);
    }
  };

  return { archItems, update, reset };
};
