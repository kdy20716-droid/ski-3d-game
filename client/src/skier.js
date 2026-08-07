import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { makeCharacterModel } from './characters.js?v=7.0.0';

export const makeSkier = (characterId = 'beta') => {
  const rootGroup = new THREE.Group();

  // 인게임 방향 전환: 캐릭터 외형을 180도 회전시켜 정면을 바라보게 함
  // (프리뷰는 makeCharacterModel을 직접 사용하므로 영향 없음)
  const { bodyGroup: charBody } = makeCharacterModel(characterId);
  charBody.rotation.y = Math.PI; // 외형만 180도 — 전진 방향을 바라봄

  const bodyGroup = new THREE.Group(); // 게임 로직용 래퍼 (드리프트 Y축 회전 담당)
  bodyGroup.rotation.reorder('YXZ'); // 🏎️ 마리오 카트 스타일 Y축 회전 전용!
  bodyGroup.add(charBody);



  // 부드러운 타원형 그림자 (캔버스 그라디언트 스프라이트)
  const shadowCvs = document.createElement('canvas');
  shadowCvs.width = 128; shadowCvs.height = 64;
  const sCtx = shadowCvs.getContext('2d');
  const sGrad = sCtx.createRadialGradient(64, 32, 2, 64, 32, 56);
  sGrad.addColorStop(0,   'rgba(0,0,10,0.55)');
  sGrad.addColorStop(0.55,'rgba(0,0,10,0.22)');
  sGrad.addColorStop(1,   'rgba(0,0,10,0)');
  sCtx.fillStyle = sGrad;
  sCtx.fillRect(0, 0, 128, 64);

  const shadowTex = new THREE.CanvasTexture(shadowCvs);
  const shadowMat = new THREE.SpriteMaterial({
    map: shadowTex, transparent: true, opacity: 0.7,
    depthWrite: false, blending: THREE.NormalBlending,
  });
  const shadowBlob = new THREE.Sprite(shadowMat);
  shadowBlob.scale.set(2.4, 1.1, 1);   // 가로로 넓은 타원
  shadowBlob.position.set(0, 0.04, 0); // 지면 바로 위

  rootGroup.add(bodyGroup, shadowBlob);


  // 🎯 3D 캔버스 빌보드 ! 느낌표 뱃지 (캐릭터 머리 위 Y = 2.8m 에 100% 찰떡 결합!)
  const createSurpriseBadgeSprite = () => {
    const cvs = document.createElement('canvas');
    cvs.width = 128; cvs.height = 128;
    const ctx = cvs.getContext('2d');
    
    // 🔴 강렬한 비비드 딥 레드 뱃지 (#FF0033 + 네온 핑크 외곽선)
    const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 56);
    grad.addColorStop(0, '#FF1A4B');
    grad.addColorStop(1, '#D6002A');

    ctx.beginPath();
    ctx.arc(64, 64, 56, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    // 흰색 ! 느낌표
    ctx.font = '900 72px Outfit, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', 64, 66);

    const tex = new THREE.CanvasTexture(cvs);
    const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(1.6, 1.6, 1);
    sprite.position.set(0, 2.9, 0); // 머리 바로 위 2.9m 위치!
    sprite.visible = false;
    return { sprite, spriteMat };
  };

  const badgeObj = createSurpriseBadgeSprite();
  rootGroup.add(badgeObj.sprite);

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

  // 5초 무적 반투명 깜빡임 연출 헬퍼
  const updateInvincibleFlash = (invincibleTimer) => {
    if (invincibleTimer > 0) {
      const isVisible = Math.floor(invincibleTimer * 14) % 2 === 0;
      bodyGroup.visible = isVisible;
    } else {
      bodyGroup.visible = true;
    }
  };

  const updateSurpriseBadge3D = (state) => {
    if (state === 'show') {
      badgeObj.sprite.visible = true;
      badgeObj.spriteMat.opacity = 1.0;
      badgeObj.sprite.position.set(0, 2.9, 0);
    } else if (state === 'fadeout') {
      badgeObj.sprite.visible = true;
      badgeObj.spriteMat.opacity = Math.max(0, badgeObj.spriteMat.opacity - 0.08);
      badgeObj.sprite.position.y += 0.02; // 위로 살짝 스르륵 상승하며 페이드 아웃!
    } else {
      badgeObj.sprite.visible = false;
      badgeObj.spriteMat.opacity = 0;
    }
  };

  return {
    group: rootGroup, bodyGroup, shadowMat,
    sprayPoints, sprayPos, sprayVel, sprayLife, sprayMat,
    updateInvincibleFlash, updateSurpriseBadge3D
  };
};
