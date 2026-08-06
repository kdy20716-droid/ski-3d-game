import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

export const makeSkier = () => {
  const rootGroup = new THREE.Group();
  const bodyGroup = new THREE.Group(); // 🏎️ 마리오 카트 스타일 Y축 80도 획 회전 전용 바디 그룹!
  bodyGroup.rotation.reorder('YXZ');

  const s = (c, rg=0.6, mt=0.1) => new THREE.MeshStandardMaterial({ color:c, roughness:rg, metalness:mt, emissive: c, emissiveIntensity: 0.15 });

  const skiMat = s(0x18182E, 0.2, 0.8);
  const skiL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 3.2), skiMat); skiL.position.set(-0.28, 0.03, 0.2); skiL.castShadow = true;
  const skiR = skiL.clone(); skiR.position.set(0.28, 0.03, 0.2);

  const pants  = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.74, 0.5), s(0x152045)); pants.position.y = 0.44; pants.castShadow = true;
  const jacket = new THREE.Mesh(new THREE.BoxGeometry(0.74, 1.1, 0.54), s(0x00E0FF)); jacket.position.y = 1.13; jacket.castShadow = true;
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.33, 14, 10), s(0xFF3300, 0.3, 0.2)); helmet.position.y = 2.04; helmet.castShadow = true;
  const gogg   = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.18), s(0xFFB000, 0.1, 0.9)); gogg.position.set(0, 2.03, 0.24);

  const shadowGeo = new THREE.PlaneGeometry(1.8, 3.8); shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x050015, transparent: true, opacity: 0.6, depthWrite: false,
  });
  const shadowBlob = new THREE.Mesh(shadowGeo, shadowMat);
  shadowBlob.position.y = 0.01;

  bodyGroup.add(skiL, skiR, pants, jacket, helmet, gogg);
  rootGroup.add(bodyGroup, shadowBlob);

  // ❄️ 드리프트 엣지 카빙 시 촤아악 뿜어지는 하얀 눈보라 파티클
  const sprayCount = 220;
  const sprayPos = new Float32Array(sprayCount * 3);
  const sprayVel = new Float32Array(sprayCount * 3);
  const sprayLife = new Float32Array(sprayCount);

  for (let i = 0; i < sprayCount; i++) {
    sprayPos[i*3] = 0; sprayPos[i*3+1] = 0; sprayPos[i*3+2] = 0;
    sprayVel[i*3] = 0; sprayVel[i*3+1] = 0; sprayVel[i*3+2] = 0;
    sprayLife[i] = 0;
  }

  const sprayGeo = new THREE.BufferGeometry();
  sprayGeo.setAttribute('position', new THREE.BufferAttribute(sprayPos, 3));
  const sprayMat = new THREE.PointsMaterial({
    color: 0xFFFFFF, size: 0.50, transparent: true, opacity: 0.0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const sprayPoints = new THREE.Points(sprayGeo, sprayMat);
  rootGroup.add(sprayPoints);

  rootGroup.scale.setScalar(2.0);

  return { group: rootGroup, bodyGroup, shadowBlob, shadowMat, sprayPoints, sprayMat, sprayGeo, sprayPos, sprayVel, sprayLife };
};
