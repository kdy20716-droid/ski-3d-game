// ────────────────────────────────────────────────────────
// 🔊 SNOWFALL 3D - Web Audio API 기반 세련된 게임 효과음 엔진 모듈
// ────────────────────────────────────────────────────────

class SoundManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
    this.initDone = false;
    this.goldCombo = 0;
    this.lastGoldTime = 0;
  }

  // 브라우저 사용자 상호작용 후 AudioContext 안전 초기화
  init() {
    if (this.initDone) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime); // 적절한 마스터 볼륨
        this.masterGain.connect(this.ctx.destination);
        this.initDone = true;
      }
    } catch (e) {
      console.warn('AudioContext init failed:', e);
    }
  }

  ensureContext() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // 1. 🎬 오프닝 컷씬 / 스타트 웅장한 저음 파동 + 신시사이저 소리
  playStart() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.45);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.6);
  }

  // 2. ❗ 컷씬 스키어 깜짝 도약 시 팝! 경고음 (귀여운 high-pitched 팝 팝 소리)
  playSurprise() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, t);
    osc.frequency.exponentialRampToValueAtTime(1250, t + 0.12);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  // 3. 🌬️ 부스터 발동 (시원하게 귓전을 휩쓸고 지나가는 정갈하고 세련된 바람 소리)
  playBoost() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    
    // 시원한 대기 바람 화이트/핑크 노이즈 휩
    const bufferSize = this.ctx.sampleRate * 0.45;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // 밴드패스 레조넌스 필터로 바람 솟구침 350Hz -> 2400Hz -> 500Hz
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(2.5, t);
    filter.frequency.setValueAtTime(350, t);
    filter.frequency.exponentialRampToValueAtTime(2400, t + 0.20);
    filter.frequency.exponentialRampToValueAtTime(500, t + 0.45);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.55, t + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.005, t + 0.45);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + 0.45);
  }

  // 4. 🦘 눈밭 스키 점프 도약음 (띠옹- 소리 없이 정갈하게 스키 날이 눈을 붕! 차올리는 바람 소리)
  playJump() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;

    // 순수 스키 날 눈 마찰 스노우 스프레이 휩 (Noise Filter Whoosh)
    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(1.8, t);
    filter.frequency.setValueAtTime(320, t);
    filter.frequency.exponentialRampToValueAtTime(1800, t + 0.18);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.48, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.005, t + 0.18);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + 0.18);
  }

  // 4-1. 🚀 대형 점프대 (Kicker Ramp) 강풍 점프 도약음
  playKickerLaunch() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(2.2, t);
    filter.frequency.setValueAtTime(250, t);
    filter.frequency.exponentialRampToValueAtTime(2800, t + 0.25);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.55, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.005, t + 0.35);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + 0.35);
  }

  // 5. 🛬 점프 착지 성공음 (묵직하게 스키 날이 눈을 가르는 착지음)
  playLand() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.12);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + 0.12);
  }

  // 6. 🔷 일반 크리스탈 / 다이아몬드 획득음 (100% 빠짐없이 즉각 울리는 아케이드 띵-! 소리)
  playGold() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = performance.now();
    if (now - this.lastGoldTime < 600) {
      this.goldCombo = Math.min(8, this.goldCombo + 1);
    } else {
      this.goldCombo = 0;
    }
    this.lastGoldTime = now;

    const t = this.ctx.currentTime;
    // 콤보에 따른 피치 스케일링 (연속 획득 시 띵 띵 띵! 소리가 높아짐)
    const pitchMult = 1.0 + this.goldCombo * 0.06;
    const baseFreqs = [659.25, 1046.50];

    baseFreqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * pitchMult, t + idx * 0.02);

      gain.gain.setValueAtTime(0.35, t + idx * 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.02 + 0.14);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + idx * 0.02);
      osc.stop(t + idx * 0.02 + 0.14);
    });
  }

  // 7. 🌟 황금 다이아몬드 (Golden Diamond) 전용 화려한 챠링-! 획득음 (100% 즉각 믹서 렌더링)
  playGoldenDiamond() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5 - E5 - G5 - C6 - E6 아르페지오
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.025);

      gain.gain.setValueAtTime(0.38, t + idx * 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.025 + 0.16);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + idx * 0.025);
      osc.stop(t + idx * 0.025 + 0.16);
    });
  }

  // 7. 💥 나무/바위 충돌 스턴음 (쿠궁- 둔탁하고 묵직한 임팩트 충돌음)
  playCrash() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;

    // 저음 타격 오실레이터
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.25);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.28);
  }

  // 8. 💀 산사태 삼켜짐 게임오버음 (어두운 저음 하강음)
  playGameOver() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.8);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.85);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.85);
  }

  // 8-1. 🚩 스테이지 관문 통과 승리 팡파르음 (도-미-솔 C5-E5-G5-C6 아르페지오)
  playStageClear() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 - E5 - G5 - C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);

      gain.gain.setValueAtTime(0.4, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.22);
    });
  }

  // 9. 🏆 Stage 10 완주 공중제비 승리 팡파르음!
  playVictory() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const melody = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    melody.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(0.35, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.08 + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.25);
    });
  }

  // 10. 🖱️ UI 버튼 클릭음 (세련된 찰칵 팝음)
  playClick() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.04);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.04);
  }
}

export const soundFx = new SoundManager();
