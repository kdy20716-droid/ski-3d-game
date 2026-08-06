import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { CFG } from './config.js';
import { hash, getTerrainY } from './terrain.js';

export const createEnvironment = (scene) => {
  // ── 1. Side Mountains ──
  const sideMountainList = [];
  const mntMat = new THREE.MeshStandardMaterial({
    color: 0xC8DCF8, roughness: 0.85, metalness: 0.05,
    emissive: 0x152035, emissiveIntensity: 0.15, depthWrite: true,
  });

  const baseDefs = [
    [-300, 400, 160], [-400, 560, 180], [-250, 520, 165],
    [-460, 680, 220], [-290, 720, 240], [-420, 850, 290],
    [ 300, 490, 165], [ 400, 580, 185], [ 250, 510, 160],
    [ 460, 690, 225], [ 290, 740, 250], [ 420, 870, 300],
  ];

  for (let i = 0; i < 36; i++) {
    const def = baseDefs[i % baseDefs.length];
    const x = def[0], h = def[1], r = def[2];
    const z = 200 - i * 110;

    const geo = new THREE.ConeGeometry(r, h, 9, 2);
    const pos = geo.attributes.position;
    for (let k = 0; k < pos.count; k++) {
      const frac = (pos.getY(k) + h/2) / h;
      if (frac < 0.95) {
        const w = (1 - frac) * r * 0.22;
        pos.setX(k, pos.getX(k) + (hash(k * 0.1 + x) - 0.5) * w);
        pos.setZ(k, pos.getZ(k) + (hash(k * 0.2 + z) - 0.5) * w);
      }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();

    const m = new THREE.Mesh(geo, mntMat);
    const gy = getTerrainY(x, z);
    m.position.set(x, gy - h * 0.28, z);
    scene.add(m);

    sideMountainList.push({ mesh: m, x, z, h, r });
  }

  const updateEndlessSideMountains = (playerZ) => {
    for (const mnt of sideMountainList) {
      if (mnt.z - playerZ > 300) {
        mnt.z -= 36 * 110;
        const gy = getTerrainY(mnt.x, mnt.z);
        mnt.mesh.position.set(mnt.x, gy - mnt.h * 0.28, mnt.z);
      }
    }
  };

  // ── 2. Instanced Trees & Field Floor Diamonds ──
  const treeList = [];
  const scoreItems = [];
  let flagGateMesh = null;

  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.28, 1.2, 6); trunkGeo.translate(0, 0.6, 0);
  const leaf1Geo = new THREE.ConeGeometry(2.1, 3.8, 7); leaf1Geo.translate(0, 2.5, 0);
  const leaf2Geo = new THREE.ConeGeometry(1.6, 3.2, 7); leaf2Geo.translate(0, 4.8, 0);
  const snowCap  = new THREE.ConeGeometry(1.15, 1.0, 7); snowCap.translate(0, 6.2, 0);

  const treeMat = new THREE.MeshStandardMaterial({ color: 0x1A4224, roughness: 0.88, emissive: 0x0A2415, emissiveIntensity: 0.22 });
  const snowCapMat = new THREE.MeshStandardMaterial({ color: 0xF0F6FF, roughness: 0.8, emissive: 0x142035, emissiveIntensity: 0.18 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3D2010, roughness: 0.92, emissive: 0x140A04, emissiveIntensity: 0.20 });

  const N = CFG.TREES;
  const mT = new THREE.InstancedMesh(trunkGeo, trunkMat, N);
  const mL1 = new THREE.InstancedMesh(leaf1Geo, treeMat, N);
  const mL2 = new THREE.InstancedMesh(leaf2Geo, treeMat, N);
  const mS = new THREE.InstancedMesh(snowCap, snowCapMat, N);
  [mL1, mL2].forEach(m => m.castShadow = true);

  const getTreeX = (rand1, rand2, rand3) => {
    if (rand1 < 0.68) {
      const side = rand2 < 0.5 ? -1 : 1;
      return side * (82 + rand3 * 67);
    } else {
      return (rand2 - 0.5) * 160;
    }
  };

  const dummy = new THREE.Object3D();

  for (let i = 0; i < N; i++) {
    const x = getTreeX(hash(i * 1.7), hash(i * 3.3), hash(i * 5.9));
    const z = -(i * 14 + 60 + hash(i * 2.1) * 20);
    const sc = 1.2 + hash(i * 5.1) * 1.6;
    const gy = getTerrainY(x, z);

    dummy.position.set(x, gy, z);
    dummy.rotation.y = hash(i * 7.3) * Math.PI * 2;
    dummy.scale.setScalar(sc);
    dummy.updateMatrix();

    mT.setMatrixAt(i, dummy.matrix);
    mL1.setMatrixAt(i, dummy.matrix);
    mL2.setMatrixAt(i, dummy.matrix);
    mS.setMatrixAt(i, dummy.matrix);

    treeList.push({ id: i, x, z, r2: (1.8 * sc)**2, sc });
  }

  [mT, mL1, mL2, mS].forEach(m => {
    m.frustumCulled = false;
    m.instanceMatrix.needsUpdate = true;
    scene.add(m);
  });

  // 🔷/🟥 일반 필드 바닥 다이아몬드 (70% 파랑, 30% 빨강)
  const diamondGeo = new THREE.OctahedronGeometry(2.4);
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x00D0FF, emissive: 0x0088FF, emissiveIntensity: 0.8, metalness: 0.9, roughness: 0.1 });
  const redMat  = new THREE.MeshStandardMaterial({ color: 0xFF2255, emissive: 0xFF0033, emissiveIntensity: 0.8, metalness: 0.9, roughness: 0.1 });

  for (let i = 0; i < CFG.ITEMS; i++) {
    const rand = hash(i * 4.3);
    const zPos = -(i * 40 + 60);

    let type = 'blue', mat = blueMat, pts = 100;
    if (rand >= 0.70) { type = 'red'; mat = redMat; pts = 300; }

    const mesh = new THREE.Mesh(diamondGeo, mat);
    const x = (hash(i * 2.1) - 0.5) * 240;
    const gy = getTerrainY(x, zPos) + 1.8;
    mesh.position.set(x, gy, zPos);
    scene.add(mesh);

    scoreItems.push({
      mesh, x, z: zPos, baseY: gy, type, pts, active: true, sparkLight: null
    });
  }

  // ── 4. Checkpoint Flag Gate & STAGE 10 웅장한 마라톤/레이싱 피날레 거대 골대 ──
  const flagGroup = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0xE0E0E0, metalness: 0.8 });
  const bannerMat = new THREE.MeshStandardMaterial({ color: 0xFF0044, emissive: 0x880022, side: THREE.DoubleSide });

  const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 12), poleMat); p1.position.set(-12, 6, 0);
  const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 12), poleMat); p2.position.set( 12, 6, 0);
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(24, 3.2), bannerMat); banner.position.set(0, 9.5, 0);

  flagGroup.add(p1, p2, banner);
  flagGroup.position.set(0, -9999, 0);
  scene.add(flagGroup);
  flagGateMesh = flagGroup;

  // 🏆 STAGE 10 피날레 거대 레이싱 골대 (투명 유리벽 X = +-95m 위치에 거대 황금 타워 설치!)
  const grandFinishGroup = new THREE.Group();
  const goldPillarMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.95, roughness: 0.1, emissive: 0xFF9900, emissiveIntensity: 0.8 });
  const trussMat = new THREE.MeshStandardMaterial({ color: 0x222233, metalness: 0.9, roughness: 0.2 });
  const finishBannerMat = new THREE.MeshStandardMaterial({ color: 0xFF0044, emissive: 0xFF0022, emissiveIntensity: 1.2, side: THREE.DoubleSide });

  // 좌/우 투명 유리벽 위치(X = -95m, +95m) 거대 황금 기둥 타워 (높이 28m, 반지름 2.5m)
  const pillarL = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.2, 28, 16), goldPillarMat); pillarL.position.set(-95, 14, 0); pillarL.castShadow = true;
  const pillarR = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.2, 28, 16), goldPillarMat); pillarR.position.set( 95, 14, 0); pillarR.castShadow = true;

  // 기둥 상단 트러스 아치 & FINISH LINE 대형 배너 (폭 190m 전체 횡단!)
  const topArch = new THREE.Mesh(new THREE.BoxGeometry(192, 2.8, 3.2), trussMat); topArch.position.set(0, 26, 0);
  const finishBanner = new THREE.Mesh(new THREE.PlaneGeometry(120, 7.5), finishBannerMat); finishBanner.position.set(0, 22.5, 0);

  // 웅장한 네온 조명
  const finishLightL = new THREE.PointLight(0xFFD700, 5.0, 60); finishLightL.position.set(-95, 26, 0);
  const finishLightR = new THREE.PointLight(0xFFD700, 5.0, 60); finishLightR.position.set( 95, 26, 0);

  grandFinishGroup.add(pillarL, pillarR, topArch, finishBanner, finishLightL, finishLightR);
  grandFinishGroup.position.set(0, -9999, 0);
  scene.add(grandFinishGroup);

  const spawnFlagGate = (dist, isFinalStage = false) => {
    const z = -dist;
    if (isFinalStage) {
      flagGateMesh.position.set(0, -9999, 0);
      grandFinishGroup.position.set(0, getTerrainY(0, z), z);
    } else {
      grandFinishGroup.position.set(0, -9999, 0);
      flagGateMesh.position.set(0, getTerrainY(0, z), z);
    }
  };

  const updateEndlessObstaclesAndItems = (playerZ, time) => {
    for (const tree of treeList) {
      if (tree.z - playerZ > 280) {
        tree.z -= CFG.TREES * 14;
        tree.x = getTreeX(Math.random(), Math.random(), Math.random());
        const gy = getTerrainY(tree.x, tree.z);

        dummy.position.set(tree.x, gy, tree.z);
        dummy.rotation.y = Math.random() * Math.PI * 2;
        dummy.scale.setScalar(tree.sc);
        dummy.updateMatrix();

        mT.setMatrixAt(tree.id, dummy.matrix);
        mL1.setMatrixAt(tree.id, dummy.matrix);
        mL2.setMatrixAt(tree.id, dummy.matrix);
        mS.setMatrixAt(tree.id, dummy.matrix);
      }
    }
    [mT, mL1, mL2, mS].forEach(m => m.instanceMatrix.needsUpdate = true);

    for (const item of scoreItems) {
      if (item.z - playerZ > 280) {
        item.z -= CFG.ITEMS * 40;
        item.x = (Math.random() - 0.5) * 240;
        const isRed = Math.random() >= 0.70;
        item.type = isRed ? 'red' : 'blue';
        item.pts = isRed ? 300 : 100;
        item.mesh.material = isRed ? redMat : blueMat;
        item.baseY = getTerrainY(item.x, item.z) + 1.8;
        item.mesh.position.set(item.x, item.baseY, item.z);
        item.mesh.scale.setScalar(1.0);
        item.active = true;
        item.mesh.visible = true;
      }
    }
  };

  // ── 3. Snow System ──
  const makeSnow = (numParticles) => {
    const pos = new Float32Array(numParticles * 3);
    const vel = new Float32Array(numParticles * 3);
    for (let i = 0; i < numParticles; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 220;
      pos[i*3+1] = Math.random() * 60;
      pos[i*3+2] = (Math.random() - 0.5) * 260 - 60;
      vel[i*3]   = (Math.random() - 0.5) * 1.2;
      vel[i*3+1] = -(1.6 + Math.random() * 2.4);
      vel[i*3+2] = (Math.random() - 0.5) * 1.0;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0xEEF5FF, size: 0.30, transparent: true, opacity: 0.82,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    return { pts, pos, vel };
  };

  const SNOW = makeSnow(CFG.SNOW_PARTICLES);

  const updateContinuousSnow = (dt) => {
    const sp = SNOW.pos, sv = SNOW.vel;
    for (let i = 0; i < CFG.SNOW_PARTICLES; i++) {
      sp[i*3]   += sv[i*3]   * dt * 4;
      sp[i*3+1] += sv[i*3+1] * dt * 4;
      sp[i*3+2] += sv[i*3+2] * dt * 4;

      const outX = Math.abs(sp[i*3])   > 115;
      const outY = sp[i*3+1] < -15;
      const outZ = sp[i*3+2] > 60 || sp[i*3+2] < -180;

      if (outX || outY || outZ) {
        sp[i*3]   = (Math.random() - 0.5) * 220;
        sp[i*3+1] = 40 + Math.random() * 30;
        sp[i*3+2] = (Math.random() - 0.5) * 260 - 60;
        sv[i*3]   = (Math.random() - 0.5) * 1.2;
        sv[i*3+1] = -(1.6 + Math.random() * 2.4);
        sv[i*3+2] = (Math.random() - 0.5) * 1.0;
      }
    }
    SNOW.pts.geometry.attributes.position.needsUpdate = true;
  };



  const resetEnvironment = () => {
    for (let i = 0; i < sideMountainList.length; i++) {
      const mnt = sideMountainList[i];
      const def = baseDefs[i % baseDefs.length];
      mnt.x = def[0]; mnt.h = def[1]; mnt.r = def[2];
      mnt.z = 200 - i * 110;
      const gy = getTerrainY(mnt.x, mnt.z);
      mnt.mesh.position.set(mnt.x, gy - mnt.h * 0.28, mnt.z);
    }
    for (let i = 0; i < treeList.length; i++) {
      const tree = treeList[i];
      tree.x = getTreeX(hash(i * 1.7), hash(i * 3.3), hash(i * 5.9));
      tree.z = -(i * 14 + 60 + hash(i * 2.1) * 20);
      const gy = getTerrainY(tree.x, tree.z);

      dummy.position.set(tree.x, gy, tree.z);
      dummy.rotation.y = hash(i * 7.3) * Math.PI * 2;
      dummy.scale.setScalar(tree.sc);
      dummy.updateMatrix();

      mT.setMatrixAt(i, dummy.matrix);
      mL1.setMatrixAt(i, dummy.matrix);
      mL2.setMatrixAt(i, dummy.matrix);
      mS.setMatrixAt(i, dummy.matrix);
    }
    [mT, mL1, mL2, mS].forEach(m => m.instanceMatrix.needsUpdate = true);

    for (let i = 0; i < scoreItems.length; i++) {
      const item = scoreItems[i];
      item.x = (hash(i * 2.1) - 0.5) * 240;
      item.z = -(i * 40 + 60);
      item.baseY = getTerrainY(item.x, item.z) + 1.8;
      item.mesh.position.set(item.x, item.baseY, item.z);
      item.mesh.scale.setScalar(1.0);
      item.active = true;
      item.mesh.visible = true;
    }
  };

  return {
    treeList, scoreItems, flagGateMesh, spawnFlagGate,
    snowPts: SNOW.pts, resetEnvironment,
    updateEndlessSideMountains, updateEndlessObstaclesAndItems, updateContinuousSnow
  };
};
