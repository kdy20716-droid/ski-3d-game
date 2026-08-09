import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { getTerrainY } from './terrain.js';
import { soundFx } from './soundSystem.js?v=9.0.0';

// 🥇 스테이지당 딱 3개만 존재하는 황금 메달 전용 점프대 시스템 모듈
export const createMedalRampSystem = (scene) => {
  const medalRampList = [];
  const medalItems = [];

  // ⭐️ 3D 5각 별(Star) 양각 문양 지오메트리 생성 헬퍼
  const create3DStarGeometry = (outerRadius = 1.35, innerRadius = 0.55, depth = 0.25) => {
    const starShape = new THREE.Shape();
    const points = 5;
    for (let i = 0; i < points * 2; i++) {
      const r = (i % 2 === 0) ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) starShape.moveTo(x, y);
      else starShape.lineTo(x, y);
    }
    starShape.closePath();

    const extrudeSettings = { steps: 1, depth, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 3 };
    const starGeo = new THREE.ExtrudeGeometry(starShape, extrudeSettings);
    starGeo.center();
    return starGeo;
  };

  // 🥇 1. 연한 노란색 3D 거대 코인 메달 지오메트리 (반지름 4.2m 압도적 크기!)
  const medalDiscGeo = new THREE.CylinderGeometry(4.2, 4.2, 0.75, 32);
  const medalRimGeo  = new THREE.TorusGeometry(4.25, 0.30, 16, 32);
  const starGeo      = create3DStarGeometry(1.95, 0.75, 0.35);

  const medalSoftGoldMat = new THREE.MeshPhysicalMaterial({
    color: 0xFFF2A3, emissive: 0xFFD043, emissiveIntensity: 1.6,
    metalness: 0.75, roughness: 0.05, transmission: 0.25, ior: 2.417, reflectivity: 1.0, clearcoat: 1.0, transparent: true, opacity: 0.95
  });

  const starGoldMat = new THREE.MeshPhysicalMaterial({
    color: 0xFFD700, emissive: 0xFF9900, emissiveIntensity: 2.0, metalness: 0.90, roughness: 0.05, clearcoat: 1.0
  });

  const create3DGoldMedalMesh = () => {
    const group = new THREE.Group();
    const disc = new THREE.Mesh(medalDiscGeo, medalSoftGoldMat);
    disc.rotation.x = Math.PI / 2; // 동그란 면이 카메라를 향하도록 직립!
    disc.castShadow = true;

    const rim = new THREE.Mesh(medalRimGeo, medalSoftGoldMat);
    
    // ⭐️ 3D 별(Star ★) 문양을 메달 코인 정면/후면에 선명하게 조각 각인!
    const starFront = new THREE.Mesh(starGeo, starGoldMat);
    starFront.position.z = 0.32;
    const starBack  = new THREE.Mesh(starGeo, starGoldMat);
    starBack.position.z = -0.32;
    starBack.rotation.y = Math.PI;

    group.add(disc, rim, starFront, starBack);
    return group;
  };

  // 🛹 기본 점프대와 100% 동일한 모양의 점프대 메쉬 생성 (createWedgeKickerGeo)
  const createWedgeKickerGeo = (w = 14.0, h = 3.8, l = 22.0) => {
    const shape = new THREE.Shape();
    shape.moveTo(-l / 2, 0);
    shape.lineTo(l / 2, 0);
    shape.lineTo(l / 2, h);
    shape.closePath();

    const extrudeSettings = { steps: 1, depth: w, bevelEnabled: true, bevelThickness: 0.18, bevelSize: 0.18, bevelSegments: 3 };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.rotateY(Math.PI / 2);
    geo.center();
    return geo;
  };

  const kickerBodyGeo = createWedgeKickerGeo(14.0, 3.8, 22.0);
  const kickerMat = new THREE.MeshStandardMaterial({ color: 0xE2C49B, roughness: 0.55, metalness: 0.15, emissive: 0x2A1C0E, emissiveIntensity: 0.12 });
  const kickerEdgeGeo = new THREE.BoxGeometry(14.2, 0.3, 1.2);
  const kickerEdgeMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0xFF9900, emissiveIntensity: 0.95 });
  const slotGeo = new THREE.BoxGeometry(0.2, 0.7, 3.2);
  const slotMat = new THREE.MeshStandardMaterial({ color: 0x221810, roughness: 0.9 });

  const createMedalKickerMesh = (x, z) => {
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

  // 🥇 메달 점프대 공중 정점 거대 3D 메달 1개 스폰 (Shader 재컴파일 렉 원인인 PointLight 제거 ➔ emissive 자체 발광 사용)
  const spawnMedalOnRamp = (rampX, rampZ) => {
    const archLength = 135;
    const peakHeight = 25.0;
    const t = 0.5; // 최고 정점 위치 (50%)

    const group = new THREE.Group();
    const medalMesh = create3DGoldMedalMesh();
    group.add(medalMesh);

    const x = rampX;
    const z = rampZ - t * archLength;
    const archH = 4.0 * peakHeight * t * (1.0 - t);
    const gy = getTerrainY(x, z) + 1.8 + archH;

    group.position.set(x, gy, z);
    scene.add(group);

    const item = {
      group, mesh: medalMesh, auraLight: null, x, z, baseY: gy, type: 'medal', pts: 0, active: true,
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

          if (soundFx && typeof soundFx.playKickerLaunch === 'function') {
            soundFx.playKickerLaunch();
          } else if (soundFx && soundFx.playJump) {
            soundFx.playJump();
          }
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

      // 🥇 황금 메달 획득 처리! (Three.js 셰이더 재컴파일 방지를 위해 좌표만 -9999 이동)
      if (distSq3D < 90.0) {
        mItem.active = false;
        mItem.group.position.set(0, -9999, 0);
        // 🔔 황금 메달 전용 '딸랑-' 획득 사운드 재생 (기존 다이아몬드와 차별화)
        if (soundFx && typeof soundFx.playMedalGet === 'function') {
          soundFx.playMedalGet();
        } else if (soundFx && soundFx.playGoldenDiamond) {
          soundFx.playGoldenDiamond(); // Fallback
        }
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
