export const setupUI = (handlers) => {
  const $score = document.getElementById('hScore');
  const $speed = document.getElementById('hSpeed');
  const $stage = document.getElementById('hStage');
  const $fillSpd = document.getElementById('spdFill');
  const $fillJump = document.getElementById('jmpFill');
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

  if (btnStartEl)  btnStartEl.onclick  = handlers.onStart;
  if (btnResumeEl) btnResumeEl.onclick = handlers.onTogglePause;
  if (btnRestartEl) btnRestartEl.onclick = handlers.onStart;

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
    } else if (type === 'game') {
      scrStart.classList.add('off'); scrPause.classList.add('off'); scrOver.classList.add('off');
    } else if (type === 'pause') {
      scrPause.classList.remove('off');
    } else if (type === 'unpause') {
      scrPause.classList.add('off');
    } else if (type === 'over') {
      document.getElementById('overStats').innerHTML = statsText;
      scrOver.classList.remove('off');
    }
  };

  return { showToast, showBonusToast, setBoosterUI, updateHUD, updateStageTitle, showScreen };
};
