import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { getTerrainY } from './terrain.js?v=28.0.0';

export const createExplodingSnowballHazardSystem = (scene, camera) => {
  const bombs = [];
  const fireworks = [];
  let spawnTimer = 0.0;
  let stompCombo = 0;

  // 💣 1. 거대해진 폭발 눈덩이 3D 지오메트리 & 재질 (반지름 3.8m 거대 폭탄)
  const snowShellGeo = new THREE.SphereGeometry(3.8, 16, 16);
  const snowShellMat = new THREE.MeshStandardMaterial({
    color: 0xF5F9FF, roughness: 0.7, transparent: true, opacity: 0.95
  });

  const coreGeo = new THREE.SphereGeometry(2.8, 14, 14);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xFF0033, wireframe: false });

  // 🎆 2. 양옆 축하 폭죽 3D 이펙트 생성기
  const triggerFireworks = (ui, soundFx) => {
    if (soundFx && soundFx.playVictory) soundFx.playVictory();

    const colors = [0xFF0055, 0x00FFCC, 0xFFDD00, 0xFF33FF, 0x0099FF, 0xFF9900];
    
    // 왼쪽(-18m), 오른쪽(+18m) 양옆 폭죽 터뜨리기
    const sides = [-18.0, 18.0];
    sides.forEach(sideX => {
      for (let i = 0; i < 40; i++) {
        const pMat = new THREE.MeshBasicMaterial({
          color: colors[Math.floor(Math.random() * colors.length)],
          transparent: true,
          opacity: 1.0
        });
        const pGeo = new THREE.SphereGeometry(0.45 + Math.random() * 0.35, 6, 6);
        const mesh = new THREE.Mesh(pGeo, pMat);

        // 오프셋 계산 (카메라 기준 전방 좌우)
        const spawnX = sideX;
        const spawnY = 14.0 + Math.random() * 6.0;
        const spawnZ = -22.0;

        mesh.position.set(spawnX, spawnY, spawnZ);
        if (camera) camera.add(mesh);

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const spd = 12.0 + Math.random() * 18.0;

        fireworks.push({
          mesh,
          vx: Math.sin(phi) * Math.cos(theta) * spd,
          vy: Math.cos(phi) * spd,
          vz: Math.sin(phi) * Math.sin(theta) * spd,
          life: 1.8,
          maxLife: 1.8
        });
      }
    });
  };

  // 💣 3D 폭발 눈덩이 메쉬 생성
  const createBombMesh = () => {
    const group = new THREE.Group();
    const shell = new THREE.Mesh(snowShellGeo, snowShellMat);
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(shell, core);
    scene.add(group);
    return { group, shell, core };
  };

  // 💣 폭발 눈덩이 스폰 (스테이지 7부터 스폰)
  const spawnBomb = (playerZ, playerX) => {
    const bombMesh = createBombMesh();
    
    // 플레이어 전방 35~50m 거리에서 유입
    const side = Math.random() < 0.5 ? -1 : 1;
    const spawnX = playerX + side * (6.0 + Math.random() * 10.0);
    const spawnZ = playerZ - (35.0 + Math.random() * 15.0);
    const gy = getTerrainY(spawnX, spawnZ) + 3.8;

    bombMesh.group.position.set(spawnX, gy, spawnZ);

    bombs.push({
      group: bombMesh.group,
      core: bombMesh.core,
      x: spawnX,
      y: gy,
      z: spawnZ,
      fuseTimer: 0.0,
      active: true,
    });
  };

  // 💣 업데이트 루프 (추적 추격, 밟기 해제 판정, 폭발 및 콤보왕 이스터에그 처리)
  const update = (playerZ, playerX, playerY, playerSpeed, playerVy, stageNum, dt, time, soundFx, ui, onExplodeKnockback, onStompBounce) => {
    // 1) 7스테이지부터 폭발 눈덩이 스폰
    if (stageNum >= 7) {
      spawnTimer += dt;
      const interval = stageNum === 10 ? 3.2 : 4.2;
      if (spawnTimer >= interval) {
        spawnTimer = 0;
        spawnBomb(playerZ, playerX);
      }
    }

    // 2) 폭죽 이펙트 시뮬레이션
    for (let i = fireworks.length - 1; i >= 0; i--) {
      const fw = fireworks[i];
      fw.life -= dt;
      fw.mesh.position.x += fw.vx * dt;
      fw.mesh.position.y += fw.vy * dt - 9.8 * dt * dt; // 중력 낙하
      fw.mesh.position.z += fw.vz * dt;
      fw.mesh.material.opacity = Math.max(0, fw.life / fw.maxLife);

      if (fw.life <= 0) {
        if (camera) camera.remove(fw.mesh);
        fireworks.splice(i, 1);
      }
    }

    // 3) 폭발 눈덩이 유도 추격 & 밟기 안터짐 판정 & 2.5초 시한폭발
    for (let i = bombs.length - 1; i >= 0; i--) {
      const b = bombs[i];
      if (!b.active) continue;

      b.fuseTimer += dt;

      // 🏃‍♂️ 플레이어 쪽으로 유연하게 서서히 추격 추종! (X축 유도 추격 + Z축 플레이어 속도 맞춤)
      b.x += (playerX - b.x) * (dt * 1.6);
      b.z -= playerSpeed * 0.96 * dt; // 플레이어보다 살짝 천천히 추격!
      b.y = getTerrainY(b.x, b.z) + 3.8;
      b.group.position.set(b.x, b.y, b.z);

      // 🔴 빨간색 빠른 점멸 비주얼
      const progress = Math.min(1.0, b.fuseTimer / 2.5);
      const blinkFreq = 4.0 + progress * 26.0;
      const isRed = Math.sin(time * blinkFreq) > 0;
      b.core.material.color.setHex(isRed ? 0xFF0022 : 0x440000);
      b.core.scale.setScalar(1.0 + Math.sin(time * blinkFreq) * 0.22);

      // 👟 💥 밟기 판정! (터지기 전에 위에서 밟으면 불발 해제!)
      const dx = playerX - b.x;
      const dz = playerZ - b.z;
      const horizDist = Math.sqrt(dx * dx + dz * dz);
      const relY = playerY - b.y; // 플레이어가 눈덩이 상단 위쪽에 위치하는지 체크

      if (horizDist < 4.2 && relY >= -0.5 && relY <= 5.5) {
        // 🎯 밟아서 해제 성공! 폭발하지 않고 디퓨즈!
        b.active = false;
        scene.remove(b.group);
        bombs.splice(i, 1);

        stompCombo += 1;
        const comboPts = Math.min(10, stompCombo) * 100; // 100, 200, 300 ... 900, 1000점!

        if (soundFx && soundFx.playCoin) soundFx.playCoin();

        // 플레이어 스프링 점프 리바운드
        if (onStompBounce) onStompBounce(comboPts);

        // 👑 10개째 밟았을 때 이스터에그 콤보왕 +10,000점 대축제 발생!
        if (stompCombo === 10) {
          if (ui) {
            ui.showToast('👑 콤보왕! COMBO KING! 👑', '+10,000 BONUS PTS! 🎉');
            if (ui.showBonusToast) ui.showBonusToast('👑 콤보왕 10-COMBO MASTER! +10,000 PTS 🎆', true);
          }
          triggerFireworks(ui, soundFx);
          if (onStompBounce) onStompBounce(10000); // +10,000 보너스 점수 추가!
        } else {
          if (ui) {
            ui.showBonusToast(`STOMP! +${comboPts} PTS (COMBO x${stompCombo}) 👟✨`, true);
          }
        }

        continue;
      }

      // 💣 2.5초 동안 밟지 못하면 펑! 폭발 처리
      if (b.fuseTimer >= 2.5) {
        b.active = false;
        b.group.position.set(0, -9999, 0);

        if (soundFx && soundFx.playCrash) soundFx.playCrash();

        // 💥 폭발 넉백 충격파 범위 판정 (폭발 중심 22m 이내)
        const blastDx = playerX - b.x;
        const blastDy = (playerY + 1.2) - b.y;
        const blastDz = playerZ - b.z;
        const dist = Math.sqrt(blastDx * blastDx + blastDy * blastDy + blastDz * blastDz);

        if (dist < 22.0) {
          const normX = dist > 0.001 ? blastDx / dist : 0;
          const normZ = dist > 0.001 ? blastDz / dist : 1;
          const knockForce = (1.0 - dist / 22.0) * 36.0;

          if (onExplodeKnockback) {
            onExplodeKnockback({
              dirX: normX,
              dirZ: normZ,
              force: knockForce,
              isFrontExplosion: blastDz > 0
            });
          }
        }

        scene.remove(b.group);
        bombs.splice(i, 1);
      }
    }
  };

  const reset = () => {
    for (const b of bombs) {
      if (b.group) scene.remove(b.group);
    }
    for (const fw of fireworks) {
      if (camera) camera.remove(fw.mesh);
    }
    bombs.length = 0;
    fireworks.length = 0;
    spawnTimer = 0;
    stompCombo = 0;
  };

  return { update, reset };
};
