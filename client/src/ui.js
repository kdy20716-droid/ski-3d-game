import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { soundFx } from './soundSystem.js?v=2.3.2';
import { CHARACTER_LIST, makeCharacterModel, saveSelectedCharacter, loadSelectedCharacter } from './characters.js';

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

  // ═══════════════════════════════════════════════════════════════
  //  캐릭터 프리뷰 시스템 (Three.js 인 캔버스)
  // ═══════════════════════════════════════════════════════════════
  const makePreviewScene = () => {
    const scene    = new THREE.Scene();
    const ambLight = new THREE.AmbientLight(0xffffff, 0.8);
    const dirLight = new THREE.DirectionalLight(0xffeedd, 2.5);
    dirLight.position.set(3, 6, 4);
    const rimLight = new THREE.DirectionalLight(0x88ccff, 1.0);
    rimLight.position.set(-3, 2, -3);
    scene.add(ambLight, dirLight, rimLight);
    return scene;
  };

  // ── 메인 화면 캐릭터 프리뷰 ──────────────────────────────────────
  let mainPreviewRenderer = null;
  let mainPreviewScene    = null;
  let mainPreviewCamera   = null;
  let mainPreviewModel    = null;
  let mainPreviewRAF      = null;

  const initMainCharPreview = (charId) => {
    const canvas = document.getElementById('charPreviewCanvas');
    if (!canvas) return;

    // 이전 렌더러 정리
    if (mainPreviewRenderer) { mainPreviewRenderer.dispose(); mainPreviewRenderer = null; }
    if (mainPreviewRAF) { cancelAnimationFrame(mainPreviewRAF); mainPreviewRAF = null; }

    const W = 320, H = 400;
    canvas.width  = W;
    canvas.height = H;

    mainPreviewRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    mainPreviewRenderer.setSize(W, H);
    mainPreviewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mainPreviewRenderer.setClearColor(0x000000, 0);

    mainPreviewScene  = makePreviewScene();
    mainPreviewCamera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);
    mainPreviewCamera.position.set(0, 4.5, 9);
    mainPreviewCamera.lookAt(0, 2.2, 0);

    const { bodyGroup } = makeCharacterModel(charId);
    bodyGroup.scale.setScalar(1.6);
    bodyGroup.position.y = -0.5;
    mainPreviewModel = bodyGroup;
    mainPreviewScene.add(bodyGroup);

    // 캐릭터 이름 업데이트
    const nameEl = document.getElementById('charPreviewName');
    const info   = CHARACTER_LIST.find(c => c.id === charId);
    if (nameEl && info) nameEl.textContent = `${info.emoji} ${info.name}`;

    let rot = 0;
    const loop = () => {
      mainPreviewRAF = requestAnimationFrame(loop);
      rot += 0.004; // 매우 천천히 360도 자동 회전
      bodyGroup.rotation.y = rot;
      mainPreviewRenderer.render(mainPreviewScene, mainPreviewCamera);
    };
    loop();
  };

  // ── 캐릭터 선택 화면 ────────────────────────────────────────────
  const cardRenderers = []; // 개별 카드 렌더러 목록 (dispose용)

  const disposeCardRenderers = () => {
    cardRenderers.forEach(r => r.dispose());
    cardRenderers.length = 0;
  };

  const buildCharSelectScreen = () => {
    const grid = document.getElementById('charSelGrid');
    if (!grid) return;
    grid.innerHTML = '';
    disposeCardRenderers();

    const currentId = loadSelectedCharacter();

    CHARACTER_LIST.forEach(charInfo => {
      const card = document.createElement('div');
      card.className = 'char-card' + (charInfo.id === currentId ? ' selected' : '');
      card.dataset.id = charInfo.id;

      // 이모지
      const emojiEl = document.createElement('div');
      emojiEl.className = 'char-card-emoji';
      emojiEl.textContent = charInfo.emoji;

      // 3D 캔버스
      const cvs = document.createElement('canvas');
      cvs.width  = 216;
      cvs.height = 272;

      const renderer = new THREE.WebGLRenderer({ canvas: cvs, antialias: true, alpha: true });
      renderer.setSize(216, 272);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      cardRenderers.push(renderer);

      const scene  = makePreviewScene();
      const camera = new THREE.PerspectiveCamera(44, 216 / 272, 0.1, 100);
      camera.position.set(0, 4.2, 8.5);
      camera.lookAt(0, 2.0, 0);

      const { bodyGroup } = makeCharacterModel(charInfo.id);
      bodyGroup.scale.setScalar(1.5);
      bodyGroup.position.y = -0.5;
      scene.add(bodyGroup);

      // 애니메이션 상태
      let targetRot  = 0;
      let currentRot = 0;
      let isHovered  = false;
      let rafId      = null;

      const tick = () => {
        rafId = requestAnimationFrame(tick);
        if (isHovered) {
          targetRot += 0.032; // hover 시 빙글빙글
        } else {
          // 정면(0rad)으로 스무스하게 복귀
          targetRot = targetRot % (Math.PI * 2);
          if (targetRot > Math.PI)  targetRot -= Math.PI * 2;
          targetRot += (0 - targetRot) * 0.07;
        }
        currentRot += (targetRot - currentRot) * 0.18;
        bodyGroup.rotation.y = currentRot;
        renderer.render(scene, camera);
      };
      tick();

      card.addEventListener('mouseenter', () => { isHovered = true; });
      card.addEventListener('mouseleave', () => { isHovered = false; });

      // 이름 / 설명 / 선택 배지
      const nameEl  = document.createElement('div'); nameEl.className  = 'char-card-name';  nameEl.textContent = charInfo.name;
      const descEl  = document.createElement('div'); descEl.className  = 'char-card-desc';  descEl.textContent = charInfo.desc;
      const badge   = document.createElement('div'); badge.className   = 'char-card-badge'; badge.textContent  = 'SELECTED';

      card.append(emojiEl, cvs, nameEl, descEl, badge);
      grid.appendChild(card);

      // 클릭: 캐릭터 선택 + 메인화면으로 복귀
      card.addEventListener('click', () => {
        soundFx.playClick();
        saveSelectedCharacter(charInfo.id);
        // 선택 표시 갱신
        grid.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        // 메인 프리뷰 갱신
        initMainCharPreview(charInfo.id);
        // 0.35초 후 선택 화면 닫고 메인으로
        setTimeout(() => {
          document.getElementById('scCharSelect').classList.add('off');
          document.getElementById('scStart').classList.remove('off');
        }, 350);
      });
    });
  };

  // ── EDIT 버튼 / 캐릭터 프리뷰 클릭 → 선택 화면 열기 ──────────────
  const openCharSelect = () => {
    soundFx.playClick();
    buildCharSelectScreen();
    document.getElementById('scStart').classList.add('off');
    document.getElementById('scCharSelect').classList.remove('off');
  };

  const btnEditChar   = document.getElementById('btnEditChar');
  const charPrevWrap  = document.getElementById('charPreviewWrap');
  const btnCharBack   = document.getElementById('btnCharBack');

  if (btnEditChar)  btnEditChar.addEventListener('click',  (e) => { e.stopPropagation(); openCharSelect(); });
  if (charPrevWrap) charPrevWrap.addEventListener('click', () => openCharSelect());
  if (btnCharBack)  btnCharBack.addEventListener('click', () => {
    soundFx.playClick();
    document.getElementById('scCharSelect').classList.add('off');
    document.getElementById('scStart').classList.remove('off');
  });

  // 메인화면 진입 시 현재 캐릭터 프리뷰 초기화
  initMainCharPreview(loadSelectedCharacter());

  return {
    showScreen, updateHUD, showToast, showBonusToast, setMangaSpeedLines, setBoosterUI,
    showSurpriseBadge, showVictoryOverlay, showSkipHint, triggerDissolveRespawn, setDangerVignette,
    updateDriftChargeUI, updateStageTitle,
    initMainCharPreview, loadSelectedCharacter,
  };
};
