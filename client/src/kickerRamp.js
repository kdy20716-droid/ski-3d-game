import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { getTerrainY } from './terrain.js';
import { soundFx } from './soundSystem.js';

export const createKickerRampSystem = (scene) => {
  const rampList = [];
  const rampGoldItems = []; // 전체 획득 판정용 참조 목록

  // 삼각 베이지 나무 키커 점프대 3D 메쉬 (이미지와 100% 동일)
  const createWedgeKickerGeo = (w, h, l) => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.05);
    shape.lineTo(l, h);
    shape.lineTo(l, 0);
    shape.closePath();

    const extrudeSettings = {
      steps: 1, depth: w, bevelEnabled: true, bevelThickness: 0.18, bevelSize: 0.18, bevelSegments: 3
    };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.rotateY(Math.PI / 2);
    geo.center();
    return geo;
  };

  const kickerBodyGeo = createWedgeKickerGeo(14.0, 3.8, 22.0);
  const kickerMat = new THREE.MeshStandardMaterial({
    color: 0xE2C49B, roughness: 0.55, metalness: 0.15,
    emissive: 0x2A1C0E, emissiveIntensity: 0.12,
  });

  const kickerEdgeGeo = new THREE.BoxGeometry(14.2, 0.3, 1.2);
  const kickerEdgeMat = new THREE.MeshStandardMaterial({
    color: 0xFFD700, emissive: 0xFF9900, emissiveIntensity: 0.95,
  });

  const slotGeo = new THREE.BoxGeometry(0.2, 0.7, 3.2);
  const slotMat = new THREE.MeshStandardMaterial({ color: 0x221810, roughness: 0.9 });

  const createKickerMesh = (x, z) => {
    const group = new THREE.Group();
    const body = new THREE.Mesh(kickerBodyGeo, kickerMat); body.castShadow = true; body.receiveShadow = true;
    const edge = new THREE.Mesh(kickerEdgeGeo, kickerEdgeMat); edge.position.set(0, 1.8, -10.8);
    const slotL1 = new THREE.Mesh(slotGeo, slotMat); slotL1.position.set(-7.05, -0.4, -2.0);
    const slotL2 = new THREE.Mesh(slotGeo, slotMat); slotL2.position.set(-7.05, -0.4, 4.0);
    const slotR1 = new THREE.Mesh(slotGeo, slotMat); slotR1.position.set( 7.05, -0.4, -2.0);
    const slotR2 = new THREE.Mesh(slotGeo, slotMat); slotR2.position.set( 7.05, -0.4, 4.0);

    group.add(body, edge, slotL1, slotL2, slotR1, slotR2);

    const gy = getTerrainY(x, z);
    group.rotation.x = 0.12;
    group.position.set(x, gy + 1.8, z);
    scene.add(group);
    return group;
  };

  // 💎 100% 각진 뾰족한 3D 팔면체 황금 다이아몬드 지오메트리 & 살짝 주황빛 스며든 럭셔리 엠버 골드 물리 재질
  const diamondGeo = new THREE.OctahedronGeometry(2.4, 0);
  const diamondGoldMat = new THREE.MeshPhysicalMaterial({
    color: 0xFFB300,             // 🌟 살짝 주황빛이 도는 묵직한 황금빛 엠버 골드!
    emissive: 0xFF6A00,
    emissiveIntensity: 1.15,
    metalness: 0.90, roughness: 0.05, transmission: 0.20, ior: 2.417, reflectivity: 1.0, clearcoat: 1.0
  });

  // 💎 일반 점프대 공중 아치 정점 전용: 황금 다이아몬드 (500pt) 1개 스폰
  const spawnSingleGoldDiamond = (rampX, rampZ) => {
    const cluster = [];
    const archLength = 135;
    const peakHeight = 25.0;
    const t = 0.5;

    const group = new THREE.Group();
    const mesh = new THREE.Mesh(diamondGeo, diamondGoldMat);
    mesh.castShadow = true;
    group.add(mesh);

    const x = rampX;
    const z = rampZ - t * archLength;
    const archH = 4.0 * peakHeight * t * (1.0 - t);
    const gy = getTerrainY(x, z) + 1.8 + archH;

    group.position.set(x, gy, z);
    scene.add(group);

    const item = {
      group, mesh, x, z, baseY: gy, type: 'gold', pts: 500, active: true,
      archT: t, archLength, peakHeight
    };

    cluster.push(item);
    rampGoldItems.push(item);
    return cluster;
  };

  // 동일 X 라인 겹침 방지 헬퍼 (직전 X 위치와 최소 55m 이상 격차 보장)
  let lastKickerX = 0;
  const getAntiOverlapX = () => {
    let nextX = (Math.random() - 0.5) * 130;
    let attempts = 0;
    while (Math.abs(nextX - lastKickerX) < 55 && attempts < 15) {
      nextX = (Math.random() - 0.5) * 130;
      attempts++;
    }
    lastKickerX = nextX;
    return nextX;
  };

  // 기본 황금 다이아몬드 점프대 6개 동적 무작위 무한 순환 스폰
  const initRamps = () => {
    rampList.length = 0;
    rampGoldItems.length = 0;

    let curZ = -450;
    for (let r = 0; r < 6; r++) {
      const rZ = curZ;
      const rX = getAntiOverlapX();
      const meshGroup = createKickerMesh(rX, rZ);
      const goldCluster = spawnSingleGoldDiamond(rX, rZ);

      rampList.push({ mesh: meshGroup, x: rX, z: rZ, goldCluster });
      curZ -= (380 + Math.random() * 160);
    }
  };

  initRamps();

  // AABB 콜라이더 및 순수 포물선 도약
  const checkCollisionAndLaunch = (G, showToast) => {
    for (const ramp of rampList) {
      const minX = ramp.x - 8.5;
      const maxX = ramp.x + 8.5;
      const minZ = ramp.z - 18.0;
      const maxZ = ramp.z + 8.0;

      if (G.px >= minX && G.px <= maxX && G.pz >= minZ && G.pz <= maxZ) {
        if (!G.wasRampJump) {
          G.inAir = true;
          G.airTimeTimer = 0.0;
          G.vy = 53.0; // 황금 메달 정점 25m 완벽 고공 도약!
          G.wasRampJump = true;
          G.jumpCharge = 0;
          G.isCharging = false;

          soundFx.playKickerLaunch();
          if (showToast) showToast('KICKER HIGH LAUNCH! 🚀', true);
        }
        break;
      }
    }
  };

  // 점프대와 황금 메달 1개 위치 동기화 재배치 헬퍼
  const relocateRampAndGold = (ramp, newX, newZ) => {
    ramp.x = newX;
    ramp.z = newZ;
    const gy = getTerrainY(newX, newZ);
    ramp.mesh.position.set(newX, gy + 1.8, newZ);

    const archLength = 135;
    const peakHeight = 25.0;
    for (const gItem of ramp.goldCluster) {
      gItem.x = newX;
      gItem.z = newZ - gItem.archT * archLength;
      const itemGy = getTerrainY(gItem.x, gItem.z) + 1.8 + 4.0 * peakHeight * gItem.archT * (1.0 - gItem.archT);
      gItem.baseY = itemGy;
      gItem.group.position.set(gItem.x, itemGy, gItem.z);
      gItem.group.scale.setScalar(1.0);
      gItem.active = true;
      gItem.group.visible = true;
    }
  };

  const update = (playerZ, playerX, playerY, dt, time, onScoreAdd, showToast, onMedalCollect) => {
    // 🥇 황금 메달 & 황금 다이아몬드 획득 연출
    for (const gItem of rampGoldItems) {
      if (!gItem.active) continue;
      gItem.mesh.rotation.y += dt * 4.0;

      gItem.group.scale.setScalar(1.0 + Math.sin(time * 6.0 + gItem.x) * 0.18);

      const dx = playerX - gItem.group.position.x;
      const dy = (playerY + 1.2) - gItem.group.position.y;
      const dz = playerZ - gItem.group.position.z;
      const distSq3D = dx * dx + dy * dy + dz * dz;

      if (distSq3D < 85.0) {
        gItem.active = false;
        gItem.group.visible = false;
        soundFx.playGoldenDiamond();

        if (gItem.type === 'medal') {
          // 🥇 황금 메달 획득 처리!
          if (showToast) showToast('GOLDEN MEDAL GET! 🥇', true);
          if (onMedalCollect) onMedalCollect();
        } else {
          // 💎 황금 다이아몬드 획득 처리 (+500pt 점수)
          if (showToast) showToast('GOLD DIAMOND! +500', true);
          if (onScoreAdd) onScoreAdd(gItem.pts);
        }
      }
    }

    // 🎲 점프대 무한 순환 (동일 X 라인 겹침 0% 재배치)
    for (const ramp of rampList) {
      if (ramp.z - playerZ > 280) {
        const nextZ = playerZ - (400 + Math.random() * 240);
        const nextX = getAntiOverlapX(); // 동일 X 라인 겹침 방지!
        relocateRampAndGold(ramp, nextX, nextZ);
      }
    }
  };

  const reset = () => {
    let curZ = -450;
    for (let r = 0; r < rampList.length; r++) {
      const ramp = rampList[r];
      const rX = getAntiOverlapX();
      relocateRampAndGold(ramp, rX, curZ);
      curZ -= (380 + Math.random() * 160);
    }
  };

  return { rampList, rampGoldItems, checkCollisionAndLaunch, update, reset };
};
