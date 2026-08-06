import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

export const createDriftSystem = (scene, skierGroup) => {
  // ❄️ 1. 독립 눈보라 파티클 스프레이 메쉬 생성 (Snow Spray System)
  const sprayCount = 200;
  const sprayPos = new Float32Array(sprayCount * 3);
  const sprayVel = new Float32Array(sprayCount * 3);
  const sprayLife = new Float32Array(sprayCount);

  for (let i = 0; i < sprayCount; i++) {
    sprayPos[i*3] = 0; sprayPos[i*3+1] = 0; sprayPos[i*3+2] = 0;
    sprayVel[i*3] = 0; sprayVel[i*3+1] = 0; sprayVel[i*3+2] = 0;
    sprayLife[i] = 0;
  }

  // ❄️ 둥근 동그라미 눈송이 텍스처 생성 (네모 파티클 ➔ 예쁜 동그라미 원형 파티클)
  const createCircleSnowTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.7, 'rgba(240, 248, 255, 0.85)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(32, 32, 30, 0, Math.PI * 2); ctx.fill();
    return new THREE.CanvasTexture(canvas);
  };
  const circleTexture = createCircleSnowTexture();

  const sprayGeo = new THREE.BufferGeometry();
  sprayGeo.setAttribute('position', new THREE.BufferAttribute(sprayPos, 3));
  const sprayMat = new THREE.PointsMaterial({
    color: 0xFFFFFF, size: 0.58, map: circleTexture, transparent: true, opacity: 0.0,
    blending: THREE.AdditiveBlending, depthWrite: false, alphaTest: 0.01
  });
  const sprayPoints = new THREE.Points(sprayGeo, sprayMat);
  skierGroup.add(sprayPoints);

  let wasDrifting = false;
  let lockedDriftDir = 0; // 한번 꺾인 드리프트 방향 고정 (Lock)
  let driftYawAngle = 0;   // 실제 스키 카빙 몸체 Y축 회전 각도

  // 🏎️ 2. 드리프트 및 카트라이더 순간 부스터 업데이트
  const update = (G, keys, dt, ui) => {
    // 🚫 1) 공중에 떴을 때: 드리프트 락 해제 및 눈보라 파티클 0.2초간 민첩하게 Fade-Out!
    if (G.inAir) {
      sprayMat.opacity = Math.max(0.0, sprayMat.opacity - dt * 5.0); // 0.2초 동안 민첩하게 소멸!
      driftYawAngle += (0 - driftYawAngle) * dt * 8.0;
      wasDrifting = false;
      lockedDriftDir = 0;
      return;
    }

    const left  = keys.has('ArrowLeft')  || keys.has('KeyA');
    const right = keys.has('ArrowRight') || keys.has('KeyD');
    const shift = keys.has('ShiftLeft') || keys.has('ShiftRight');
    const inputTurn = (right ? 1 : 0) - (left ? 1 : 0);

    // Shift를 처음 누르는 순간의 방향을 락킹 (Shift 누른 상태로 방향 전환 불가능)
    if (shift && !wasDrifting && inputTurn !== 0) {
      lockedDriftDir = inputTurn;
    }

    const isDrifting = shift && lockedDriftDir !== 0;

    // ⚡ 2) Shift를 떼는 순간 발동하는 카트라이더 순간 부스터! (INSTANT BOOST!)
    if (wasDrifting && !isDrifting) {
      G.boosterTimer = 1.2; // 순간 부스터 속도감 이펙트 & Max Speed +50km/h 한계 돌파!
      G.spd += 6.0;         // 순발 팝 가속!
      if (ui) ui.showBonusToast('INSTANT BOOST! ⚡', true);
      lockedDriftDir = 0;
    }

    // 🏎️ 3) Shift 홀드 시: 감속 드리프트 & 몸체 80도 회전 & 고정된 방향으로 슬라이딩
    if (isDrifting) {
      // 🛑 Shift 누르고 있는 동안 속도가 스으윽 감속됨!
      G.spd = Math.max(10.0, G.spd - dt * 26.0);

      // 고정된 드리프트 방향(lockedDriftDir)으로만 슬라이딩
      G.vx += lockedDriftDir * 210.0 * dt;
      G.vx *= 0.948;

      // 🔄 마리오 카트 스키 카빙: 몸 전체와 스키 판을 Y축으로 80도(1.40 rad) 정방향 획! 돌리기
      driftYawAngle += (-lockedDriftDir * 1.40 - driftYawAngle) * dt * 9.0;
      G.lean += (lockedDriftDir * 0.45 - G.lean) * dt * 8.0;

      // 하얀 눈보라 파티클 촤아악 스프레이 분사
      sprayMat.opacity = Math.min(0.98, sprayMat.opacity + dt * 9.0);
      for (let i = 0; i < sprayCount; i++) {
        if (sprayLife[i] <= 0) {
          sprayLife[i] = 0.22 + Math.random() * 0.38;
          sprayPos[i*3]   = (Math.random() - 0.5) * 0.45;
          sprayPos[i*3+1] = 0.1 + Math.random() * 0.35;
          sprayPos[i*3+2] = 0.2 + Math.random() * 0.45;

          sprayVel[i*3]   = -lockedDriftDir * (3.8 + Math.random() * 4.8);
          sprayVel[i*3+1] = 1.6 + Math.random() * 3.0;
          sprayVel[i*3+2] = 2.2 + Math.random() * 2.8;
        }
      }
    } else {
      // Shift 뗀 후 관성 정돈 및 복귀
      driftYawAngle += (0 - driftYawAngle) * dt * 6.0;
      if (Math.abs(G.vx) > 0.5) {
        G.vx *= 0.94;
      }
      sprayMat.opacity = Math.max(0.0, sprayMat.opacity - dt * 5.0); // 0.2초간 깔끔하게 Fade-Out!
      lockedDriftDir = 0;
    }

    // 눈보라 파티클 위치 갱신
    const pos = sprayGeo.attributes.position.array;
    for (let i = 0; i < sprayCount; i++) {
      if (sprayLife[i] > 0) {
        sprayLife[i] -= dt;
        pos[i*3]   += sprayVel[i*3]   * dt;
        pos[i*3+1] += sprayVel[i*3+1] * dt;
        pos[i*3+2] += sprayVel[i*3+2] * dt;
      } else if (!isDrifting && sprayMat.opacity <= 0.05) {
        pos[i*3] = 0; pos[i*3+1] = -10; pos[i*3+2] = 0;
      }
    }
    sprayGeo.attributes.position.needsUpdate = true;

    wasDrifting = isDrifting;
    return { isDrifting, driftYawAngle };
  };

  const reset = () => {
    wasDrifting = false;
    lockedDriftDir = 0;
    sprayMat.opacity = 0;
  };

  return { update, reset };
};
