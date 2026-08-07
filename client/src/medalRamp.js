import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { getTerrainY } from './terrain.js';
import { soundFx } from './soundSystem.js';

// 🥇 스테이지당 딱 3개만 존재하는 황금 메달 전용 점프대 시스템 모듈
export const createMedalRampSystem = (scene) => {
  const medalRampList = [];
  const medalItems = [];

  // 🥇 연한 노란색 3D 거대 코인 메달 지오메트리 & 리얼 럭셔리 실크 골드 재질
  const medalDiscGeo = new THREE.CylinderGeometry(3.0, 3.0, 0.55, 32);
  const medalRimGeo  = new THREE.TorusGeometry(3.05, 0.22, 16, 32);

  const medalSoftGoldMat = new THREE.MeshPhysicalMaterial({
    color: 0xFFF2A3,             // 🌟 더 밝고 연한 노란색 맑은 실크 골드 빛깔!
    emissive: 0xFFD043,
    emissiveIntensity: 1.5,       // 화사한 자체 발광
    metalness: 0.70,
    roughness: 0.05,
    transmission: 0.30,          // 맑고 투명한 빛 투과
    ior: 2.417,
    reflectivity: 1.0,
    clearcoat: 1.0,
    transparent: true,
    opacity: 0.95,
  });

  const create3DGoldMedalMesh = () => {
    const group = new THREE.Group();
    const disc = new THREE.Mesh(medalDiscGeo, medalSoftGoldMat);
    disc.rotation.x = Math.PI / 2; // 동그란 면이 전방/카메라를 향하도록 직립!
    disc.castShadow = true;

    const rim = new THREE.Mesh(medalRimGeo, medalSoftGoldMat);
    group.add(disc, rim);
    return group;
  };

  // 🛹 점프대 메쉬 생성 (네온 골드 테두리가 둘러진 스키점프대)
  const rampGeo = new THREE.BoxGeometry(16, 2.8, 22);
  const rampMat = new THREE.MeshStandardMaterial({
    color: 0x1A1528, roughness: 0.2, metalness: 0.8
  });
  const borderMat = new THREE.MeshStandardMaterial({
    color: 0xFFD700, emissive: 0xFF9900, emissiveIntensity: 1.2, roughness: 0.1
  });

  const createMedalKickerMesh = (x, z) => {
    const group = new THREE.Group();
    const body = new THREE.Mesh(rampGeo, rampMat);
    body.rotation.x = -0.22;
    body.position.set(0, 1.2, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const borderL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.2, 22.4), borderMat);
    borderL.position.set(-8.2, 1.3, 0); borderL.rotation.x = -0.22;
    const borderR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.2, 22.4), borderMat);
    borderR.position.set(8.2, 1.3, 0); borderR.rotation.x = -0.22;
    group.add(borderL, borderR);

    const gy = getTerrainY(x, z);
    group.position.set(x, gy + 1.8, z);
    scene.add(group);
    return group;
  };

  // 🥇 메달 점프대 공중 정점 3D 메달 1개 + 3D 빛 아우라 조명 스폰
  const spawnMedalOnRamp = (rampX, rampZ) => {
    const archLength = 135;
    const peakHeight = 25.0;
    const t = 0.5; // 최고 정점 위치 (50%)

    const group = new THREE.Group();
    const medalMesh = create3DGoldMedalMesh();
    group.add(medalMesh);

    // 🥇 "저건 꼭 먹어야 해!" 느낌의 멀리서도 돋보이는 3D 연한 노란 빛 아우라 조명!
    const auraLight = new THREE.PointLight(0xFFE885, 9.0, 28.0);
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

    medalItems.push(item);
    return item;
  };

  // 🥇 스테이지별 딱 3개의 메달 전용 점프대 스폰 (Z 구간: -1800m, -4800m, -7800m 부근 지정)
  const initStageMedalRamps = (baseZOffset = 0) => {
    // 기존 메달 점프대 제거
    for (const r of medalRampList) {
      if (r.mesh) scene.remove(r.mesh);
    }
    for (const m of medalItems) {
      if (m.group) scene.remove(m.group);
    }
    medalRampList.length = 0;
    medalItems.length = 0;

    // 스테이지 진행 구간에 맞춰 3개 점프대 배치
    const zPositions = [-1800 + baseZOffset, -4800 + baseZOffset, -7800 + baseZOffset];

    for (let i = 0; i < 3; i++) {
      const rZ = zPositions[i];
      const rX = (Math.random() - 0.5) * 120;
      const meshGroup = createMedalKickerMesh(rX, rZ);
      const medalItem = spawnMedalOnRamp(rX, rZ);

      medalRampList.push({ mesh: meshGroup, x: rX, z: rZ, medalItem });
    }
  };

  initStageMedalRamps(0);

  // AABB 콜라이더 및 순수 포물선 도약
  const checkCollisionAndLaunch = (G, showToast) => {
    for (const ramp of medalRampList) {
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
          if (showToast) showToast('GOLD MEDAL KICKER LAUNCH! 🚀🥇', true);
        }
        break;
      }
    }
  };

  const update = (playerZ, playerX, playerY, dt, time, showToast, onMedalCollect) => {
    for (const mItem of medalItems) {
      if (!mItem.active) continue;
      mItem.mesh.rotation.y += dt * 4.0;
      mItem.group.scale.setScalar(1.0 + Math.sin(time * 6.0 + mItem.x) * 0.18);

      const dx = playerX - mItem.group.position.x;
      const dy = (playerY + 1.2) - mItem.group.position.y;
      const dz = playerZ - mItem.group.position.z;
      const distSq3D = dx * dx + dy * dy + dz * dz;

      // 🥇 황금 메달 획득 처리!
      if (distSq3D < 85.0) {
        mItem.active = false;
        mItem.group.visible = false;
        soundFx.playGoldenDiamond();
        if (showToast) showToast('GOLDEN MEDAL GET! 🥇', true);
        if (onMedalCollect) onMedalCollect();
      }
    }
  };

  const resetStageMedalRamps = (baseZOffset = 0) => {
    initStageMedalRamps(baseZOffset);
  };

  return { medalRampList, medalItems, checkCollisionAndLaunch, update, resetStageMedalRamps };
};
