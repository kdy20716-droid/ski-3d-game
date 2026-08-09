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

    // 🔊 BGM 및 SFX 개별 볼륨 / 음소거 저장 상태
    this.bgmVolume = parseFloat(localStorage.getItem('ski_bgm_vol') ?? '0.45');
    this.sfxVolume = parseFloat(localStorage.getItem('ski_sfx_vol') ?? '0.50');
    this.bgmMuted = localStorage.getItem('ski_bgm_mute') === 'true';
    this.sfxMuted = localStorage.getItem('ski_sfx_mute') === 'true';
  }

  // 브라우저 사용자 상호작용 후 AudioContext 및 노이즈 버퍼 사전 할당 (런타임 렉/GC 100% 방지)
  init() {
    if (this.initDone) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime); // 적절한 마스터 볼륨
        this.masterGain.connect(this.ctx.destination);
        this.initSharedNoiseBuffers();
        this.initDone = true;
      }
    } catch (e) {
      console.warn('AudioContext init failed:', e);
    }
  }

  initSharedNoiseBuffers() {
    if (!this.ctx || this.sharedNoise35) return;
    try {
      const sr = this.ctx.sampleRate;
      
      const b35 = this.ctx.createBuffer(1, Math.floor(sr * 0.35), sr);
      const d35 = b35.getChannelData(0);
      for (let i = 0; i < d35.length; i++) d35[i] = Math.random() * 2 - 1;
      this.sharedNoise35 = b35;

      const b18 = this.ctx.createBuffer(1, Math.floor(sr * 0.18), sr);
      const d18 = b18.getChannelData(0);
      for (let i = 0; i < d18.length; i++) d18[i] = Math.random() * 2 - 1;
      this.sharedNoise18 = b18;

      const b12 = this.ctx.createBuffer(1, Math.floor(sr * 0.12), sr);
      const d12 = b12.getChannelData(0);
      for (let i = 0; i < d12.length; i++) d12[i] = Math.random() * 2 - 1;
      this.sharedNoise12 = b12;
    } catch (e) {
      console.warn('Pre-allocating noise buffers failed:', e);
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
    const noise = this.ctx.createBufferSource();
    if (this.sharedNoise35) {
      noise.buffer = this.sharedNoise35;
    } else {
      const bufferSize = this.ctx.sampleRate * 0.35;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      noise.buffer = buffer;
    }

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
    const noise = this.ctx.createBufferSource();
    if (this.sharedNoise12) {
      noise.buffer = this.sharedNoise12;
    } else {
      const bufferSize = this.ctx.sampleRate * 0.12;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      noise.buffer = buffer;
    }

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

  // 7. 🌟 황금 다이아몬드/메달 전용 경량화 챠링-! 획득음 (오디오 스레드 렉 100% 차단)
  playGoldenDiamond() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const notes = [659.25, 1046.50, 1318.51]; // E5 - C6 - E6 3음 아르페지오 (경량 믹서 연산)
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.03);

      gain.gain.setValueAtTime(0.3, t + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.03 + 0.14);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + idx * 0.03);
      osc.stop(t + idx * 0.03 + 0.14);
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

  // 10. 🖱️ UI 버튼 클릭음 (차분하고 고급스러운 묵직한 기계식 톡 소리)
  playClick() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.sfxMuted || this.sfxVolume <= 0) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // 뿅뿅거리지 않는 차분하고 묵직한 우드/글래스 기계식 틱 (210Hz ➔ 65Hz 지수 감쇄)
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(210, t);
    osc.frequency.exponentialRampToValueAtTime(65, t + 0.032);

    const effectiveVol = this.sfxVolume * 0.35;
    gain.gain.setValueAtTime(effectiveVol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.032);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.032);
  }

  // 11. 🎵 MP3/OGG BGM 재생 엔진 (로비, 캐릭터선택, 스테이지 BGM 페이드 크로스전환)
  playBGM(trackName = 'robby', startTime = 0) {
    this.ensureContext();
    if (this.currentBGMTrack === trackName && this.bgmAudio && !this.bgmAudio.paused) {
      this.bgmAudio.volume = this.bgmMuted ? 0 : this.bgmVolume;
      return;
    }

    this.stopBGM();

    let nameVariants = [trackName];
    if (trackName === 'robby') nameVariants = ['robby', 'lobby', 'menu_theme'];
    else if (trackName === 'character') nameVariants = ['character', 'char', 'character_select'];

    const possiblePaths = [];
    for (const name of nameVariants) {
      possiblePaths.push(`client/assets/audio/bgm/${name}.mp3`);
      possiblePaths.push(`client/assets/audio/bgm/${name}.ogg`);
      possiblePaths.push(`client/assets/audio/bgm/${name}.wav`);
      possiblePaths.push(`client/assets/audio/bgm/${name}.m4a`);
      possiblePaths.push(`${name}.mp3`);
    }

    const audio = new Audio();
    audio.loop = true;
    const targetVol = this.bgmMuted ? 0 : this.bgmVolume;
    audio.volume = targetVol;

    let pathIdx = 0;
    const tryNextPath = () => {
      if (pathIdx >= possiblePaths.length) return;
      const path = possiblePaths[pathIdx++];
      audio.src = path;

      const setTrackTime = () => {
        if (startTime > 0) {
          try { audio.currentTime = startTime; } catch (e) {}
        }
      };
      audio.addEventListener('loadedmetadata', setTrackTime);

      audio.play().then(() => {
        setTrackTime();
      }).catch(() => {
        tryNextPath();
      });
    };

    this.bgmAudio = audio;
    this.currentBGMTrack = trackName;
    tryNextPath();
  }

  // 🎚️ 로비 ➔ 캐릭터 선택 곡 간의 매끄러운 1초 크로스 페이드 교체
  fadeToBGM(trackName = 'robby', startTime = 0, fadeDuration = 1000) {
    this.ensureContext();
    if (this.currentBGMTrack === trackName && this.bgmAudio && !this.bgmAudio.paused) {
      return;
    }

    const oldAudio = this.bgmAudio;

    // 기존 음악 페이드 아웃
    if (oldAudio) {
      const startVol = oldAudio.volume;
      const startTimeTs = performance.now();
      const fadeOutInterval = setInterval(() => {
        const elapsed = performance.now() - startTimeTs;
        const progress = Math.min(1, elapsed / fadeDuration);
        oldAudio.volume = Math.max(0, startVol * (1 - progress));
        if (progress >= 1) {
          clearInterval(fadeOutInterval);
          oldAudio.pause();
          oldAudio.currentTime = 0;
        }
      }, 30);
    }

    let nameVariants = [trackName];
    if (trackName === 'robby') nameVariants = ['robby', 'lobby', 'menu_theme'];
    else if (trackName === 'character') nameVariants = ['character', 'char', 'character_select'];

    const possiblePaths = [];
    for (const name of nameVariants) {
      possiblePaths.push(`client/assets/audio/bgm/${name}.mp3`);
      possiblePaths.push(`client/assets/audio/bgm/${name}.ogg`);
      possiblePaths.push(`client/assets/audio/bgm/${name}.wav`);
      possiblePaths.push(`client/assets/audio/bgm/${name}.m4a`);
      possiblePaths.push(`${name}.mp3`);
    }

    const newAudio = new Audio();
    newAudio.loop = true;
    newAudio.volume = 0; // 페이드 인을 위해 0부터 시작

    let pathIdx = 0;
    const tryNextPath = () => {
      if (pathIdx >= possiblePaths.length) return;
      const path = possiblePaths[pathIdx++];
      newAudio.src = path;

      const setTrackTime = () => {
        if (startTime > 0) {
          try { newAudio.currentTime = startTime; } catch (e) {}
        }
      };

      newAudio.addEventListener('loadedmetadata', setTrackTime);

      newAudio.play().then(() => {
        setTrackTime();
        // 페이드 인 애니메이션
        const fadeStartTime = performance.now();
        const fadeInInterval = setInterval(() => {
          const elapsed = performance.now() - fadeStartTime;
          const progress = Math.min(1, elapsed / fadeDuration);
          const curTargetVol = this.bgmMuted ? 0 : this.bgmVolume;
          newAudio.volume = curTargetVol * progress;
          if (progress >= 1) {
            clearInterval(fadeInInterval);
            newAudio.volume = curTargetVol;
          }
        }, 30);
      }).catch(() => {
        tryNextPath();
      });
    };

    this.bgmAudio = newAudio;
    this.currentBGMTrack = trackName;
    tryNextPath();
  }

  stopBGM() {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio.currentTime = 0;
      this.bgmAudio = null;
    }
    this.currentBGMTrack = null;
  }
}

export const soundFx = new SoundManager();
