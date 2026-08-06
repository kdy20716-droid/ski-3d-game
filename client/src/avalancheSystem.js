import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

export const createAvalancheSystem = (scene) => {
  const avalancheGroup = new THREE.Group();
  scene.add(avalancheGroup);

  // 24개 3D 볼륨 구름으로 촘촘하고 웅장하게 좌우 위로 꺾인 V자형 거대 해일 조형!
  for (let i = 0; i < 24; i++) {
    const cloudGeo = new THREE.DodecahedronGeometry(12 + Math.random() * 14, 1);
    const cloudMat = new THREE.MeshLambertMaterial({
      color: 0xF2F6FF, transparent: true, opacity: 0.85, flatShading: true
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    
    // 좌우 X 위치 (-120m ~ +120m)
    const x = (i / 23 - 0.5) * 240.0;
    // 좌우 양끝으로 갈수록 위로 웅장하게 꺾여 올라가는 곡선 높이 Y! (V자 꺾인 모양)
    const wingCurveY = 8.0 + Math.pow(Math.abs(x) / 100.0, 1.8) * 32.0;
    
    cloudMesh.position.set(x, wingCurveY + (Math.random() - 0.5) * 8.0, (Math.random() - 0.5) * 18.0);
    cloudMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    avalancheGroup.add(cloudMesh);
  }

  // 좌우 위로 꺾인 2500개 입체 솟구침 눈 파티클
  const particleCount = 2500;
  const avPos = new Float32Array(particleCount * 3);
  for (let p = 0; p < particleCount; p++) {
    const px = (Math.random() - 0.5) * 260.0;
    const wingCurveY = Math.pow(Math.abs(px) / 100.0, 1.8) * 35.0;
    avPos[p*3]   = px;
    avPos[p*3+1] = Math.random() * 22.0 + wingCurveY;
    avPos[p*3+2] = (Math.random() - 0.5) * 26.0;
  }
  const avGeo = new THREE.BufferGeometry();
  avGeo.setAttribute('position', new THREE.BufferAttribute(avPos, 3));
  const avPts = new THREE.Points(avGeo, new THREE.PointsMaterial({
    color: 0xFFFFFF, size: 1.6, transparent: true, opacity: 0.92,
    blending: THREE.AdditiveBlending, depthWrite: false
  }));
  avalancheGroup.add(avPts);

  const updateAvalanche = (avalancheZ) => {
    avalancheGroup.position.set(0, 0, avalancheZ);
    // 롤링 회전 연출
    avalancheGroup.children.forEach((c, idx) => {
      c.rotation.x += 0.01 * (idx % 2 === 0 ? 1 : -1);
      c.rotation.y += 0.015;
    });
  };

  const reset = () => {
    avalancheGroup.position.set(0, 0, 45.0);
  };

  return { avalancheGroup, updateAvalanche, reset };
};
