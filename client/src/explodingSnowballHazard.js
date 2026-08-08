import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { getTerrainY } from './terrain.js?v=33.0.0';

export const createExplodingSnowballHazardSystem = (scene, camera) => {
  const bombs = [];
  const fireworks = [];
  const snowDustParticles = [];
  const shockwaves = [];
  let spawnTimer = 0.0;
  let stompCombo = 0;

  // 💣 1. 거대해진 폭발 눈덩이 3D 지오메트리 & 기본 재질 템플릿
  const snowShellGeo = new THREE.SphereGeometry(3.8, 16, 16);
  const snowCoreGeo = new THREE.SphereGeometry(2.8, 14, 14);

  // ❄️ 2. 3D 눈가루 폭발 파티클 시뮬레이터 (펑! 터질 때 사방으로 퍼지는 50개 눈 조각)
  const triggerSnowExplosionParticles = (centerX, centerY, centerZ) => {
    // 💥 Expanding Shockwave Mesh (확장하는 충격파 구체)
    const waveMat = new THREE.MeshBasicMaterial({
      color: 0xFF3300, transparent: true, opacity: 0.85, wireframe: true
    });
    const waveMesh = new THREE.Mesh(new THREE.SphereGeometry(2.0, 16, 16), waveMat);
    waveMesh.position.set(centerX, centerY, centerZ);
    scene.add(waveMesh);
    shockwaves.push({ mesh: waveMesh, scale: 1.0, opacity: 0.85 });

    // ❄️ 50개 눈가루 & 얼음 조각 파티클 생성
    const snowMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF, roughness: 0.5, emissive: 0xDDFAFF, emissiveIntensity: 0.5
    });
    const iceMat = new THREE.MeshStandardMaterial({
      color: 0x99EEFF, roughness: 0.2, emissive: 0x00CCFF, emissiveIntensity: 0.8
    });

    for (let i = 0; i < 50; i++) {
      const isIce = Math.random() < 0.3;
      const size = 0.35 + Math.random() * 0.7;
      const pGeo = Math.random() < 0.5 ? new THREE.SphereGeometry(size, 6, 6) : new THREE.BoxGeometry(size, size, size);
      const mesh = new THREE.Mesh(pGeo, isIce ? iceMat : snowMat);

      mesh.position.set(centerX, centerY, centerZ);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      scene.add(mesh);

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const spd = 14.0 + Math.random() * 26.0;

      snowDustParticles.push({
        mesh,
        vx: Math.sin(phi) * Math.cos(theta) * spd,
        vy: Math.cos(phi) * spd * 0.9 + 6.0,
        vz: Math.sin(phi) * Math.sin(theta) * spd,
        rotX: (Math.random() - 0.5) * 12.0,
        rotY: (Math.random() - 0.5) * 12.0,
        life: 1.2,
        maxLife: 1.2
      });
    }
  };

  // 🎆 3. 10-콤보 양옆 축하 폭죽 3D 이펙트
  const triggerFireworks = (ui, soundFx) => {
    if (soundFx && soundFx.playVictory) soundFx.playVictory();

    const colors = [0xFF0055, 0x00FFCC, 0xFFDD00, 0xFF33FF, 0x0099FF, 0xFF9900];
    const sides = [-18.0, 18.0];
    sides.forEach(sideX => {
      for (let i = 0; i < 40; i++) {
        const pMat = new THREE.MeshBasicMaterial({
          color: colors[Math.floor(Math.random() * colors.length)],
          transparent: true, opacity: 1.0
        });
        const pGeo = new THREE.SphereGeometry(0.45 + Math.random() * 0.35, 6, 6);
        const mesh = new THREE.Mesh(pGeo, pMat);

        mesh.position.set(sideX, 14.0 + Math.random() * 6.0, -22.0);
        if (camera) camera.add(mesh);

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const spd = 12.0 + Math.random() * 18.0;

        fireworks.push({
          mesh,
          vx: Math.sin(phi) * Math.cos(theta) * spd,
          vy: Math.cos(phi) * spd,
          vz: Math.sin(phi) * Math.sin(theta) * spd,
          life: 1.8, maxLife: 1.8
        });
      }
    });
  };

  // 💣 3D 폭발 눈덩이 메쉬 생성 (개별 클론 재질 적용하여 초강력 붉은 발광 가능!)
  const createBombMesh = () => {
    const group = new THREE.Group();
    const shellMat = new THREE.MeshStandardMaterial({
      color: 0xF5F9FF, roughness: 0.6, transparent: true, opacity: 0.95,
      emissive: 0x000000, emissiveIntensity: 0.0
    });
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xFF0022, roughness: 0.3, emissive: 0xFF0000, emissiveIntensity: 3.5
    });

    const shell = new THREE.Mesh(snowShellGeo, shellMat);
    const core = new THREE.Mesh(snowCoreGeo, coreMat);
    group.add(shell, core);
    scene.add(group);
    return { group, shell, core, shellMat, coreMat };
  };

  // 💣 폭발 눈덩이 스폰 (스테이지 7부터 스폰)
  const spawnBomb = (playerZ, playerX) => {
    const bObj = createBombMesh();
    const side = Math.random() < 0.5 ? -1 : 1;
    const spawnX = playerX + side * (6.0 + Math.random() * 10.0);
    const spawnZ = playerZ - (35.0 + Math.random() * 15.0);
    const gy = getTerrainY(spawnX, spawnZ) + 3.8;

    bObj.group.position.set(spawnX, gy, spawnZ);

    bombs.push({
      group: bObj.group,
      shell: bObj.shell,
      core: bObj.core,
      shellMat: bObj.shellMat,
      coreMat: bObj.coreMat,
      x: spawnX, y: gy, z: spawnZ,
      fuseTimer: 0.0,
      state: 'chasing', // 'chasing' | 'creeper_fuse' (크리퍼처럼 부풀어오르며 스스스 퓨즈 폭발!)
      creeperFuseTimer: 0.0,
      active: true,
    });
  };

  // 💣 업데이트 루프
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

    // 2) 눈가루 폭발 파티클 애니메이션 시뮬레이션
    for (let i = snowDustParticles.length - 1; i >= 0; i--) {
      const p = snowDustParticles[i];
      p.life -= dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt - 12.0 * dt * dt; // 중력 낙하
      p.mesh.position.z += p.vz * dt;
      p.mesh.rotation.x += p.rotX * dt;
      p.mesh.rotation.y += p.rotY * dt;

      p.mesh.material.opacity = Math.max(0, p.life / p.maxLife);

      if (p.life <= 0) {
        scene.remove(p.mesh);
        snowDustParticles.splice(i, 1);
      }
    }

    // 충격파 확장 애니메이션
    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const sw = shockwaves[i];
      sw.scale += dt * 32.0;
      sw.opacity -= dt * 1.8;
      sw.mesh.scale.setScalar(sw.scale);
      sw.mesh.material.opacity = Math.max(0, sw.opacity);

      if (sw.opacity <= 0) {
        scene.remove(sw.mesh);
        shockwaves.splice(i, 1);
      }
    }

    // 폭죽 이펙트 시뮬레이션
    for (let i = fireworks.length - 1; i >= 0; i--) {
      const fw = fireworks[i];
      fw.life -= dt;
      fw.mesh.position.x += fw.vx * dt;
      fw.mesh.position.y += fw.vy * dt - 9.8 * dt * dt;
      fw.mesh.position.z += fw.vz * dt;
      fw.mesh.material.opacity = Math.max(0, fw.life / fw.maxLife);

      if (fw.life <= 0) {
        if (camera) camera.remove(fw.mesh);
        fireworks.splice(i, 1);
      }
    }

    // 3) 폭발 눈덩이 크리퍼 유도 추격 & 초강력 붉은 깜빡임 & 밟기 불발 해제
    for (let i = bombs.length - 1; i >= 0; i--) {
      const b = bombs[i];
      if (!b.active) continue;

      const dx = playerX - b.x;
      const dz = playerZ - b.z;
      const horizDist = Math.sqrt(dx * dx + dz * dz);
      const relY = playerY - b.y;

      // 👾 마인크래프트 크리퍼 AI: 플레이어 14m 이내 접근 시 감지하여 멈춰 서서 부풀어오르며 스스스 폭발!
      if (b.state === 'chasing' && horizDist < 14.0) {
        b.state = 'creeper_fuse';
        b.creeperFuseTimer = 0.0;
        if (soundFx && soundFx.playDrift) soundFx.playDrift(); // 크리퍼 퓨즈 소리 효과
      }

      if (b.state === 'chasing') {
        b.fuseTimer += dt;
        b.x += (playerX - b.x) * (dt * 1.6);
        b.z -= playerSpeed * 0.96 * dt;
      } else if (b.state === 'creeper_fuse') {
        b.creeperFuseTimer += dt;
        b.fuseTimer += dt;
        // 크리퍼처럼 거대하게 부풀어오르는 애니메이션 (1.0배 -> 1.8배)
        const swellProgress = Math.min(1.0, b.creeperFuseTimer / 1.2);
        const swellScale = 1.0 + (swellProgress * swellProgress) * 0.8;
        b.group.scale.setScalar(swellScale);
      }

      b.y = getTerrainY(b.x, b.z) + 3.8 * b.group.scale.y;
      b.group.position.set(b.x, b.y, b.z);

      // 🔴🔴🔴 초강력 붉은색 점멸 비주얼 (눈 껍질 전체가 쨍하고 눈에 띄게 붉게 불타오름!)
      const isCreeperFusing = (b.state === 'creeper_fuse');
      const progress = isCreeperFusing ? Math.min(1.0, b.creeperFuseTimer / 1.2) : Math.min(1.0, b.fuseTimer / 4.0);
      const blinkFreq = isCreeperFusing ? (12.0 + progress * 32.0) : (5.0 + progress * 15.0);
      const isRed = Math.sin(time * blinkFreq) > 0;

      if (isRed || isCreeperFusing) {
        b.shellMat.color.setHex(0xFF0011);
        b.shellMat.emissive.setHex(0xFF0022);
        b.shellMat.emissiveIntensity = isCreeperFusing ? (2.0 + progress * 3.0) : 2.0;
        b.coreMat.emissiveIntensity = 6.0;
      } else {
        b.shellMat.color.setHex(0xF5F9FF);
        b.shellMat.emissive.setHex(0x000000);
        b.shellMat.emissiveIntensity = 0.0;
        b.coreMat.emissiveIntensity = 3.5;
      }

      // 👟 💥 밟기 판정! (크리퍼 상태에서도 터지기 전에 위에서 밟으면 불발 해제!)
      if (horizDist < (4.2 * b.group.scale.x) && relY >= -0.5 && relY <= 6.0) {
        b.active = false;
        scene.remove(b.group);
        bombs.splice(i, 1);

        stompCombo += 1;
        const comboPts = Math.min(10, stompCombo) * 100; // 100, 200, 300 ... 900, 1000점!

        if (soundFx && soundFx.playCoin) soundFx.playCoin();
        if (onStompBounce) onStompBounce(comboPts);

        // 👑 10개째 밟았을 때 이스터에그 콤보왕 대축제!
        if (stompCombo === 10) {
          if (ui) {
            ui.showToast('👑 콤보왕! COMBO KING! 👑', '+10,000 BONUS PTS! 🎉');
            if (ui.showBonusToast) ui.showBonusToast('👑 콤보왕 10-COMBO MASTER! +10,000 PTS 🎆', true);
          }
          triggerFireworks(ui, soundFx);
          if (onStompBounce) onStompBounce(10000);
        } else {
          if (ui) {
            ui.showBonusToast(`STOMP! +${comboPts} PTS (COMBO x${stompCombo}) 👟✨`, true);
          }
        }

        continue;
      }

      // 💣 펑! 폭발 조건 (크리퍼 1.2초 퓨즈 완료 OR 시한 4초 만료)
      const isExplodeTime = (b.state === 'creeper_fuse' && b.creeperFuseTimer >= 1.2) || (b.fuseTimer >= 4.0);

      if (isExplodeTime) {
        b.active = false;
        
        // ❄️ 3D 눈가루 파티클 대폭발 애니메이션 트리거!
        triggerSnowExplosionParticles(b.x, b.y, b.z);

        if (soundFx && soundFx.playCrash) soundFx.playCrash();

        // 💥 폭발 넉백 충격파 범위 판정
        const blastDx = playerX - b.x;
        const blastDy = (playerY + 1.2) - b.y;
        const blastDz = playerZ - b.z;
        const dist = Math.sqrt(blastDx * blastDx + blastDy * blastDy + blastDz * blastDz);

        if (dist < 24.0) {
          const normX = dist > 0.001 ? blastDx / dist : 0;
          const normZ = dist > 0.001 ? blastDz / dist : 1;
          const knockForce = (1.0 - dist / 24.0) * 38.0;

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
    for (const p of snowDustParticles) {
      if (p.mesh) scene.remove(p.mesh);
    }
    for (const sw of shockwaves) {
      if (sw.mesh) scene.remove(sw.mesh);
    }
    for (const fw of fireworks) {
      if (camera) camera.remove(fw.mesh);
    }
    bombs.length = 0;
    snowDustParticles.length = 0;
    shockwaves.length = 0;
    fireworks.length = 0;
    spawnTimer = 0;
    stompCombo = 0;
  };

  return { update, reset };
};
