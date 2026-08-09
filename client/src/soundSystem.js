// ────────────────────────────────────────────────────────
// 🔊 SNOWFALL 3D - Web Audio API 기반 세련된 게임 효과음 엔진 모듈
// ────────────────────────────────────────────────────────

class SoundManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null; // 추가
    this.isMuted = false;
    this.initDone = false;
    this.goldCombo = 0;
    this.lastGoldTime = 0;
    this.uiBound = false;
    this.bgmAudio = null;
    this.currentBGMTrack = null;
    this.driftNode = null;
    this.driftGain = null;

    // 🔊 BGM: 0.13 (은은), SFX: 0.60 (살짝 줄임)
    this.bgmVolume = 0.13;
    this.sfxVolume = 0.60;
    this.masterVolume = 0.70;

    localStorage.setItem('ski_bgm_vol', '0.13');
    localStorage.setItem('ski_sfx_vol', '0.60');
    localStorage.setItem('ski_master_vol', '0.70');
    
    // 기본적으로 무조건 음악/효과음 모두 켜진 상태(false)로 강제 설정하여 자동 재생
    localStorage.setItem('ski_bgm_mute', 'false');
    localStorage.setItem('ski_sfx_mute', 'false');

    this.bgmMuted = false;
    this.sfxMuted = false;
    this.masterMuted = false;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.bindUIControls(), { once: true });
    } else {
      this.bindUIControls();
    }
  }

  // 브라우저 사용자 상호작용 후 AudioContext 및 노이즈 버퍼 사전 할당 (런타임 렉/GC 100% 방지)
  init() {
    if (this.initDone) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.getEffectiveMasterVolume(), this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
        
        // 효과음 전용 볼륨 제어 노드
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = this.sfxVolume;
        if (!this.sfxMuted) {
          this.sfxGain.connect(this.masterGain);
        }

        this.initSharedNoiseBuffers();
        this.initDone = true;
      }
    } catch (e) {
      console.warn('AudioContext init failed:', e);
    }
  }

  getEffectiveMasterVolume() {
    return this.masterMuted ? 0 : this.masterVolume;
  }

  getEffectiveBGMVolume() {
    return this.bgmMuted ? 0 : this.bgmVolume * this.getEffectiveMasterVolume();
  }

  getEffectiveSFXVolume() {
    return this.sfxMuted ? 0 : this.sfxVolume * this.getEffectiveMasterVolume();
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
      this.ctx.resume().catch(e => {
        // Safe to ignore: Autoplay policy may restrict resuming until a user gesture occurs.
      });
    }
  }

  getSFXGain(baseVal = 1.0) {
    if (this.isMuted || this.sfxMuted) return 0;
    return baseVal * this.sfxVolume;
  }

  // 1. 🎬 오프닝 컷씬 / 스타트 웅장한 저음 파동 + 신시사이저 소리
  playStart() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.sfxMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.45);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);

    osc.start(t);
    osc.stop(t + 0.6);
  }

  // 2. ❗ 컷씬 스키어 깜짝 도약 시 팝! 경고음 (귀여운 high-pitched 팝 팝 소리)
  playSurprise() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.sfxMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, t);
    osc.frequency.exponentialRampToValueAtTime(1250, t + 0.12);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  // 3. 🌬️ 부스터 발동 (시원하게 귓전을 휩쓸고 지나가는 정갈하고 세련된 바람 소리)
  playBoost() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.sfxMuted) return;

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
    gain.connect(this.sfxGain || this.masterGain);

    noise.start(t);
    noise.stop(t + 0.45);
  }

  // 4. 🦘 눈밭 스키 점프 도약음 (띠옹- 소리 없이 정갈하게 스키 날이 눈을 붕! 차올리는 바람 소리)
  playJump() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.sfxMuted) return;

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
    noiseGain.connect(this.sfxGain || this.masterGain);

    noise.start(t);
    noise.stop(t + 0.18);
  }

  // 4-1. 🚀 대형 점프대 (Kicker Ramp) 강풍 점프 도약음
  playKickerLaunch() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.sfxMuted) return;

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
    noiseGain.connect(this.sfxGain || this.masterGain);

    noise.start(t);
    noise.stop(t + 0.35);
  }

  // 5. 🛬 점프 착지 성공음 (묵직하게 스키 날이 눈을 가르는 착지음)
  playLand() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.sfxMuted) return;

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
    gain.connect(this.sfxGain || this.masterGain);

    noise.start(t);
    noise.stop(t + 0.12);
  }

  // 6. 🔷 일반 크리스탈/다이아몬드 획득음 (맑고 밝은 "띠링~" 사운드)
  playGold() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.sfxMuted) return;

    const now = performance.now();
    if (now - this.lastGoldTime < 600) {
      this.goldCombo = Math.min(8, this.goldCombo + 1);
    } else {
      this.goldCombo = 0;
    }
    this.lastGoldTime = now;

    const t = this.ctx.currentTime;
    const pitchMult = 1.0 + this.goldCombo * 0.08;
    // 띠링~ : 주파수가 높은 사인파 + 짧은 decay로 맑고 깨끗하게
    const freqs = [1046.50, 1318.51]; // C6, E6
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * pitchMult, t + idx * 0.04);
      gainNode.gain.setValueAtTime(0.0, t + idx * 0.04);
      gainNode.gain.linearRampToValueAtTime(0.4, t + idx * 0.04 + 0.008);
      gainNode.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.04 + 0.28);
      osc.connect(gainNode);
      gainNode.connect(this.sfxGain || this.masterGain);
      osc.start(t + idx * 0.04);
      osc.stop(t + idx * 0.04 + 0.30);
    });
  }

  // 7. 🌟 황금 다이아몬드 "띠링~" 획득음 (밝고 깨끗한 3음 아르페지오 벨 사운드)
  playGoldenDiamond() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.sfxMuted) return;

    const t = this.ctx.currentTime;
    // 띠링~ : 높은 음정 3개를 빠르게 아르페지오로, 긴 decay로 여운 남기기 (C-E-G 코드)
    const notes = [1046.50, 1318.51, 1568.00]; // C6 - E6 - G6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);
      gainNode.gain.setValueAtTime(0.0, t + idx * 0.05);
      gainNode.gain.linearRampToValueAtTime(0.38, t + idx * 0.05 + 0.008);
      gainNode.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.45);
      osc.connect(gainNode);
      gainNode.connect(this.sfxGain || this.masterGain);
      osc.start(t + idx * 0.05);
      osc.stop(t + idx * 0.05 + 0.50);
    });
  }

  // 7-1. 🥇 황금 메달 전용 "딸랑~" 획득음 (더욱 청아하고 영롱한 벨 사운드)
  playMedalGet() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.sfxMuted) return;

    const t = this.ctx.currentTime;
    // 딸랑~: 더 높은 음과 triangle 파형으로 청아하고 영롱한 벨/차임 소리 구현
    const notes = [1568.00, 1975.53, 2349.32]; // G6 - B6 - D7
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      osc.type = 'triangle'; // 'sine'보다 부드럽고 차임에 가까운 소리
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);

      gainNode.gain.setValueAtTime(0.0, t + idx * 0.06);
      gainNode.gain.linearRampToValueAtTime(0.35, t + idx * 0.06 + 0.01);
      // 더 긴 decay로 여운을 남겨 '딸랑~' 느낌 강조
      gainNode.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.75);

      osc.connect(gainNode);
      gainNode.connect(this.sfxGain || this.masterGain);
      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.80);
    });
  }

  // 7. 💥 나무/바위 충돌 스턴음 (쿠궁- 둔탁하고 묵직한 임팩트 충돌음)
  playCrash() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.sfxMuted) return;

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
    gain.connect(this.sfxGain || this.masterGain);

    osc.start(t);
    osc.stop(t + 0.28);
  }

  // 8. 💀 산사태 삼켜짐 게임오버음 (어두운 저음 하강음)
  playGameOver() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.sfxMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.8);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.85);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);

    osc.start(t);
    osc.stop(t + 0.85);
  }

  // 8-1. 🚩 스테이지 관문 통과 승리 팡파르음 (도-미-솔 C5-E5-G5-C6 아르페지오)
  playStageClear() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.sfxMuted) return;

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
      gain.connect(this.sfxGain || this.masterGain);

      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.22);
    });
  }

  // 9. 🏆 Stage 10 완주 공중제비 승리 팡파르음!
  playVictory() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.sfxMuted) return;

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
      gain.connect(this.sfxGain || this.masterGain);

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
    gain.connect(this.sfxGain || this.masterGain);

    osc.start(t);
    osc.stop(t + 0.032);
  }

  // 11. 🎵 MP3/OGG BGM 재생 엔진 (Stage 10/11 및 메인 테마 음악 자동 로드 & 무한 루프)
  playBGM(trackName = 'stage10') {
    this.ensureContext();
    this.currentBGMTrack = trackName;
    if (this.bgmMuted) return; // 음소거 상태면 로드/재생 시도조차 하지 않음

    if (this.currentBGMTrack === trackName && this.bgmAudio && !this.bgmAudio.paused) return;

    this.stopBGM();

    const possiblePaths = [
      `client/assets/audio/bgm/${trackName}.mp3`,
      `client/assets/audio/bgm/${trackName}.ogg`,
      `client/assets/audio/bgm/${trackName}_finale.mp3`,
      `client/assets/audio/bgm/${trackName}_bonus.mp3`,
    ];

    const audio = new Audio();
    audio.loop = true;
    audio.volume = this.getEffectiveBGMVolume();

    let pathIdx = 0;
    const tryNextPath = () => {
      if (this.bgmAudio !== audio) return; // BGM이 이미 교체되었거나 정지되었다면 시도 중단
      if (pathIdx >= possiblePaths.length) return;
      audio.src = possiblePaths[pathIdx++];
      audio.play().catch(() => {
        tryNextPath();
      });
    };

    this.bgmAudio = audio;
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

  applyMasterVolume() {
    if (!this.ctx || !this.masterGain) return;
    this.masterGain.gain.setValueAtTime(this.getEffectiveMasterVolume(), this.ctx.currentTime);
    if (this.bgmAudio) {
      this.bgmAudio.volume = this.getEffectiveBGMVolume();
    }
  }

  setMasterVolume(vol) {
    this.masterVolume = Math.max(0, Math.min(1, Number(vol) || 0));
    localStorage.setItem('ski_master_vol', String(this.masterVolume));
    this.applyMasterVolume();
    this.syncVolumeUI();
  }

  toggleMasterMute() {
    this.masterMuted = !this.masterMuted;
    localStorage.setItem('ski_master_mute', this.masterMuted ? 'true' : 'false');
    this.applyMasterVolume();
    this.syncVolumeUI();
    return this.masterMuted;
  }

  bindUIControls() {
    if (this.uiBound || !document) return;
    this.uiBound = true;
    this.syncVolumeUI();
  }

  syncVolumeUI() {
    if (!document) return;

    const bgmBtn = document.getElementById("btnBgmSpeaker");
    if (bgmBtn) {
      bgmBtn.textContent = this.bgmMuted ? "🔇" : "🔊";
    }

    const sfxBtn = document.getElementById("btnSfxSpeaker");
    if (sfxBtn) {
      sfxBtn.textContent = this.sfxMuted ? "🔇" : "🔊";
    }
  }

  // 🔊 실시간 BGM/SFX 볼륨 및 음소거 설정 메서드
  setBGMVolume(vol) {
    this.bgmVolume = Math.max(0, Math.min(1, Number(vol) || 0));
    localStorage.setItem("ski_bgm_vol", String(this.bgmVolume));

    if (this.bgmAudio) {
      this.bgmAudio.volume = this.bgmMuted ? 0 : this.bgmVolume;
    }
    this.syncVolumeUI();
  }

  setSFXVolume(vol) {
    this.sfxVolume = Math.max(0, Math.min(1, Number(vol) || 0));
    localStorage.setItem("ski_sfx_vol", String(this.sfxVolume));
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.sfxMuted ? 0 : this.sfxVolume;
    }
  }

  toggleBGMMute() {
    this.bgmMuted = !this.bgmMuted;
    localStorage.setItem("ski_bgm_mute", this.bgmMuted ? "true" : "false");

    if (this.bgmMuted) {
      if (this.bgmAudio) {
        this.bgmAudio.pause();
      }
    } else {
      if (this.bgmAudio) {
        this.bgmAudio.play().catch(e => console.warn(e));
      } else if (this.currentBGMTrack) {
        this.playBGM(this.currentBGMTrack);
      }
    }

    this.syncVolumeUI();
    return this.bgmMuted;
  }

  toggleSFXMute() {
    this.sfxMuted = !this.sfxMuted;
    localStorage.setItem("ski_sfx_mute", this.sfxMuted ? "true" : "false");
    if (this.sfxGain) {
      if (this.sfxMuted) {
        this.sfxGain.disconnect();
      } else {
        this.sfxGain.disconnect(); // 안전 조치
        this.sfxGain.connect(this.masterGain);
      }
    }
    this.syncVolumeUI();
    return this.sfxMuted;
  }

  // 12. ❄️ 고속 드리프트 슬라이딩 효과음 (작게 스으윽... 사운드 루프)
  startDriftLoop() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.sfxMuted || this.sfxVolume <= 0) return;
    if (this.driftNode) return; // 이미 재생 중

    try {
      const bufferSize = this.ctx.sampleRate * 1.0;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(650, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.8, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      const targetGain = this.sfxMuted ? 0 : this.sfxVolume * 0.16; // 은은하고 작게 스으윽...
      gain.gain.setValueAtTime(targetGain, this.ctx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain || this.masterGain);

      noise.start();
      this.driftNode = noise;
      this.driftGain = gain;
    } catch (e) {
      console.warn('Drift loop start failed:', e);
    }
  }

  stopDriftLoop() {
    if (this.driftNode && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        if (this.driftGain) {
          this.driftGain.gain.setValueAtTime(this.driftGain.gain.value, now);
          this.driftGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        }
        setTimeout(() => {
          if (this.driftNode) {
            this.driftNode.stop();
            this.driftNode.disconnect();
            this.driftNode = null;
            this.driftGain = null;
          }
        }, 100);
      } catch (e) {
        this.driftNode = null;
        this.driftGain = null;
      }
    }
  }

  // ⚡ 드리프트 떼고 부스터 발동 시: 점프 착지 후 부스트와 동일한 시원한 바람 소리!
  playDriftBoost() {
    this.playBoost();
  }
}

export const soundFx = new SoundManager();
