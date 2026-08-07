// =====================================================================
// 🥇 medalAnimation.js — 관문 통과 시 메달 fly-to-score 전용 애니메이션 모듈
// 슬롯에서 "톡!" 튀어나와 점수판으로 쏙! 빨려들어가며 점수가 실시간 +됨
// =====================================================================

const BONUS_STEPS = [3000, 6000, 10000];

// 이징 함수 (ease-in-out cubic)
const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// 이징 함수 (ease-in quad: 점수판으로 빨려들어가는 가속)
const easeInQuad = (t) => t * t;

export const triggerMedalFlyToScoreAnimation = (medalCount, onScoreStepCallback, showBonusToast) => {
  if (medalCount <= 0) return;

  const count = Math.min(medalCount, 3);

  // 점수판(좌측 hud-box) 위치 구하기
  const scoreBox = document.querySelector('.hud-box');
  if (!scoreBox) return;

  // 각 슬롯에서 순차적으로 메달을 톡! 빠져나와 점수판으로 날아가게 함
  const fireOneMedal = (index) => {
    const slot = document.getElementById(`mSlot${index}`);
    if (!slot) return;

    const slotRect = slot.getBoundingClientRect();
    const scoreRect = scoreBox.getBoundingClientRect();

    // 슬롯 중심 (출발 위치)
    const startX = slotRect.left + slotRect.width / 2;
    const startY = slotRect.top + slotRect.height / 2;

    // 점수판 중심 (도착 위치)
    const endX = scoreRect.left + scoreRect.width / 2;
    const endY = scoreRect.top + scoreRect.height / 2;

    // 1. 슬롯 초기화 (비움)
    slot.classList.remove('filled');

    // 2. 2D 날아가는 메달 파티클 엘리먼트 생성
    const particle = document.createElement('div');
    particle.className = 'flying-medal-particle';
    particle.style.cssText = `
      position: fixed;
      left: ${startX - 18}px;
      top: ${startY - 18}px;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #FFF2A3 0%, #FFD043 50%, #FF8800 100%);
      border: 2.5px solid #FFFFFF;
      box-shadow: 0 0 25px #FFD700, 0 0 50px rgba(255,215,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      font-size: 20px;
      pointer-events: none;
      z-index: 9999999;
      will-change: transform, left, top, opacity;
      transform: scale(0.5);
      opacity: 1;
      transition: none;
    `;
    particle.textContent = '★';
    document.body.appendChild(particle);

    // 3. 팝! 튀어나오는 초기 효과 (scale 0.5 → 1.4 → 날아감)
    const TOTAL_DURATION = 680; // ms
    const POP_DURATION = 120;   // ms: 팝! 튀어나오는 구간
    let startTime = null;

    // 팝! 효과 — scale이 순간적으로 커졌다가 날아가기 시작
    particle.style.transform = 'scale(0.5)';
    requestAnimationFrame(() => {
      particle.style.transition = `transform ${POP_DURATION}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
      particle.style.transform = 'scale(1.4)';

      setTimeout(() => {
        particle.style.transition = 'none';
        particle.style.transform = 'scale(1.3)';

        // 4. rAF 루프로 점수판까지 매끄럽게 날아가기
        const flyStart = performance.now();

        const animate = (now) => {
          const elapsed = now - flyStart;
          const rawT = Math.min(elapsed / TOTAL_DURATION, 1.0);
          const t = easeInQuad(rawT); // 가속하며 빨려들어가는 느낌

          // 현재 위치 보간
          const cx = startX + (endX - startX) * t;
          const cy = startY + (endY - startY) * t;

          // 포물선 아크 (살짝 위로 솟았다 내려가는 느낌)
          const arc = Math.sin(rawT * Math.PI) * -40;
          const currentX = cx - 18;
          const currentY = cy + arc - 18;

          // 날아가면서 크기 점점 작아지고 투명해짐
          const scale = 1.3 - rawT * 0.9;
          const opacity = rawT < 0.85 ? 1.0 : 1.0 - (rawT - 0.85) / 0.15;

          particle.style.left = `${currentX}px`;
          particle.style.top = `${currentY}px`;
          particle.style.transform = `scale(${scale})`;
          particle.style.opacity = opacity;

          if (rawT < 1.0) {
            requestAnimationFrame(animate);
          } else {
            // 5. 점수판 도달! 파티클 제거 + 점수 즉시 반영 + 토스트 팝업
            if (particle.parentNode) particle.parentNode.removeChild(particle);

            // 점수판 펄스 효과
            scoreBox.style.transition = 'transform 0.12s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.12s ease';
            scoreBox.style.transform = 'scale(1.15)';
            scoreBox.style.boxShadow = '0 0 30px #FFD700, 0 0 60px rgba(255,215,0,0.6)';
            setTimeout(() => {
              scoreBox.style.transform = 'scale(1.0)';
              scoreBox.style.boxShadow = '';
            }, 220);

            // 점수 콜백 & 토스트
            const pts = BONUS_STEPS[index] || 3000;
            const label = index === 0 ? '+3,000' : index === 1 ? '+6,000' : '+10,000';
            if (showBonusToast) showBonusToast(`MEDAL BONUS ${label}`, true);
            if (onScoreStepCallback) onScoreStepCallback(pts);
          }
        };

        requestAnimationFrame(animate);

      }, POP_DURATION + 30);
    });
  };

  // 각 메달을 0.32초 간격으로 순차 발사
  for (let i = 0; i < count; i++) {
    setTimeout(() => fireOneMedal(i), i * 320);
  }
};
