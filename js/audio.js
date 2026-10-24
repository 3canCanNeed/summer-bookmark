/* ==========================================================================
   《夏日书签》 音频引擎
   全部由 WebAudio 实时合成，不依赖任何外部音频文件
   ========================================================================== */
window.AUDIO = (function () {
  'use strict';

  var ctx = null, master = null, bgmGain = null, sfxGain = null, comp = null;
  var noiseBuf = null;
  var state = { song: null, cfg: null, beat: 0, nextTime: 0, spb: 0.5, timer: null };
  var vol = { master: 0.85, bgm: 0.5, sfx: 0.75 };
  var enabled = true;

  /* ---------------------------- 音高工具 ---------------------------- */
  var SCALES = {
    major:    [0, 2, 4, 5, 7, 9, 11],
    minor:    [0, 2, 3, 5, 7, 8, 10],
    lydian:   [0, 2, 4, 6, 7, 9, 11],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
    dorian:   [0, 2, 3, 5, 7, 9, 10]
  };

  function freq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function degNote(root, scale, deg) {
    var s = SCALES[scale] || SCALES.major;
    var oct = Math.floor(deg / 7);
    var i = ((deg % 7) + 7) % 7;
    return root + s[i] + oct * 12;
  }

  function chordNotes(root, scale, deg) {
    return [degNote(root, scale, deg), degNote(root, scale, deg + 2), degNote(root, scale, deg + 4)];
  }

  /* ---------------------------- 初始化 ---------------------------- */
  function init() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { return null; }

    master = ctx.createGain();
    master.gain.value = vol.master;
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 22;
    comp.ratio.value = 4;
    comp.attack.value = 0.006;
    comp.release.value = 0.28;
    master.connect(comp);
    comp.connect(ctx.destination);

    bgmGain = ctx.createGain();
    bgmGain.gain.value = vol.bgm;
    bgmGain.connect(master);

    sfxGain = ctx.createGain();
    sfxGain.gain.value = vol.sfx;
    sfxGain.connect(master);
    return ctx;
  }

  function unlock() {
    init();
    if (!ctx) return false;
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    return true;
  }

  function getNoise() {
    if (noiseBuf) return noiseBuf;
    var len = Math.floor(ctx.sampleRate * 2);
    var b = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = b.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    noiseBuf = b;
    return b;
  }

  /* ---------------------------- 音色 ---------------------------- */
  function env(g, t, peak, dur, att) {
    var a = att || 0.008;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }

  // 拨弦 / 电钢
  function pluck(m, t, dur, peak, type, cutoff, dest) {
    if (!ctx) return;
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    var f = ctx.createBiquadFilter();
    o.type = type || 'triangle';
    o.frequency.value = freq(m);
    f.type = 'lowpass';
    f.frequency.value = cutoff || 2800;
    f.Q.value = 0.6;
    env(g, t, peak, dur, 0.006);
    o.connect(f); f.connect(g); g.connect(dest || bgmGain);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  // 柔和长音 pad
  function pad(m, t, dur, peak) {
    if (!ctx) return;
    var g = ctx.createGain();
    var f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 820;
    f.Q.value = 0.4;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + dur * 0.35);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    var det = [1, 1.004, 0.5];
    for (var i = 0; i < det.length; i++) {
      var o = ctx.createOscillator();
      o.type = i === 2 ? 'sine' : 'triangle';
      o.frequency.value = freq(m) * det[i];
      o.connect(f);
      o.start(t);
      o.stop(t + dur + 0.1);
    }
    f.connect(g); g.connect(bgmGain);
  }

  // 低音
  function bass(m, t, dur, peak) {
    if (!ctx) return;
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    var f = ctx.createBiquadFilter();
    o.type = 'sawtooth';
    o.frequency.value = freq(m);
    f.type = 'lowpass';
    f.frequency.value = 420;
    env(g, t, peak, dur, 0.02);
    o.connect(f); f.connect(g); g.connect(bgmGain);
    o.start(t); o.stop(t + dur + 0.05);
  }

  /* ---------------------------- 曲库 ---------------------------- */
  // prog 用音阶级数，arp 是琶音图案，mel 是旋律图案（null=休止）
  var SONGS = {
    daily: {
      bpm: 102, root: 62, scale: 'major', prog: [0, 4, 5, 3],
      arp: [0, 1, 2, 3, 2, 1, 2, 4], arpPeak: 0.05, padPeak: 0.04,
      mel: [4, null, 2, 4, 5, null, 4, 2], melPeak: 0.045, melType: 'sine'
    },
    morning: {
      bpm: 88, root: 64, scale: 'major', prog: [0, 3, 5, 4],
      arp: [0, 2, 1, 3, 4, 3, 2, 1], arpPeak: 0.045, padPeak: 0.038,
      mel: [2, 4, 6, 4, 2, null, 0, null], melPeak: 0.05, melType: 'triangle'
    },
    quiet: {
      bpm: 64, root: 57, scale: 'dorian', prog: [0, 5, 3, 5],
      arp: [0, null, 2, null, 4, null, 2, null], arpPeak: 0.032, padPeak: 0.05,
      mel: [null, null, 4, null, null, 2, null, null], melPeak: 0.035, melType: 'sine'
    },
    su: {
      bpm: 80, root: 60, scale: 'lydian', prog: [0, 3, 5, 4],
      arp: [0, 2, 4, 2, 1, 2, 4, 6], arpPeak: 0.042, padPeak: 0.045,
      mel: [4, null, 5, 4, 2, null, 4, null], melPeak: 0.042, melType: 'sine'
    },
    lin: {
      bpm: 122, root: 65, scale: 'major', prog: [0, 5, 3, 4],
      arp: [0, 2, 4, 2, 4, 6, 4, 2], arpPeak: 0.05, padPeak: 0.032,
      mel: [4, 6, 4, 2, 0, 2, 4, null], melPeak: 0.05, melType: 'triangle'
    },
    mystery: {
      bpm: 70, root: 55, scale: 'phrygian', prog: [0, 1, 0, 6],
      arp: [0, null, 1, null, 0, null, 2, null], arpPeak: 0.03, padPeak: 0.052,
      mel: [null, 0, null, 1, null, null, null, null], melPeak: 0.03, melType: 'sine'
    },
    truth: {
      bpm: 76, root: 53, scale: 'minor', prog: [0, 3, 4, 0],
      arp: [0, 2, 1, 2, 0, 1, 2, 3], arpPeak: 0.038, padPeak: 0.05,
      mel: [4, null, 3, 4, null, 2, null, null], melPeak: 0.038, melType: 'triangle'
    },
    sad: {
      bpm: 60, root: 55, scale: 'minor', prog: [0, 5, 3, 0],
      arp: [0, null, 2, null, 1, null, 2, null], arpPeak: 0.03, padPeak: 0.052,
      mel: [null, 4, null, 2, null, 1, null, null], melPeak: 0.04, melType: 'sine'
    },
    true: {
      bpm: 94, root: 60, scale: 'major', prog: [0, 4, 5, 3],
      arp: [0, 2, 4, 6, 4, 2, 4, 5], arpPeak: 0.05, padPeak: 0.042,
      mel: [4, 5, 4, 2, 4, null, 6, null], melPeak: 0.05, melType: 'sine'
    }
  };

  /* ---------------------------- 调度 ---------------------------- */
  function schedule(beat, t) {
    var s = state.cfg;
    if (!s) return;
    var inBar = beat % 8;
    var ci = Math.floor(beat / 16) % s.prog.length;
    var chord = chordNotes(s.root, s.scale, s.prog[ci]);
    var spb = state.spb;

    // pad：两小节一次
    if (beat % 16 === 0) {
      for (var i = 0; i < chord.length; i++) pad(chord[i], t, spb * 16, s.padPeak);
    }
    // 琶音
    var ai = s.arp[inBar % s.arp.length];
    if (ai !== null && ai !== undefined) {
      var n = chord[ai % chord.length] + (ai >= chord.length ? 12 : 0);
      pluck(n, t, spb * 0.85, s.arpPeak, 'triangle', 3000, bgmGain);
    }
    // 低音
    if (inBar === 0 || inBar === 4) {
      bass(chord[0] - 12, t, spb * 1.9, 0.075);
    }
    // 旋律：每两拍一个
    if (inBar % 2 === 0) {
      var mi = (beat >> 1) % s.mel.length;
      var mv = s.mel[mi];
      if (mv !== null && mv !== undefined) {
        var mn = degNote(s.root, s.scale, mv) + 12;
        pluck(mn, t, spb * 1.7, s.melPeak, s.melType, 2400, bgmGain);
      }
    }
  }

  function tick() {
    if (!ctx || !state.cfg) return;
    if (ctx.state === 'suspended') return;
    var now = ctx.currentTime;
    // 标签页休眠或音频被挂起后，避免一次性补上千个音符
    if (state.nextTime < now - 0.3) state.nextTime = now + 0.06;
    var look = now + 0.45;
    var guard = 0;
    while (state.nextTime < look && guard++ < 64) {
      schedule(state.beat, state.nextTime);
      state.nextTime += state.spb / 2;
      state.beat++;
    }
  }

  /* ---------------------------- 对外：BGM ---------------------------- */
  // 外部音乐文件（window.BGM_FILES 里是 data URI）。有文件就播文件，
  // 没有就回退到程序化合成，两条路共用同一个 bgmGain 总线。
  var fileBuf = {};
  var fileRate = {};

  function dataUriToBuffer(uri) {
    var b64 = uri.slice(uri.indexOf(',') + 1);
    var bin = atob(b64);
    var len = bin.length;
    var arr = new Uint8Array(len);
    for (var i = 0; i < len; i++) arr[i] = bin.charCodeAt(i);
    return arr.buffer;
  }

  function startFileBgm(name, buf, rate) {
    var src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    // 同一首曲子挂到不同场景时用播放速率区分情绪（pitch 随之变化）
    src.playbackRate.value = rate || 1;
    src.connect(bgmGain);
    bgmGain.gain.cancelScheduledValues(ctx.currentTime);
    bgmGain.gain.setTargetAtTime(vol.bgm, ctx.currentTime, 0.25);
    src.start(0);
    state.fileSrc = src;
    state.song = name;
  }

  function tryFileBgm(name) {
    var files = window.BGM_FILES;
    var slot = window.BGM_SLOT;
    var rateMap = window.BGM_RATE;
    if (!files || !slot || !slot[name]) return false;
    if (state.song === name && (state.fileSrc || state.loading === name)) return true;

    var fileName = slot[name];
    var uri = files[fileName];
    if (!uri) return false;
    var rate = (rateMap && rateMap[name]) || 1;

    stopBgm(0.35);
    if (fileBuf[fileName]) { startFileBgm(name, fileBuf[fileName], rate); return true; }

    state.loading = name;
    ctx.decodeAudioData(dataUriToBuffer(uri)).then(function (buf) {
      fileBuf[fileName] = buf;
      if (state.loading === name) startFileBgm(name, buf, rate);
      state.loading = null;
    }).catch(function () { state.loading = null; });
    return true;
  }

  function playBgm(name, opts) {
    if (!enabled) return;
    init();
    if (!ctx) return;
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    if (tryFileBgm(name)) return;
    if (state.song === name && state.timer) return;

    stopBgm(0.35);
    var s = SONGS[name];
    if (!s) return;

    state.song = name;
    state.cfg = s;
    state.beat = 0;
    state.spb = 60 / s.bpm;
    state.nextTime = ctx.currentTime + 0.12;

    bgmGain.gain.cancelScheduledValues(ctx.currentTime);
    bgmGain.gain.setTargetAtTime(vol.bgm, ctx.currentTime, 0.25);

    state.timer = setInterval(tick, 70);
    tick();
  }

  function stopBgm(fade) {
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    if (state.fileSrc) {
      try { state.fileSrc.stop(); } catch (e) {}
      state.fileSrc = null;
    }
    state.loading = null;
    state.song = null;
    state.cfg = null;
    if (ctx && bgmGain) {
      bgmGain.gain.cancelScheduledValues(ctx.currentTime);
      bgmGain.gain.setTargetAtTime(0.0001, ctx.currentTime, (fade || 0.4) / 3);
    }
  }

  /* ---------------------------- 对外：音效 ---------------------------- */
  function bellTone(f, t, dur, peak) {
    var g = ctx.createGain();
    env(g, t, peak || 0.16, dur, 0.005);
    var parts = [1, 2.01, 3.02, 4.71, 6.1];
    for (var i = 0; i < parts.length; i++) {
      var o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f * parts[i];
      var gg = ctx.createGain();
      gg.gain.value = 1 / (i * 1.7 + 1.6);
      o.connect(gg); gg.connect(g);
      o.start(t); o.stop(t + dur + 0.05);
    }
    g.connect(sfxGain);
  }

  function noiseBurst(t, dur, peak, ftype, f0, f1) {
    var src = ctx.createBufferSource();
    src.buffer = getNoise();
    src.loop = true;
    var f = ctx.createBiquadFilter();
    f.type = ftype || 'bandpass';
    f.frequency.setValueAtTime(f0 || 1200, t);
    f.frequency.exponentialRampToValueAtTime(f1 || 400, t + dur);
    f.Q.value = 1.2;
    var g = ctx.createGain();
    env(g, t, peak, dur, 0.006);
    src.connect(f); f.connect(g); g.connect(sfxGain);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  function tone(f, t, dur, peak, type) {
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.value = f;
    env(g, t, peak, dur, 0.004);
    o.connect(g); g.connect(sfxGain);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function sfx(name) {
    if (!enabled) return;
    init();
    if (!ctx || ctx.state === 'suspended') return;
    var t = ctx.currentTime + 0.005;

    switch (name) {
      case 'bell':            // 学校广播钟
        bellTone(784, t, 2.4, 0.14);
        bellTone(1046, t + 0.02, 2.0, 0.07);
        bellTone(523, t + 0.05, 2.8, 0.09);
        break;
      case 'phone':           // 电话铃声
        for (var i = 0; i < 3; i++) {
          bellTone(1250, t + i * 0.28, 0.2, 0.09);
          bellTone(1650, t + i * 0.28, 0.18, 0.05);
        }
        break;
      case 'static':          // 电子杂音 / 耳鸣
        noiseBurst(t, 0.7, 0.10, 'bandpass', 3200, 900);
        noiseBurst(t + 0.02, 0.5, 0.06, 'highpass', 5000, 3000);
        tone(7200, t, 1.2, 0.012, 'sine');
        break;
      case 'click':           // 选项点击
        tone(880, t, 0.07, 0.06, 'triangle');
        tone(1320, t + 0.02, 0.06, 0.03, 'sine');
        break;
      case 'page':            // 翻书
        noiseBurst(t, 0.16, 0.07, 'highpass', 2400, 5200);
        noiseBurst(t + 0.06, 0.12, 0.04, 'bandpass', 1800, 900);
        break;
      case 'select':          // 确认
        tone(660, t, 0.1, 0.05, 'sine');
        tone(990, t + 0.07, 0.14, 0.04, 'sine');
        break;
      case 'heart':           // 心跳
        tone(58, t, 0.18, 0.20, 'sine');
        tone(52, t + 0.24, 0.22, 0.15, 'sine');
        break;
      case 'flash':           // 闪白冲击
        noiseBurst(t, 0.5, 0.12, 'lowpass', 8000, 400);
        tone(110, t, 0.45, 0.10, 'sine');
        break;
      case 'door':            // 门
        noiseBurst(t, 0.25, 0.06, 'lowpass', 900, 200);
        tone(140, t, 0.2, 0.05, 'triangle');
        break;
      case 'step':            // 脚步
        noiseBurst(t, 0.09, 0.05, 'lowpass', 700, 200);
        break;
      case 'wind':            // 风
        noiseBurst(t, 1.6, 0.05, 'bandpass', 700, 1500);
        break;
      case 'cicada':          // 蝉鸣
        noiseBurst(t, 1.8, 0.045, 'bandpass', 4600, 5200);
        break;
      case 'typing':
        tone(1500 + Math.random() * 300, t, 0.02, 0.008, 'square');
        break;
      default:
        break;
    }
  }

  /* ---------------------------- 音量 ---------------------------- */
  function setVolume(kind, v) {
    v = Math.max(0, Math.min(1, v));
    if (kind === 'master') { vol.master = v; if (master) master.gain.value = v; }
    else if (kind === 'bgm') { vol.bgm = v; if (bgmGain && state.timer) bgmGain.gain.value = v; }
    else if (kind === 'sfx') { vol.sfx = v; if (sfxGain) sfxGain.gain.value = v; }
    try { localStorage.setItem('sb_vol_' + kind, String(v)); } catch (e) {}
  }

  function loadVolume() {
    ['master', 'bgm', 'sfx'].forEach(function (k) {
      try {
        var v = localStorage.getItem('sb_vol_' + k);
        if (v !== null) vol[k] = Math.max(0, Math.min(1, parseFloat(v)));
      } catch (e) {}
    });
  }

  function toggle() {
    enabled = !enabled;
    if (!enabled) stopBgm(0.2);
    if (master) master.gain.value = enabled ? vol.master : 0;
    return enabled;
  }

  loadVolume();

  return {
    unlock: unlock,
    bgm: playBgm,
    stopBgm: stopBgm,
    sfx: sfx,
    setVolume: setVolume,
    volumes: function () { return { master: vol.master, bgm: vol.bgm, sfx: vol.sfx }; },
    toggle: toggle,
    enabled: function () { return enabled; },
    current: function () { return state.song; }
  };
})();
