import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { CFG } from './config.js';
import { STAGES } from './stages.js';

export const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

export const noise2 = (x, z) => {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  const n00 = hash(ix + iz * 1000);
  const n10 = hash(ix + 1 + iz * 1000);
  const n01 = hash(ix + (iz + 1) * 1000);
  const n11 = hash(ix + 1 + (iz + 1) * 1000);
  return (n00 * (1 - ux) + n10 * ux) * (1 - uz) + (n01 * (1 - ux) + n11 * ux) * uz;
};

export const fbm = (x, z, oct = 3) => {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { v += a * noise2(x * f, z * f); a *= 0.5; f *= 2.1; }
  return v;
};

export const getTerrainY = (wx, wz) => {
  const slope = (fbm(wx * 0.006, wz * 0.004, 3) - 0.5) * 3.5;
  const ripples = Math.sin(wx * 0.15) * Math.cos(wz * 0.12) * 0.8;

  // 🏔️ 양옆 지형 바닥이 칼로 잘린 직사각형 판처럼 보이지 않고, 포근하게 솟아오르는 완만한 알프스 눈 언덕 능선 (Snow Valley Ridge)
  const absX = Math.abs(wx);
  let ridgeH = 0;
  if (absX > 210) {
    const norm = (absX - 210) / 110;
    ridgeH = Math.pow(norm, 2.2) * 48.0; // 양옆 210m 지점부터 자연스럽게 솟구치는 눈 언덕 능선!
  }

  return slope + ripples + ridgeH;
};

const createSnowTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#C2D6F5';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = 'rgba(50, 95, 175, 0.75)';
  ctx.lineWidth = 5;
  for (let y = 0; y < 512; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.quadraticCurveTo(256, y + 14, 512, y);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(70, 115, 195, 0.45)';
  ctx.lineWidth = 4;
  for (let x = 0; x < 512; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 20, 512);
    ctx.stroke();
  }

  for (let i = 0; i < 45000; i++) {
    const rx = Math.random() * 512, ry = Math.random() * 512;
    const isBright = Math.random() > 0.35;
    ctx.fillStyle = isBright ? 'rgba(255,255,255,0.95)' : 'rgba(40,80,155,0.6)';
    ctx.fillRect(rx, ry, 2, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(24, 60);
  return tex;
};

export const createTerrainSystem = (scene) => {
  const snowTex = createSnowTexture();
  const snowMat = new THREE.MeshStandardMaterial({
    map: snowTex,
    bumpMap: snowTex,
    bumpScale: 0.40,
    color: 0xEAF2FF,
    roughness: 0.55,
    metalness: 0.10,
    emissive: new THREE.Color(STAGES[0].snowGlow),
    emissiveIntensity: 0.18,
    side: THREE.DoubleSide,
    depthWrite: true,
  });

  const createChunkGeometry = (startWorldZ) => {
    const W = CFG.TW, D = CFG.TD, SW = CFG.SW, SD = CFG.SD;
    const verts = new Float32Array((SW+1)*(SD+1)*3);
    const uvs   = new Float32Array((SW+1)*(SD+1)*2);
    const idx   = [];

    for (let iz = 0; iz <= SD; iz++) {
      for (let ix = 0; ix <= SW; ix++) {
        const u = ix / SW, v = iz / SD;
        const x = (u - 0.5) * W;
        const z = startWorldZ - v * D;
        const y = getTerrainY(x, z);

        const ptr = (iz * (SW + 1) + ix) * 3;
        verts[ptr]   = x;
        verts[ptr+1] = y;
        verts[ptr+2] = z - startWorldZ;

        const uvPtr = (iz * (SW + 1) + ix) * 2;
        uvs[uvPtr]   = u * 16;
        uvs[uvPtr+1] = v * 60;
      }
    }

    for (let iz = 0; iz < SD; iz++) {
      for (let ix = 0; ix < SW; ix++) {
        const a = iz*(SW+1)+ix, b=a+1, c=(iz+1)*(SW+1)+ix, d=c+1;
        idx.push(a, b, c,  b, d, c);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
  };

  let chunkAZ = 300;
  let chunkBZ = chunkAZ - CFG.TD;

  const terrainA = new THREE.Mesh(createChunkGeometry(chunkAZ), snowMat);
  terrainA.position.z = chunkAZ; terrainA.receiveShadow = true; scene.add(terrainA);

  const terrainB = new THREE.Mesh(createChunkGeometry(chunkBZ), snowMat);
  terrainB.position.z = chunkBZ; terrainB.receiveShadow = true; scene.add(terrainB);

  const updateDoubleBufferedTerrain = (playerZ) => {
    if (playerZ < terrainA.position.z - CFG.TD - 100) {
      const newZ = terrainB.position.z - CFG.TD;
      terrainA.geometry.dispose();
      terrainA.geometry = createChunkGeometry(newZ);
      terrainA.position.z = newZ;
    }
    if (playerZ < terrainB.position.z - CFG.TD - 100) {
      const newZ = terrainA.position.z - CFG.TD;
      terrainB.geometry.dispose();
      terrainB.geometry = createChunkGeometry(newZ);
      terrainB.position.z = newZ;
    }
  };

  const resetTerrain = () => {
    chunkAZ = 300; chunkBZ = chunkAZ - CFG.TD;
    terrainA.geometry.dispose(); terrainA.geometry = createChunkGeometry(chunkAZ); terrainA.position.z = chunkAZ;
    terrainB.geometry.dispose(); terrainB.geometry = createChunkGeometry(chunkBZ); terrainB.position.z = chunkBZ;
  };

  return { snowMat, updateDoubleBufferedTerrain, resetTerrain };
};
