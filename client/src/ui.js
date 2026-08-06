import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { soundFx } from './soundSystem.js?v=2.3.2';

export const setupUI = (handlers) => {
  const $score = document.getElementById('hScore');
  const $speed = document.getElementById('hSpeed');
  const $stage = document.getElementById('hStage');
  const $fillSpd = document.getElementById('spdFill');
  const $fillJump = document.getElementById('jmpFill');
  const $fillDrift = document.getElementById('driftFill');
  const scrStart = document.getElementById('scStart');
  const scrPause = document.getElementById('scPause');
  const scrOver  = document.getElementById('scOver');
  const toast    = document.getElementById('toast');
  const toastSub = document.getElementById('toast-sub');
  const toastMain = document.getElementById('toast-main');
  const bonusToastEl = document.getElementById('bonusToast');

  let bonusTimeout = null;

  const btnStartEl  = document.getElementById('btnStart');
  const btnResumeEl = document.getElementById('btnResume');
  const btnRestartEl = document.getElementById('btnRestart');
  const langSelectEl = document.getElementById('langSelect');
  const lblLogoSubEl = document.getElementById('lblLogoSub');

  if (btnStartEl)  btnStartEl.onclick  = () => { soundFx.playClick(); handlers.onStart(); };
  if (btnResumeEl) btnResumeEl.onclick = () => { soundFx.playClick(); handlers.onTogglePause(); };
  if (btnRestartEl) btnRestartEl.onclick = () => { soundFx.playClick(); handlers.onStart(); };

  const updateLanguageUI = () => {
    if (typeof window.i18n === 'undefined') return;
    const { t } = window.i18n;
    if (lblLogoSubEl) lblLogoSubEl.textContent = t('subTitle');
    if (btnStartEl) btnStartEl.textContent = t('start');
    if (btnRestartEl) btnRestartEl.textContent = t('retry');
  };

  if (langSelectEl) {
    langSelectEl.onchange = (e) => {
      if (window.i18n) {
        window.i18n.setLang(e.target.value);
        updateLanguageUI();
      }
    };
  }

  const showToast = (sub, main) => {
    toastSub.textContent = sub; toastMain.textContent = main;
    toast.classList.add('on');
    setTimeout(() => toast.classList.remove('on'), 2600);
  };

  const showBonusToast = (text, isGold = false) => {
    if (!bonusToastEl) return;
    bonusToastEl.textContent = text;
    bonusToastEl.className = 'bonus-toast show' + (isGold ? ' gold' : '');
    
    if (bonusTimeout) clearTimeout(bonusTimeout);
    bonusTimeout = setTimeout(() => {
      bonusToastEl.classList.remove('show');
    }, 1000);
  };

  const updateHUD = (score, spd, maxSpd, jumpCharge) => {
    $score.textContent = Math.floor(score);
    $speed.textContent = Math.floor(spd * 3.6);
    $fillSpd.style.width = `${(spd / maxSpd) * 100}%`;
    $fillJump.style.width = `${jumpCharge * 100}%`;
  };

  const setBoosterUI = (active) => {
    if (active) $fillSpd.classList.add('booster');
    else $fillSpd.classList.remove('booster');
  };

  const updateStageTitle = (stageNum, stageName) => {
    $stage.textContent = `STAGE ${stageNum} · ${stageName}`;
  };

  const showScreen = (type, statsText = '') => {
    if (type === 'start') {
      scrStart.classList.remove('off'); scrPause.classList.add('off'); scrOver.classList.add('off');
      setMangaSpeedLines(false);
    } else if (type === 'game') {
      scrStart.classList.add('off'); scrPause.classList.add('off'); scrOver.classList.add('off');
    } else if (type === 'pause') {
      scrPause.classList.remove('off');
      setMangaSpeedLines(false); // 일시 정지 시 스피드 라인 100% 비활성화!
    } else if (type === 'unpause') {
      scrPause.classList.add('off');
    } else if (type === 'over') {
      document.getElementById('overStats').innerHTML = statsText;
      scrOver.classList.remove('off');
      setMangaSpeedLines(false); // 게임 오버 시 스피드 라인 100% 비활성화!
    }
  };

  // ⚡ 사용자 업로드 이미지 100% 동일 만화/애니 방사형 흑백 집중선 Canvas 렌더러
  const mangaCanvas = document.getElementById('mangaSpeedLinesCanvas');
  let mangaCtx = null;
  
  const initMangaCanvas = () => {
    if (!mangaCanvas) return;
    mangaCanvas.width = window.innerWidth;
    mangaCanvas.height = window.innerHeight;
    mangaCtx = mangaCanvas.getContext('2d');
    drawMangaLines();
  };

  const drawMangaLines = () => {
    if (!mangaCtx || !mangaCanvas) return;
    const w = mangaCanvas.width, h = mangaCanvas.height;
    const cx = w / 2, cy = h / 2;
    const maxR = Math.sqrt(cx * cx + cy * cy);
    const baseInnerR = Math.min(w, h) * 0.44; // 화면 최외곽에 앙증맞게 밀어낸 초미니 여백 (0.44)

    mangaCtx.clearRect(0, 0, w, h);
    
    // ⚡ 앙증맞게 짧고 은은하게 투명한 흰색 스피드 라인 60개
    const lineCount = 60;

    for (let i = 0; i < lineCount; i++) {
      const angle = (i / lineCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.05;
      
      // 외곽 두께 슬림하게 조율
      const outerThickness = (0.006 + Math.random() * 0.008);
      
      // 길이를 대폭 짧고 콤팩트하게 부여
      const rStart = baseInnerR + Math.random() * (Math.min(w, h) * 0.07);
      const rEnd = maxR;

      // 안쪽 향하는 뾰족 얇은 끝점
      const xTip = cx + Math.cos(angle) * rStart;
      const yTip = cy + Math.sin(angle) * rStart;

      // 모서리 외곽으로 향하는 두꺼운 베이스 2개 점
      const xOuter1 = cx + Math.cos(angle - outerThickness) * rEnd;
      const yOuter1 = cy + Math.sin(angle - outerThickness) * rEnd;
      const xOuter2 = cx + Math.cos(angle + outerThickness) * rEnd;
      const yOuter2 = cy + Math.sin(angle + outerThickness) * rEnd;

      // 훨씬 더 은은하고 투명한 맑은 흰색 (0.18 ~ 0.46 투명도)
      const alpha = 0.18 + Math.random() * 0.28;
      mangaCtx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;

      mangaCtx.beginPath();
      mangaCtx.moveTo(xTip, yTip);
      mangaCtx.lineTo(xOuter1, yOuter1);
      mangaCtx.lineTo(xOuter2, yOuter2);
      mangaCtx.closePath();
      mangaCtx.fill();
    }
  };

  window.addEventListener('resize', initMangaCanvas);
  setTimeout(initMangaCanvas, 100);

  const setMangaSpeedLines = (active) => {
    if (!mangaCanvas) return;
    if (active) {
      drawMangaLines();
      mangaCanvas.classList.add('active');
    } else {
      mangaCanvas.classList.remove('active');
    }
  };

  const surpriseBadgeEl = document.getElementById('surpriseBadge');
  const victoryOverlayEl = document.getElementById('victoryOverlay');

  const showSurpriseBadge = (state, skier, camera) => {
    if (!surpriseBadgeEl) return;
    if (state === 'show' && skier && camera) {
      surpriseBadgeEl.classList.remove('off', 'fadeout');
      // 3D 스키어 머리 위 (Y + 2.6m) 월드 좌표 ➔ 2D 화면 픽셀 좌표 100% 밀착 투영!
      const headPos = skier.position.clone().add(new THREE.Vector3(0, 2.6, 0));
      headPos.project(camera);
      const x = (headPos.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-headPos.y * 0.5 + 0.5) * window.innerHeight;
      surpriseBadgeEl.style.left = `${x}px`;
      surpriseBadgeEl.style.top = `${y}px`;
    } else if (state === 'fadeout') {
      surpriseBadgeEl.classList.add('fadeout');
    } else {
      surpriseBadgeEl.classList.add('off');
      surpriseBadgeEl.classList.remove('fadeout');
    }
  };

  const showVictoryOverlay = (show) => {
    if (!victoryOverlayEl) return;
    if (show) victoryOverlayEl.classList.remove('off');
    else victoryOverlayEl.classList.add('off');
  };

  const skipHintEl = document.getElementById('skipHint');
  const dissolveEl = document.getElementById('respawnDissolve');
  const dangerVignetteEl = document.getElementById('dangerVignette');

  const setDangerVignette = (intensity) => {
    if (!dangerVignetteEl) return;
    // intensity: 0.0 ~ 1.0
    dangerVignetteEl.style.opacity = Math.max(0, Math.min(1, intensity)).toFixed(2);
  };

  const showSkipHint = (show) => {
    if (!skipHintEl) return;
    if (show) skipHintEl.classList.remove('off');
    else skipHintEl.classList.add('off');
  };

  const triggerDissolveRespawn = (onPeakCallback) => {
    if (!dissolveEl) {
      if (onPeakCallback) onPeakCallback();
      return;
    }
    dissolveEl.classList.remove('off');
    dissolveEl.style.opacity = '1';
    setTimeout(() => {
      if (onPeakCallback) onPeakCallback();
      setTimeout(() => {
        dissolveEl.style.opacity = '0';
        setTimeout(() => dissolveEl.classList.add('off'), 250);
      }, 120);
    }, 180);
  };

  const updateDriftChargeUI = (chargeRatio) => {
    if (!$fillDrift) return;
    const pct = Math.max(0, Math.min(100, Math.floor(chargeRatio * 100)));
    $fillDrift.style.width = `${pct}%`;
  };

  return {
    showScreen, updateHUD, showToast, showBonusToast, setMangaSpeedLines, setBoosterUI,
    showSurpriseBadge, showVictoryOverlay, showSkipHint, triggerDissolveRespawn, setDangerVignette,
    updateDriftChargeUI, updateStageTitle
  };
};
