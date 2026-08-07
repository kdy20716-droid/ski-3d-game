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

  // 🥇 3D 동그란 순금 코인 메달 지오메트리 & 리얼 럭셔리 골드 물리 재질
  const medalDiscGeo = new THREE.CylinderGeometry(2.2, 2.2, 0.45, 32);
  const medalRimGeo  = new THREE.TorusGeometry(2.25, 0.18, 16, 32);

  const medalGoldMat = new THREE.MeshPhysicalMaterial({
    color: 0xFFD700,
    emissive: 0xFF8800,
    emissiveIntensity: 0.95,
    metalness: 0.95,
    roughness: 0.08,
    reflectivity: 1.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
  });

  const create3DGoldMedalMesh = () => {
    const group = new THREE.Group();
    const disc = new THREE.Mesh(medalDiscGeo, medalGoldMat);
    disc.rotation.x = Math.PI / 2; // 동그란 면이 전방/카메라를 향하도록 직립!
    disc.castShadow = true;

    const rim = new THREE.Mesh(medalRimGeo, medalGoldMat);
    group.add(disc, rim);
    return group;
  };

  // 🥇 점프대 공중 아치 정점 전용: 동그란 황금 메달 1개 + 멀리서도 돋보이는 3D 빛 아우라!
  const spawnSingleGoldMedal = (rampX, rampZ) => {
    const cluster = [];
    const archLength = 135;
    const peakHeight = 25.0;
    const t = 0.5; // 아치 최고 정점 위치 (50%)

    const group = new THREE.Group();
    const medalMesh = create3DGoldMedalMesh();
    group.add(medalMesh);

    // 🥇 "저건 꼭 먹어야 해!" 느낌의 멀리서도 눈부시게 퍼지는 3D 황금 빛 아우라 조명!
    const auraLight = new THREE.PointLight(0xFFD700, 8.0, 24.0);
    group.add(auraLight);

    const x = rampX;
    const z = rampZ - t * archLength;
    const archH = 4.0 * peakHeight * t * (1.0 - t);
    const gy = getTerrainY(x, z) + 1.8 + archH;

    group.position.set(x, gy, z);
    scene.add(group);

    const item = {
      group, mesh: medalMesh, auraLight, x, z, baseY: gy, type: 'medal', pts: 0, active: true,
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

  // 점프대 6개 동적 무작위 설치 (스테이지당 지정된 3개 점프대에만 황금 메달 1개씩 총 3개 설치)
  const initRamps = () => {
    rampList.length = 0;
    rampGoldItems.length = 0;

    let curZ = -450;
    for (let r = 0; r < 6; r++) {
      const rZ = curZ;
      const rX = getAntiOverlapX();
      const meshGroup = createKickerMesh(rX, rZ);
      
      // 🥇 스테이지당 점프대 0, 2, 4번 (총 3개)에만 황금 메달 1개씩 스폰!
      let goldCluster = [];
      if (r % 2 === 0 && rampGoldItems.length < 3) {
        goldCluster = spawnSingleGoldMedal(rX, rZ);
      }

      rampList.push({ mesh: meshGroup, x: rX, z: rZ, goldCluster });
      curZ -= (400 + Math.random() * 160);
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
    // 🥇 황금 메달 획득 연출 (부딪히는 순간 즉시 화면 100% 소멸!)
    for (const gItem of rampGoldItems) {
      if (!gItem.active) continue;
      gItem.mesh.rotation.y += dt * 4.0;

      gItem.group.scale.setScalar(1.0 + Math.sin(time * 6.0 + gItem.x) * 0.18);

      const dx = playerX - gItem.group.position.x;
      const dy = (playerY + 1.2) - gItem.group.position.y;
      const dz = playerZ - gItem.group.position.z;
      const distSq3D = dx * dx + dy * dy + dz * dz;

      // 🥇 메달 부딪히는 순간 즉시 화면 소멸 & 상단 HUD 메달 채움!
      if (distSq3D < 85.0) {
        gItem.active = false;
        gItem.group.visible = false;
        soundFx.playGoldenDiamond(); // 🥇 황금 메달 전용 챠링-! Sound FX
        if (showToast) showToast('GOLDEN MEDAL GET! 🥇', true);
        if (onMedalCollect) onMedalCollect();
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
