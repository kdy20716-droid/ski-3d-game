import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { soundFx } from './soundSystem.js?v=2.3.2';
import { CHARACTER_LIST, makeCharacterModel, saveSelectedCharacter, loadSelectedCharacter } from './characters.js?v=7.0.0';

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
    const { t, getCharTranslation } = window.i18n;

    if (lblLogoSubEl) lblLogoSubEl.textContent = t('subTitle');
    if (btnStartEl) btnStartEl.textContent = t('start');
    if (btnRestartEl) btnRestartEl.textContent = t('retry');

    const btnEditCharEl = document.getElementById('btnEditChar');
    if (btnEditCharEl) btnEditCharEl.textContent = t('editChar');

    // 캐릭터 선택 헤더 & 뒤로가기 버튼
    const titleEl = document.querySelector('#scCharSelect .charsel-title');
    if (titleEl) titleEl.textContent = t('charSelectTitle');

    const btnCharBackEl = document.getElementById('btnCharBack');
    if (btnCharBackEl) btnCharBackEl.textContent = t('back');

    // 속도 레이블 (HUD)
    const spdLabelEl = document.querySelector('#hSpeedBox .hud-label');
    if (spdLabelEl) spdLabelEl.textContent = t('speedLabel');

    // 일시정지 / 게임오버 타이틀
    const pauseTitleEl = document.querySelector('#scPause .over-title');
    if (pauseTitleEl) pauseTitleEl.textContent = t('paused');
    const pauseHintEl = document.querySelector('#scPause .hint-text');
    if (pauseHintEl) pauseHintEl.textContent = t('pauseHint');

    const gameOverTitleEl = document.querySelector('#scGameOver .over-title');
    if (gameOverTitleEl) gameOverTitleEl.textContent = t('gameOver');

    // 메인화면 3D 프리뷰 이름 갱신
    const mainCharId = loadSelectedCharacter();
    const mainNameEl = document.getElementById('charPreviewName');
    if (mainNameEl) {
      const trans = getCharTranslation(mainCharId);
      mainNameEl.textContent = trans.name;
    }

    // 캐릭터 선택창 카드가 생성되어 있다면 카드 텍스트 갱신
    const grid = document.getElementById('charSelGrid');
    if (grid && grid.children.length > 0) {
      grid.querySelectorAll('.char-card').forEach(card => {
        const charId = card.dataset.id;
        if (charId) {
          const trans = getCharTranslation(charId);
          const nameNode = card.querySelector('.char-card-name');
          const descNode = card.querySelector('.char-card-desc');
          const badgeNode = card.querySelector('.char-card-badge');
          if (nameNode) nameNode.textContent = trans.name;
          if (descNode) descNode.textContent = trans.desc;
          if (badgeNode) badgeNode.textContent = t('selected');
        }
      });
    }
  };

  if (langSelectEl) {
    langSelectEl.onchange = (e) => {
      if (window.i18n) {
        window.i18n.setLang(e.target.value);
        updateLanguageUI();
      }
    };
  }

  // 초기 언어 UI 연동
  updateLanguageUI();

  const showToast = (sub, main) => {
    toastSub.textContent = sub; toastMain.textContent = main;
    toast.classList.add('on');
    setTimeout(() => toast.classList.remove('on'), 2600);
  };

  const showBonusToast = (text, isGold = false) => {
    if (!bonusToastEl) return;
    bonusToastEl.textContent = text;
    if (isGold) bonusToastEl.classList.add('gold');
    else bonusToastEl.classList.remove('gold');
    
    if (!bonusToastEl.classList.contains('show')) {
      bonusToastEl.classList.add('show');
    }
    
    if (bonusTimeout) clearTimeout(bonusTimeout);
    bonusTimeout = setTimeout(() => {
      bonusToastEl.classList.remove('show');
    }, 900);
  };

  const updateHUD = (score, spd, maxSpd, jumpCharge) => {
    $score.textContent = Math.floor(score);
    $speed.textContent = Math.floor(spd * 3.6);
    if ($fillSpd) $fillSpd.style.width = `${(spd / maxSpd) * 100}%`;
    $fillJump.style.width = `${jumpCharge * 100}%`;
  };

  const updateScore = (score) => {
    if ($score) $score.textContent = Math.floor(score);
  };

  const setBoosterUI = (active) => {
    if (active) $fillSpd.classList.add('booster');
    else $fillSpd.classList.remove('booster');
  };

  let stageTitleTimer = null;
  const updateStageTitle = (stageNum, stageName, textColor = '#00F0FF') => {
    if (!$stage) return;
    $stage.textContent = `STAGE ${stageNum} · ${stageName}`;
    $stage.style.color = textColor; // 🎨 스테이지 테마별 대표 네온 컬러로 실시간 글씨 색상 적용!
    $stage.style.textShadow = `0 0 18px ${textColor}, 0 0 35px rgba(0,0,0,0.9)`;
    $stage.classList.remove('fade-out');

    if (stageTitleTimer) clearTimeout(stageTitleTimer);

    // 🎬 스테이지 첫 시작 시 3초간 선명하게 표출된 후 스르륵 페이드 아웃!
    stageTitleTimer = setTimeout(() => {
      $stage.classList.add('fade-out');
    }, 3000);
  };

  // 🥇 상단 HUD 메달 수집 3개 불투명 원 인디케이터 렌더러 (0~3개)
  const updateMedalHUD = (collectedCount = 0) => {
    for (let i = 0; i < 3; i++) {
      const slot = document.getElementById(`mSlot${i}`);
      if (slot) {
        if (i < collectedCount) slot.classList.add('filled');
        else slot.classList.remove('filled');
      }
    }
  };

  // 🏁 레이스 진행 바 초기화 (스테이지 깃발 동적 생성)
  const initRaceBar = (stages) => {
    const flagsEl = document.getElementById('raceFlags');
    if (!flagsEl || !stages) return;
    flagsEl.innerHTML = '';
    // 스테이지 1~9 사이에 깃발 배치 (스테이지 전환 게이트 위치)
    // 총 10스테이지, 깃발은 각 스테이지 경계 1~9 (전체 진행도 0~1 기준)
    const total = stages.length; // 10
    for (let i = 1; i < total; i++) {
      const pct = (i / total) * 100; // 10%, 20%, ..., 90%
      const flagEl = document.createElement('div');
      flagEl.className = 'race-flag';
      flagEl.style.left = `${pct}%`;
      // 깃발 구조: 폴 + 배너 (위에서 아래로 — 뒤집힌 깃발)
      flagEl.innerHTML = `
        <div class="race-flag-banner" style="background:${stages[i]?.textColor || '#FFE040'}88; border-color:${stages[i]?.textColor || '#FFE040'};"></div>
        <div class="race-flag-pole"></div>
        <div class="race-flag-label">S${i + 1}</div>
      `;
      flagsEl.appendChild(flagEl);
    }
  };

  // 🏁 레이스 진행 바 업데이트 — 매 프레임 호출
  // stageNum: 현재 스테이지 (1~10), stagePct: 현 스테이지 내 진행도 (0.0~1.0)
  const updateRaceBar = (stageNum, stagePct) => {
    const playerEl = document.getElementById('racePlayer');
    if (!playerEl) return;
    // 전체 진행도 (0.0~1.0) 계산
    // stageNum은 1~10, 각 스테이지 길이는 동일하다고 가정
    const totalStages = 10;
    const globalPct = ((stageNum - 1) + Math.min(1, Math.max(0, stagePct))) / totalStages;
    // 트랙 좌측 패딩 6px, 우측 20px (체커보드 공간)
    const pctInTrack = 0.02 + globalPct * 0.92; // 2%~94% 범위로 클램프
    playerEl.style.left = `${pctInTrack * 100}%`;
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


  const showSkipHint = (show) => {
    if (!skipHintEl) return;
    if (show) skipHintEl.classList.remove('off');
    else skipHintEl.classList.add('off');
  };

  // 🚨 충돌 시 화면 중앙 검은색 100% 제거! 오직 모서리 붉은 위험 비넷만 순간 펄스 플래시!
  const triggerDissolveRespawn = (onPeakCallback) => {
    if (onPeakCallback) onPeakCallback();

    if (dangerVignette) {
      dangerVignette.style.opacity = '0.65';
      setTimeout(() => {
        dangerVignette.style.opacity = '0';
      }, 220);
    }
  };

  const updateDriftChargeUI = (chargeRatio) => {
    if (!$fillDrift) return;
    const pct = Math.max(0, Math.min(100, Math.floor(chargeRatio * 100)));
    $fillDrift.style.width = `${pct}%`;
  };

  const cornerWarnLeft  = document.getElementById('cornerWarnLeft');
  const cornerWarnRight = document.getElementById('cornerWarnRight');
  const dangerVignette  = document.getElementById('dangerVignette');

  // ⚠️ 눈덩이 출현 시 화면 좌/우 모서리에 붉은 느낌표 고정 아이콘 점등
  const updateCornerWarningUI = (showLeft, showRight) => {
    if (cornerWarnLeft) {
      if (showLeft) cornerWarnLeft.classList.remove('off');
      else cornerWarnLeft.classList.add('off');
    }
    if (cornerWarnRight) {
      if (showRight) cornerWarnRight.classList.remove('off');
      else cornerWarnRight.classList.add('off');
    }
  };

  // 🚨 산사태 및 눈덩이 근접 시 화면 모서리 붉은 위험 비넷 opacity 서서히 조율 (Max 0.65)
  const setDangerVignette = (intensity) => {
    if (!dangerVignette) return;
    const clamped = Math.max(0, Math.min(0.65, intensity));
    dangerVignette.style.opacity = clamped.toFixed(2);
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

    const W = 320, H = 400;
    canvas.width  = W;
    canvas.height = H;

    if (!mainPreviewRenderer) {
      try {
        mainPreviewRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        mainPreviewRenderer.setSize(W, H);
        mainPreviewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        mainPreviewRenderer.setClearColor(0x000000, 0);

        mainPreviewScene  = makePreviewScene();
        mainPreviewCamera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);
        mainPreviewCamera.position.set(0, 4.5, 9);
        mainPreviewCamera.lookAt(0, 2.2, 0);

        let rot = 0;
        const loop = () => {
          mainPreviewRAF = requestAnimationFrame(loop);
          if (mainPreviewModel) {
            rot += 0.004; // 매우 천천히 360도 자동 회전
            mainPreviewModel.rotation.y = rot;
          }
          if (mainPreviewRenderer && mainPreviewScene && mainPreviewCamera) {
            mainPreviewRenderer.render(mainPreviewScene, mainPreviewCamera);
          }
        };
        loop();
      } catch (err) {
        console.warn('Main preview WebGL init error:', err);
      }
    }

    // 모델만 교체 (WebGLRenderer 재생성 금지 -> precision error 방지)
    if (mainPreviewModel && mainPreviewScene) {
      mainPreviewScene.remove(mainPreviewModel);
      mainPreviewModel = null;
    }

    if (mainPreviewScene) {
      const { bodyGroup } = makeCharacterModel(charId);
      bodyGroup.scale.setScalar(1.6);
      bodyGroup.position.y = -0.5;
      mainPreviewModel = bodyGroup;
      mainPreviewScene.add(bodyGroup);
    }

    // 캐릭터 이름 업데이트 (다국어 지원)
    const nameEl = document.getElementById('charPreviewName');
    if (nameEl && window.i18n) {
      const trans = window.i18n.getCharTranslation(charId);
      nameEl.textContent = trans.name;
    }
  };

  // ── 캐릭터 선택 화면 ────────────────────────────────────────────
  let cardOffscreenCvs = null;
  let cardSharedRenderer = null;
  let cardSelectRAF = null;
  const cardObjects = [];

  const disposeCardRenderers = () => {
    if (cardSelectRAF) {
      cancelAnimationFrame(cardSelectRAF);
      cardSelectRAF = null;
    }
    cardObjects.length = 0;
  };

  const closeCharSelect = () => {
    disposeCardRenderers();
    document.getElementById('scCharSelect').classList.add('off');
    document.getElementById('scStart').classList.remove('off');
  };

  const getCardSharedRenderer = () => {
    if (!cardOffscreenCvs) {
      cardOffscreenCvs = document.createElement('canvas');
      cardOffscreenCvs.width = 216;
      cardOffscreenCvs.height = 272;
    }
    if (!cardSharedRenderer) {
      try {
        cardSharedRenderer = new THREE.WebGLRenderer({ canvas: cardOffscreenCvs, antialias: true, alpha: true });
        cardSharedRenderer.setSize(216, 272);
        cardSharedRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        cardSharedRenderer.setClearColor(0x000000, 0);
      } catch (err) {
        console.warn('Card shared WebGL init error:', err);
      }
    }
    return cardSharedRenderer;
  };

  const buildCharSelectScreen = () => {
    const grid = document.getElementById('charSelGrid');
    if (!grid) return;
    grid.innerHTML = '';
    disposeCardRenderers();

    const renderer3D = getCardSharedRenderer();
    const currentId = loadSelectedCharacter();

    CHARACTER_LIST.forEach(charInfo => {
      const card = document.createElement('div');
      card.className = 'char-card' + (charInfo.id === currentId ? ' selected' : '');
      card.dataset.id = charInfo.id;

      // 2D 캔버스 (이모티콘 제거, 3D 캐릭터가 메인표출)
      const cvs = document.createElement('canvas');
      cvs.width  = 216;
      cvs.height = 272;
      const ctx2d = cvs.getContext('2d');

      const scene  = makePreviewScene();
      const camera = new THREE.PerspectiveCamera(44, 216 / 272, 0.1, 100);
      camera.position.set(0, 4.2, 8.5);
      camera.lookAt(0, 2.0, 0);

      const { bodyGroup } = makeCharacterModel(charInfo.id);
      bodyGroup.scale.setScalar(1.5);
      bodyGroup.position.y = -0.5;
      scene.add(bodyGroup);

      const cardObj = {
        scene, camera, bodyGroup, ctx2d,
        targetRot: 0, currentRot: 0, isHovered: false
      };
      cardObjects.push(cardObj);

      card.addEventListener('mouseenter', () => { cardObj.isHovered = true; });
      card.addEventListener('mouseleave', () => { cardObj.isHovered = false; });

      // 다국어 번역된 이름 / 설명 / 선택 배지
      const trans = window.i18n ? window.i18n.getCharTranslation(charInfo.id) : { name: charInfo.name, desc: charInfo.desc };
      const selectedText = window.i18n ? window.i18n.t('selected') : 'SELECTED';

      const nameEl  = document.createElement('div'); nameEl.className  = 'char-card-name';  nameEl.textContent = trans.name;
      const descEl  = document.createElement('div'); descEl.className  = 'char-card-desc';  descEl.textContent = trans.desc;
      const badge   = document.createElement('div'); badge.className   = 'char-card-badge'; badge.textContent  = selectedText;

      card.append(cvs, nameEl, descEl, badge);
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
        if (handlers && handlers.onCharacterSelect) {
          handlers.onCharacterSelect(charInfo.id);
        }
        // 0.35초 후 선택 화면 닫고 메인으로
        setTimeout(() => {
          closeCharSelect();
        }, 350);
      });
    });

    const loopCards = () => {
      cardSelectRAF = requestAnimationFrame(loopCards);
      cardObjects.forEach(obj => {
        if (obj.isHovered) {
          obj.targetRot += 0.010; // 마우스 호버 시 우아하고 천천히 360도 회전!
        } else {
          obj.targetRot = obj.targetRot % (Math.PI * 2);
          if (obj.targetRot > Math.PI) obj.targetRot -= Math.PI * 2;
          obj.targetRot += (0 - obj.targetRot) * 0.07;
        }
        obj.currentRot += (obj.targetRot - obj.currentRot) * 0.18;
        obj.bodyGroup.rotation.y = obj.currentRot;

        if (renderer3D) {
          renderer3D.render(obj.scene, obj.camera);
          obj.ctx2d.clearRect(0, 0, 216, 272);
          obj.ctx2d.drawImage(cardOffscreenCvs, 0, 0);
        }
      });
    };
    loopCards();
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
  if (btnCharBack)  btnCharBack.addEventListener('click', (e) => {
    e.stopPropagation();
    soundFx.playClick();
    closeCharSelect();
  });

  // ESC 키 눌렀을 때 캐릭터 선택창 닫기 지원
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      const scCharSel = document.getElementById('scCharSelect');
      if (scCharSel && !scCharSel.classList.contains('off')) {
        closeCharSelect();
      }
    }
  });

  // 메인화면 진입 시 현재 캐릭터 프리뷰 초기화
  initMainCharPreview(loadSelectedCharacter());

  return {
    showScreen, updateHUD, showToast, showBonusToast, setMangaSpeedLines, setBoosterUI,
    showSurpriseBadge, showVictoryOverlay, showSkipHint, triggerDissolveRespawn, setDangerVignette,
    updateDriftChargeUI, updateStageTitle, updateCornerWarningUI, updateMedalHUD,
    initRaceBar, updateRaceBar, updateScore,
    initMainCharPreview, loadSelectedCharacter,
  };
};
