import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { getTerrainY } from './terrain.js?v=24.0.0';

export const createBirdHazardSystem = (scene) => {
  const birds = [];
  let spawnTimer = 0.0;

  // 🦅 1. 흰색 일반 새 3D 재질 (설산 배경에서도 100% 뚜렷하게 돋보이는 짙은 네이비 깃털 테두리!)
  const whiteBirdMat = new THREE.MeshStandardMaterial({
    color: 0xF0F6FF, roughness: 0.4, metalness: 0.1, emissive: 0x1A2B3C, emissiveIntensity: 0.2
  });
  const darkWingEdgeMat = new THREE.MeshStandardMaterial({
    color: 0x152030, roughness: 0.3, emissive: 0x0A121F, emissiveIntensity: 0.3
  });
  const beakMat = new THREE.MeshStandardMaterial({ color: 0xFF8800, roughness: 0.2, emissive: 0xFF5500, emissiveIntensity: 0.4 });

  // 🦅 2. 검은색 기습 새 3D 지오메트리 & 강렬한 붉은 눈동자/날개 테두리 재질
  const blackBirdMat = new THREE.MeshStandardMaterial({
    color: 0x101018, roughness: 0.3, metalness: 0.5, emissive: 0x050510, emissiveIntensity: 0.2
  });
  const eyeRedMat = new THREE.MeshStandardMaterial({
    color: 0xFF0033, emissive: 0xFF0022, emissiveIntensity: 3.5
  });

  // 🦅 3D 새 메쉬 생성 함수 (어두운 외곽선 깃털 팁을 추가하여 200m 전방 시야에서도 100% 선명하게 돋보임!)
  const createBirdMesh = (type = 'white') => {
    const group = new THREE.Group();
    const isBlack = (type === 'black');
    const bodyMat = isBlack ? blackBirdMat : whiteBirdMat;
    const wingTipMat = isBlack ? eyeRedMat : darkWingEdgeMat;

    // 몸통 (유선형 메쉬)
    const bodyGeo = new THREE.ConeGeometry(0.60, 2.4, 6);
    bodyGeo.rotateX(Math.PI / 2);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // 부리
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.7, 5), beakMat);
    beak.rotation.x = -Math.PI / 2;
    beak.position.set(0, 0, 1.35);
    group.add(beak);

    // 눈 (검은새는 붉은 눈빛!)
    if (isBlack) {
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 6), eyeRedMat);
      eyeL.position.set(-0.25, 0.22, 0.90);
      const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 6), eyeRedMat);
      eyeR.position.set( 0.25, 0.22, 0.90);
      group.add(eyeL, eyeR);
    }

    // 날개 (Left & Right)
    const wingGeo = new THREE.BoxGeometry(2.6, 0.09, 0.9);
    wingGeo.translate(1.3, 0, 0); // 회전축을 몸통 조인트로 설정

    const wingL = new THREE.Mesh(wingGeo, bodyMat);
    wingL.position.set(0.2, 0.1, 0);

    const wingR = new THREE.Mesh(wingGeo, bodyMat);
    wingR.position.set(-0.2, 0.1, 0);
    wingR.rotation.y = Math.PI; // 반대 방향

    // 🌟 설산 하얀 배경에서도 새의 형태가 100% 뚜렷하도록 날개 끝에 짙은 가로 실루엣 팁 배치!
    const wingTipGeo = new THREE.BoxGeometry(0.7, 0.11, 0.95);
    const tipL = new THREE.Mesh(wingTipGeo, wingTipMat);
    tipL.position.set(2.2, 0, 0);
    wingL.add(tipL);

    const tipR = new THREE.Mesh(wingTipGeo, wingTipMat);
    tipR.position.set(2.2, 0, 0);
    wingR.add(tipR);

    group.add(wingL, wingR);
    scene.add(group);

    return { group, wingL, wingR, type };
  };

  // 🦅 새 스폰 로직 (플레이어가 지나가는 주행 라인 근처에서 출현!)
  const spawnBird = (playerZ, playerX, stageNum) => {
    // 스테이지별 검은새 확률 산출
    let type = 'white';
    if (stageNum === 10) {
      type = 'black';
    } else if (stageNum >= 4) {
      const blackChance = 0.25 + (stageNum - 4) * 0.12; // Stage 4: 25%, Stage 9: 85%
      if (Math.random() < blackChance) type = 'black';
    }

    const birdMesh = createBirdMesh(type);
    
    // 점프대/황금 메달 Y축 고공 위치 (Y = +13m ~ +21m) - 플레이어 현재 주행 레인 근처(±22m)에서 유입!
    const spawnX = playerX + (Math.random() - 0.5) * 44.0;
    const spawnZ = playerZ - 200.0; // 내 맞은편 distant 200m 앞
    const gy = getTerrainY(spawnX, spawnZ);
    const spawnY = gy + 13.0 + Math.random() * 8.0;

    birdMesh.group.position.set(spawnX, spawnY, spawnZ);
    birdMesh.group.rotation.y = 0; // 내쪽(+Z 방향)을 향하도록 설정

    birds.push({
      group: birdMesh.group,
      wingL: birdMesh.wingL,
      wingR: birdMesh.wingR,
      type,
      x: spawnX,
      y: spawnY,
      z: spawnZ,
      vx: 0,
      vy: 0,
      vz: 38.0 + Math.random() * 10.0, // 맞은편에서 내쪽으로 날아오는 속도
      state: 'normal', // 'normal' | 'diving'
      active: true,
      flapTime: Math.random() * Math.PI * 2
    });
  };

  // 🦅 업데이트 루프
  const update = (playerZ, playerX, playerY, stageNum, dt, time, onBirdHit) => {
    // 1) 스폰 쿨다운 타이머 (연사총 방지 적정 쿨다운 제어)
    if (stageNum >= 2) {
      spawnTimer += dt;
      // 스테이지 2~3: 6.5초, 스테이지 4~6: 5.2초, 스테이지 7~9: 4.2초, 스테이지 10: 3.5초
      let interval = 6.5;
      if (stageNum === 10) interval = 3.5;
      else if (stageNum >= 7) interval = 4.2;
      else if (stageNum >= 4) interval = 5.2;

      if (spawnTimer >= interval) {
        spawnTimer = 0;
        spawnBird(playerZ, playerX, stageNum);
      }
    }

    // 2) 각 새들의 이동 & 파닥거림 애니메이션 & 검은새 급강하 AI
    for (let i = birds.length - 1; i >= 0; i--) {
      const b = birds[i];
      if (!b.active) continue;

      b.flapTime += dt * 16.0;
      const wingAngle = Math.sin(b.flapTime) * 0.45;
      b.wingL.rotation.z = wingAngle;
      b.wingR.rotation.z = -wingAngle;

      // 🖤 검은색 새 기습 급강하 AI (플레이어가 밑으로 통과하려 할 때 나에게 미사일처럼 추락!)
      if (b.type === 'black' && b.state === 'normal') {
        const dx = playerX - b.x;
        const dz = b.z - playerZ;
        
        // 내 머리 위 상공 60m ~ 10m 구간 진입 & X축 거리 10m 이내로 지나치려 할 때!
        if (Math.abs(dx) < 10.0 && dz < 60.0 && dz > 5.0) {
          b.state = 'diving';
          // 급강하 타겟 속도 산출
          const targetY = playerY + 1.2;
          const dy = targetY - b.y;
          const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
          const diveSpeed = 75.0; // 2.5배 초고속 급강하!
          
          b.vx = (dx / dist) * diveSpeed;
          b.vy = (dy / dist) * diveSpeed;
          b.vz = (dz / dist) * diveSpeed;

          // 새의 회전 앵글을 내 머리 방향으로 급강하 경사 조절
          b.group.rotation.x = Math.atan2(-b.vy, b.vz);
          b.group.rotation.y = Math.atan2(b.vx, b.vz);
        }
      }

      // 위치 업데이트
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.z += b.vz * dt;
      b.group.position.set(b.x, b.y, b.z);

      // 3) 충돌 체킹 (플레이어 위치와 3D 거리 4.2m 이내)
      const cdx = playerX - b.x;
      const cdy = (playerY + 1.2) - b.y;
      const cdz = playerZ - b.z;
      const distSq = cdx*cdx + cdy*cdy + cdz*cdz;

      if (distSq < 18.0) { // 4.2m 판정
        b.active = false;
        b.group.position.set(0, -9999, 0); // 획득/충돌 즉시 씬 제거 대신 이동
        if (onBirdHit) onBirdHit(b.type);
      }

      // 플레이어 시야 멀리 통과했으면 삭제
      if (b.z - playerZ > 40.0 || b.y < getTerrainY(b.x, b.z) - 5.0) {
        b.active = false;
        scene.remove(b.group);
        birds.splice(i, 1);
      }
    }
  };

  const reset = () => {
    for (const b of birds) {
      if (b.group) scene.remove(b.group);
    }
    birds.length = 0;
    spawnTimer = 0;
  };

  return { update, reset };
};
