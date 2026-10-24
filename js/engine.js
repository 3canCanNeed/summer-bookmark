/* ==========================================================================
   《夏日书签》引擎
   ========================================================================== */
window.GAME = (function () {
  'use strict';

  var STORY = window.STORY, ART = window.ART, AUDIO = window.AUDIO;
  var cast = STORY.cast, script = STORY.script, endings = STORY.endings;

  var SAVE_PREFIX = 'sb_save_';
  var END_KEY = 'sb_endings';
  var CFG_KEY = 'sb_config';
  var SLOTS = 6;
  var SILENT_OUT = 9;

  /* ---------------------------- 设置 ---------------------------- */
  var cfg = { speed: 28, autoGap: 1400, fullscreen: 0 };

  function loadCfg() {
    try {
      var raw = localStorage.getItem(CFG_KEY);
      if (raw) {
        var o = JSON.parse(raw);
        if (typeof o.speed === 'number') cfg.speed = o.speed;
        if (typeof o.autoGap === 'number') cfg.autoGap = o.autoGap;
        if (typeof o.fullscreen === 'number') cfg.fullscreen = o.fullscreen;
      }
    } catch (e) {}
  }
  function saveCfg() {
    try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) {}
  }

  /* ---------------------------- 已解锁结局 ---------------------------- */
  var unlocked = {};
  function loadUnlocked() {
    try {
      var raw = localStorage.getItem(END_KEY);
      if (raw) unlocked = JSON.parse(raw) || {};
    } catch (e) { unlocked = {}; }
  }
  function saveUnlocked() {
    try { localStorage.setItem(END_KEY, JSON.stringify(unlocked)); } catch (e) {}
  }
  function clearedCount() { return Object.keys(unlocked).length; }

  /* ---------------------------- 状态 ---------------------------- */
  var st = {
    pc: 0,
    bg: null, bgm: null, fx: null,
    chapter: ['', ''],
    onStage: {},
    lastSpeak: {},
    aff: { su: 0, lin: 0 },
    history: [],
    inGame: false,
    pending: null,      // 'text' | 'choice' | 'chapter' | 'ending' | null
    typing: false,
    auto: false,
    skip: false,
    uiHidden: false
  };

  var mounted = {};
  var typer = null;
  var typerFull = '';
  var typerCb = null;
  var autoTimer = null;
  var skipTimer = null;
  var bgToken = 0;
  var charCache = {};
  var saveMode = 'save';

  /* ---------------------------- 工具 ---------------------------- */
  function $(id) { return document.getElementById(id); }
  function qs(s, r) { return (r || document).querySelector(s); }
  function qsa(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function baseName(n) { return String(n || '').split('_')[0]; }

  function toast(msg, ms) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._tm);
    t._tm = setTimeout(function () { t.classList.remove('show'); }, ms || 1700);
  }

  function charSVGc(id, emo) {
    var k = id + '|' + emo;
    if (!charCache[k]) charCache[k] = ART.charSVG(id, emo);
    return charCache[k];
  }

  /* ---------------------------- 标题画面 ---------------------------- */
  function buildTitleDust() {
    var box = qs('.ta-dust');
    if (!box || box.childElementCount) return;
    for (var i = 0; i < 30; i++) {
      var s = document.createElement('i');
      var sz = 0.16 + Math.random() * 0.34;
      s.style.width = sz + 'vmin';
      s.style.height = sz + 'vmin';
      s.style.left = (Math.random() * 100) + '%';
      s.style.top = (86 + Math.random() * 22) + '%';
      s.style.animationDuration = (11 + Math.random() * 15) + 's';
      s.style.animationDelay = (-Math.random() * 26) + 's';
      box.appendChild(s);
    }
  }

  function showTitle() {
    st.inGame = false;
    st.pending = null;
    st.auto = false; st.skip = false;
    updateBadges();
    $('game-screen').classList.remove('show');
    $('ending-screen').classList.remove('show');
    $('title-screen').classList.add('show');
    AUDIO.bgm('quiet');
    var btn = qs('#title-screen [data-act="continue"]');
    if (btn) btn.disabled = !hasAnySave();
  }

  function hasAnySave() {
    for (var i = 0; i < SLOTS; i++) {
      if (localStorage.getItem(SAVE_PREFIX + i)) return true;
    }
    return false;
  }

  /* ---------------------------- 开始游戏 ---------------------------- */
  function newGame(fromLabel) {
    st.pc = 0;
    st.bg = null; st.bgm = null; st.fx = null;
    st.chapter = ['', ''];
    st.onStage = {};
    st.lastSpeak = {};
    st.aff = { su: 0, lin: 0 };
    st.history = [];
    st.inGame = true;
    st.auto = false; st.skip = false;
    mounted = {};
    $('char-layer').innerHTML = '';
    $('cg-layer').innerHTML = '';
    $('bg-layer').innerHTML = '';
    $('fx-layer').className = '';
    $('fx-layer').innerHTML = '';
    $('text').textContent = '';
    $('name-box').classList.remove('show');
    $('textbox').className = '';
    updateBadges();
    $('title-screen').classList.remove('show');
    $('ending-screen').classList.remove('show');
    $('game-screen').classList.add('show');
    if (cfg.fullscreen) goFullscreen(true);
    if (fromLabel) gotoLabel(fromLabel);
    advanceScript();
  }

  /* ---------------------------- 主循环 ---------------------------- */
  function advanceScript() {
    if (!st.inGame) return;
    var guard = 0;
    while (st.pc < script.length && guard++ < 20000) {
      var ins = script[st.pc];
      st.pc++;

      if (ins.label !== undefined) continue;

      if (ins.chapter) { showChapter(ins.chapter); return; }

      if (ins.bg !== undefined || ins.bgm !== undefined || ins.fx !== undefined) {
        if (ins.bg !== undefined) setBg(ins.bg);
        if (ins.fx !== undefined) setFx(ins.fx);
        if (ins.bgm !== undefined) setBgm(ins.bgm);
        if (ins.bg === undefined && ins.bgm === undefined && ins.fx === undefined) { /* noop */ }
        continue;
      }

      if (ins.sfx) { AUDIO.sfx(ins.sfx); continue; }
      if (ins.flash) { doFlash(ins.flash); continue; }
      if (ins.hide) { clearStage(); continue; }
      if (ins.cg !== undefined) { setCg(ins.cg); continue; }

      if (ins.c) { showChoices(ins.c); return; }
      if (ins.end) { doEnding(ins.end); return; }

      if (ins.j) {
        var ok = true;
        if (ins.if) { try { ok = !!ins.if(st); } catch (e) { ok = true; } }
        if (ok) gotoLabel(ins.j);
        continue;
      }

      if (ins.txt !== undefined || ins.s !== undefined || ins.me !== undefined || ins.msg !== undefined) {
        showLine(ins);
        return;
      }
    }
    if (st.pc >= script.length) {
      doEnding('true_end');
    }
  }

  function gotoLabel(name) {
    for (var i = 0; i < script.length; i++) {
      if (script[i].label === name) { st.pc = i + 1; return true; }
    }
    return false;
  }

  /* ---------------------------- 背景 / 特效 ---------------------------- */
  function setBg(name) {
    var prev = st.bg;
    st.bg = name;
    var el = $('bg-layer');
    el.innerHTML = ART.sceneSVG(name);
    el.classList.remove('swap');
    void el.offsetWidth;
    el.classList.add('swap');
    if (prev && baseName(prev) !== baseName(name)) {
      st.onStage = {};
      updateChars(null);
    }
  }

  function setCg(name) {
    var el = $('cg-layer');
    if (!name) { el.innerHTML = ''; return; }
    el.innerHTML = ART.sceneSVG(name);
    el.classList.remove('cgin');
    void el.offsetWidth;
    el.classList.add('cgin');
  }

  var FX_N = { dust: 40, sun: 26, wind: 16, firefly: 30, petal: 30 };

  function setFx(fx) {
    st.fx = fx;
    var el = $('fx-layer');
    el.className = '';
    el.innerHTML = '';
    if (!fx) return;
    el.className = 'fx-' + fx;
    var n = FX_N[fx] || 26;
    for (var i = 0; i < n; i++) {
      var p = document.createElement('span');
      p.className = 'p';
      var sz = fx === 'firefly' ? (0.45 + Math.random() * 0.7)
             : fx === 'petal' ? 1
             : (0.16 + Math.random() * 0.36);
      if (fx === 'wind') { sz = 1; }
      p.style.width = sz + 'vmin';
      p.style.height = sz + 'vmin';
      p.style.left = (Math.random() * 104 - 2) + '%';
      p.style.top = fx === 'petal' ? '-12%' : (Math.random() * 96) + '%';
      var dur = fx === 'wind' ? (7 + Math.random() * 9)
              : fx === 'firefly' ? (9 + Math.random() * 10)
              : (11 + Math.random() * 16);
      p.style.animationDuration = dur + 's';
      p.style.animationDelay = (-Math.random() * dur) + 's';
      p.style.setProperty('--dx', (Math.random() * 10 - 5) + 'vmin');
      p.style.setProperty('--dy', (Math.random() * 8 - 4) + 'vmin');
      p.style.setProperty('--dx2', (Math.random() * 10 - 5) + 'vmin');
      p.style.setProperty('--dy2', (-5 - Math.random() * 9) + 'vmin');
      el.appendChild(p);
    }
  }

  function doFlash(color) {
    var f = $('flash');
    f.style.background = color || '#fff';
    f.style.transition = 'none';
    f.style.opacity = '1';
    AUDIO.sfx('flash');
    void f.offsetWidth;
    f.style.transition = 'opacity 1.1s ease-out';
    f.style.opacity = '0';
    // 兜底：无头截图 / 后台标签页里 transition 可能不推进，1.3s 后强制归零
    clearTimeout(f._ft);
    f._ft = setTimeout(function () { f.style.transition = 'none'; f.style.opacity = '0'; }, 1300);
  }

  function setBgm(name) {
    st.bgm = name;
    if (!name) { AUDIO.stopBgm(0.6); return; }
    AUDIO.bgm(name);
  }

  /* ---------------------------- 章节卡 ---------------------------- */
  function showChapter(arr) {
    st.pending = 'chapter';
    st.chapter = arr.slice();
    var card = $('chapter-card');
    qs('.cc-num', card).textContent = arr[0] || '';
    qs('.cc-title', card).textContent = arr[1] || '';
    card.classList.remove('show');
    void card.offsetWidth;
    card.classList.add('show');
    AUDIO.sfx('page');
    setTimeout(function () {
      card.classList.remove('show');
      setTimeout(function () {
        st.pending = null;
        advanceScript();
      }, 700);
    }, 2100);
  }

  /* ---------------------------- 立绘 ---------------------------- */
  function clearStage() {
    st.onStage = {};
    updateChars(null);
  }

  function pruneStage(speaker) {
    var pc = st.pc;
    Object.keys(st.onStage).forEach(function (id) {
      if (id === speaker) return;
      var last = st.lastSpeak[id] || 0;
      if (pc - last > SILENT_OUT) delete st.onStage[id];
    });
  }

  function updateChars(speaker) {
    pruneStage(speaker);
    var layer = $('char-layer');
    var ids = ['su', 'lin'].filter(function (id) { return st.onStage[id]; });
    var n = ids.length;

    Object.keys(mounted).forEach(function (id) {
      if (ids.indexOf(id) < 0) {
        var el = mounted[id].el;
        el.classList.add('leaving');
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 520);
        delete mounted[id];
      }
    });

    ids.forEach(function (id, i) {
      var left = n === 1 ? 50 : (i === 0 ? 28 : 72);
      var emo = st.onStage[id];
      var m = mounted[id];
      if (!m) {
        var el = document.createElement('div');
        el.className = 'chara enter';
        el.setAttribute('data-id', id);
        el.innerHTML = '<div class="ci">' + charSVGc(id, emo) + '</div>';
        el.style.left = left + '%';
        layer.appendChild(el);
        mounted[id] = { el: el, emo: emo };
        (function (e) { setTimeout(function () { e.classList.remove('enter'); }, 620); })(el);
      } else {
        m.el.style.left = left + '%';
        if (m.emo !== emo) {
          qs('.ci', m.el).innerHTML = charSVGc(id, emo);
          m.emo = emo;
        }
      }
      var on = (n === 1) || (speaker === null || speaker === undefined) || (id === speaker);
      mounted[id].el.classList.toggle('on', on);
    });
  }

  /* ---------------------------- 文本 ---------------------------- */
  function clearTyper() {
    if (typer) { clearInterval(typer); typer = null; }
    st.typing = false;
  }

  function showLine(ins) {
    var box = $('textbox');
    var nameBox = $('name-box');
    var nameEl = $('name');
    var textEl = $('text');

    var name = '', text = '', cls = '', speaker = null, color = '';

    if (ins.s) {
      speaker = ins.s;
      var c = cast[speaker];
      name = c ? c.name : speaker;
      color = c ? c.color : '#a8c8f0';
      text = ins.t || '';
      cls = 'char';
      st.onStage[speaker] = ins.emo || 'normal';
      st.lastSpeak[speaker] = st.pc;
      updateChars(speaker);
    } else if (ins.me !== undefined) {
      name = '我';
      color = '#c8d4e6';
      text = ins.me;
      cls = 'me';
      updateChars(null);
    } else if (ins.msg !== undefined) {
      name = ins.msg;
      color = '#cfc6ae';
      text = ins.t || '';
      cls = 'msg';
      updateChars(null);
    } else {
      text = ins.txt || '';
      cls = 'narr';
      updateChars(null);
    }

    if (name) {
      nameEl.textContent = name;
      nameEl.style.color = color;
      nameBox.classList.add('show');
    } else {
      nameBox.classList.remove('show');
    }

    box.className = 'show ' + cls;
    st.pending = 'text';

    st.history.push({ name: name, text: text, cls: cls });
    if (st.history.length > 400) st.history.shift();

    typeOut(text, function () {
      $('next-ind').classList.add('show');
      scheduleAuto();
    });
  }

  function typeOut(text, cb) {
    var el = $('text');
    clearTyper();
    clearTimeout(autoTimer);
    clearTimeout(skipTimer);
    $('next-ind').classList.remove('show');
    typerFull = text;
    typerCb = cb;
    el.textContent = '';

    if (cfg.speed === 0 || st.skip) {
      el.textContent = text;
      if (cb) cb();
      return;
    }
    st.typing = true;
    var n = 0;
    var len = text.length;
    typer = setInterval(function () {
      n++;
      el.textContent = text.slice(0, n);
      if (n >= len) {
        clearTyper();
        if (cb) cb();
      }
    }, cfg.speed);
  }

  function finishTyping() {
    if (!typer && !st.typing) return false;
    clearTyper();
    $('text').textContent = typerFull;
    if (typerCb) typerCb();
    return true;
  }

  function scheduleAuto() {
    clearTimeout(autoTimer);
    clearTimeout(skipTimer);
    if (st.skip) {
      skipTimer = setTimeout(function () { if (st.skip) advance(); }, 45);
    } else if (st.auto) {
      autoTimer = setTimeout(function () { if (st.auto && st.pending === 'text') advance(); }, cfg.autoGap);
    }
  }

  /* ---------------------------- 推进 ---------------------------- */
  function advance() {
    if (!st.inGame) return;
    if (st.pending === 'choice' || st.pending === 'chapter' || st.pending === 'ending') return;

    if (st.typing) { finishTyping(); return; }
    if (st.pending !== 'text') return;

    st.pending = null;
    clearTimeout(autoTimer);
    clearTimeout(skipTimer);
    AUDIO.sfx('typing');
    advanceScript();
  }

  /* ---------------------------- 选项 ---------------------------- */
  function showChoices(list) {
    st.pending = 'choice';
    clearTimeout(autoTimer);
    var box = $('choices');
    box.innerHTML = '';
    box.classList.remove('show');
    void box.offsetWidth;

    var need = clearedCount();
    list.forEach(function (o, i) {
      var b = document.createElement('button');
      b.textContent = o.t;
      var locked = false;
      if (o.need && typeof o.need.cleared === 'number') locked = need < o.need.cleared;
      if (locked) b.classList.add('locked');
      b.style.transitionDelay = (i * 90) + 'ms';
      b.addEventListener('click', function (ev) {
        ev.stopPropagation();
        pickChoice(o, locked);
      });
      box.appendChild(b);
    });
    box.classList.add('show');
    AUDIO.sfx('select');
  }

  function pickChoice(o, locked) {
    if (locked) {
      toast('还差一点。有些东西得先看过，才知道该找什么。');
      return;
    }
    AUDIO.sfx('select');
    var box = $('choices');
    box.classList.remove('show');
    setTimeout(function () {
      box.innerHTML = '';
      if (o.aff) { for (var k in o.aff) st.aff[k] = (st.aff[k] || 0) + o.aff[k]; }
      st.pending = null;
      if (!gotoLabel(o.to)) { toast('分支丢失：' + o.to); return; }
      advanceScript();
    }, 280);
  }

  /* ---------------------------- 结局 ---------------------------- */
  function doEnding(id) {
    st.pending = 'ending';
    clearTimeout(autoTimer);
    clearTimeout(skipTimer);
    clearTyper();
    st.auto = false; st.skip = false;
    updateBadges();

    var e = endings[id] || { no: 'END', title: '结局', who: '', sub: '', desc: '', bg: 'sky_summer', color: '#ffd9a0' };
    var isNew = !unlocked[id];
    unlocked[id] = unlocked[id] || Date.now();
    saveUnlocked();

    AUDIO.stopBgm(1.2);
    setTimeout(function () { AUDIO.bgm(id === 'true_end' ? 'true' : 'sad'); }, 500);

    var scr = $('ending-screen');
    qs('.ed-bg', scr).innerHTML = ART.sceneSVG(e.bg || 'sky_summer');
    qs('.ed-no', scr).textContent = e.no || '';
    qs('.ed-title', scr).textContent = e.title || '';
    qs('.ed-sub', scr).textContent = e.sub || '';
    qs('.ed-desc', scr).textContent = e.desc || '';
    qs('.ed-stats', scr).innerHTML =
      (isNew ? '<b style="color:#ffd9a0">NEW</b> · ' : '') +
      '已解锁结局 ' + clearedCount() + ' / ' + Object.keys(endings).length;

    $('game-screen').classList.remove('show');
    scr.classList.add('show');
    $('textbox').classList.remove('show');
    $('title-screen').classList.remove('show');
  }

  /* ---------------------------- 面板 ---------------------------- */
  var openPanelName = null;

  function openPanel(name) {
    closePanel(true);
    openPanelName = name;
    $('shade').classList.add('show');
    var p = $('panel-' + name);
    if (!p) return;
    if (name === 'log') renderLog();
    if (name === 'save' || name === 'load') { saveMode = name; renderSave(); }
    if (name === 'gallery') renderGallery();
    if (name === 'config') syncConfig();
    p.classList.add('show');
  }

  function closePanel(quiet) {
    if (openPanelName) {
      var p = $('panel-' + openPanelName);
      if (p) p.classList.remove('show');
    }
    if (!quiet) $('shade').classList.remove('show');
    openPanelName = null;
  }

  function renderLog() {
    var box = $('log-body');
    box.innerHTML = '';
    if (!st.history.length) { box.innerHTML = '<p class="log-line"><span class="lt">还没有对话。</span></p>'; return; }
    st.history.forEach(function (h) {
      var d = document.createElement('div');
      d.className = 'log-line' + (h.cls === 'narr' ? ' narr' : '');
      if (h.name) {
        var nm = document.createElement('div');
        nm.className = 'ln';
        nm.textContent = h.name;
        d.appendChild(nm);
      }
      var tx = document.createElement('div');
      tx.className = 'lt';
      tx.textContent = h.text;
      d.appendChild(tx);
      box.appendChild(d);
    });
    setTimeout(function () { box.scrollTop = box.scrollHeight; }, 30);
  }

  function readSlot(i) {
    try {
      var raw = localStorage.getItem(SAVE_PREFIX + i);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function renderSave() {
    var box = $('save-body');
    var head = qs('#panel-save .sv-title');
    if (head) head.textContent = saveMode === 'save' ? '存档' : '读档';
    box.innerHTML = '';
    var grid = document.createElement('div');
    grid.className = 'save-grid';
    for (var i = 0; i < SLOTS; i++) {
      (function (idx) {
        var d = readSlot(idx);
        var card = document.createElement('button');
        card.className = 'save-card' + (d ? '' : ' empty');
        if (d) {
          card.innerHTML =
            '<div class="sc-no">SLOT ' + (idx + 1) + '</div>' +
            '<div class="sc-time">' + fmtTime(d.ts) + '</div>' +
            '<div class="sc-ch">' + esc(d.chapter && d.chapter[0] ? d.chapter[0] + ' · ' + d.chapter[1] : '未命名章节') + '</div>' +
            '<div class="sc-tx">' + esc((d.preview && d.preview.text) || '') + '</div>' +
            '<span class="sc-del" title="删除">×</span>';
          card.addEventListener('click', function (ev) {
            if (ev.target.classList.contains('sc-del')) {
              ev.stopPropagation();
              localStorage.removeItem(SAVE_PREFIX + idx);
              renderSave();
              toast('已删除存档 ' + (idx + 1));
              return;
            }
            if (saveMode === 'save') { doSave(idx); renderSave(); }
            else { doLoad(idx); }
          });
        } else {
          card.textContent = saveMode === 'save' ? '空 · 点击存档' : '空';
          if (saveMode === 'save') {
            card.addEventListener('click', function () { doSave(idx); renderSave(); });
          }
        }
        grid.appendChild(card);
      })(i);
    }
    box.appendChild(grid);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function fmtTime(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    function p(n) { return n < 10 ? '0' + n : '' + n; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  function doSave(i) {
    if (!st.inGame || st.pending === 'ending') { toast('现在不能存档'); return; }
    var snap = {
      ts: Date.now(),
      pc: st.pc,
      bg: st.bg, bgm: st.bgm, fx: st.fx,
      chapter: st.chapter.slice(),
      onStage: JSON.parse(JSON.stringify(st.onStage)),
      lastSpeak: JSON.parse(JSON.stringify(st.lastSpeak)),
      aff: { su: st.aff.su, lin: st.aff.lin },
      history: st.history.slice(-80),
      preview: {
        name: $('name').textContent || '',
        text: $('text').textContent || ''
      }
    };
    try {
      localStorage.setItem(SAVE_PREFIX + i, JSON.stringify(snap));
      toast('已存入 SLOT ' + (i + 1));
      AUDIO.sfx('page');
    } catch (e) { toast('存档失败：空间不足'); }
  }

  function doLoad(i) {
    var d = readSlot(i);
    if (!d) return;
    closePanel();
    st.pc = d.pc;
    st.bg = null; st.bgm = null; st.fx = null;
    st.chapter = (d.chapter || ['', '']).slice();
    st.onStage = d.onStage || {};
    st.lastSpeak = d.lastSpeak || {};
    st.aff = d.aff || { su: 0, lin: 0 };
    st.history = d.history || [];
    st.inGame = true;
    st.pending = null;
    st.auto = false; st.skip = false;
    mounted = {};
    $('char-layer').innerHTML = '';
    $('cg-layer').innerHTML = '';
    $('fx-layer').className = '';
    $('fx-layer').innerHTML = '';
    updateBadges();
    $('title-screen').classList.remove('show');
    $('ending-screen').classList.remove('show');
    $('game-screen').classList.add('show');

    if (d.bg) { $('bg-layer').innerHTML = ART.sceneSVG(d.bg); st.bg = d.bg; }
    if (d.fx) setFx(d.fx);
    if (d.bgm) { st.bgm = d.bgm; AUDIO.bgm(d.bgm); }
    updateChars(null);

    toast('已读入 SLOT ' + (i + 1));
    advanceScript();
  }

  function renderGallery() {
    var box = $('gallery-body');
    box.innerHTML = '';
    var grid = document.createElement('div');
    grid.className = 'gal-grid';
    var order = ['su_good', 'lin_good', 'su_bad', 'lin_bad', 'true_end'];
    order.forEach(function (id) {
      var e = endings[id];
      if (!e) return;
      var un = !!unlocked[id];
      var d = document.createElement('div');
      d.className = 'gal-card' + (un ? '' : ' locked');
      d.innerHTML =
        '<div class="gc-no">' + esc(e.no) + '</div>' +
        '<div class="gc-title">' + (un ? esc(e.title) : '？？？？') + '</div>' +
        '<div class="gc-who">' + esc(e.who) + '</div>' +
        (un ? '<div class="gc-desc">' + esc(e.desc) + '</div>' : '<div class="gc-lock">尚未抵达</div>');
      grid.appendChild(d);
    });
    box.appendChild(grid);
    var foot = document.createElement('p');
    foot.className = 'cfg-hint';
    foot.textContent = '共 ' + Object.keys(endings).length + ' 个结局，已解锁 ' + clearedCount() + ' 个。';
    box.appendChild(foot);
  }

  function syncConfig() {
    qsa('#panel-config input[data-vol]').forEach(function (inp) {
      var k = inp.getAttribute('data-vol');
      var v = Math.round(AUDIO.volumes()[k] * 100);
      inp.value = v;
      var sib = inp.parentNode.querySelector('.cfg-val');
      if (sib) sib.textContent = v;
    });
    qsa('#panel-config .seg[data-speed] button').forEach(function (b) {
      b.classList.toggle('on', Number(b.getAttribute('data-v')) === cfg.speed);
    });
    qsa('#panel-config .seg[data-auto] button').forEach(function (b) {
      b.classList.toggle('on', Number(b.getAttribute('data-v')) === cfg.autoGap);
    });
    qsa('#panel-config .seg[data-full] button').forEach(function (b) {
      b.classList.toggle('on', Number(b.getAttribute('data-v')) === cfg.fullscreen);
    });
  }

  /* ---------------------------- 存档备份跳转 ---------------------------- */
  function backToTitle() {
    closePanel();
    clearTyper();
    clearTimeout(autoTimer);
    clearTimeout(skipTimer);
    st.inGame = false;
    st.pending = null;
    clearStage();
    $('textbox').classList.remove('show');
    $('choices').classList.remove('show');
    showTitle();
  }

  /* ---------------------------- UI 辅助 ---------------------------- */
  function updateBadges() {
    $('badge-auto').classList.toggle('show', !!st.auto);
    $('badge-skip').classList.toggle('show', !!st.skip);
    var b1 = qs('#toolbar [data-t="auto"]');
    var b2 = qs('#toolbar [data-t="skip"]');
    if (b1) b1.classList.toggle('on', st.auto);
    if (b2) b2.classList.toggle('on', st.skip);
  }

  function toggleAuto() {
    st.auto = !st.auto;
    if (st.auto) {
      st.skip = false;
      if (st.pending === 'text' && !st.typing) scheduleAuto();
    } else {
      clearTimeout(autoTimer);
    }
    updateBadges();
  }

  function toggleSkip() {
    st.skip = !st.skip;
    if (st.skip) {
      st.auto = false;
      if (st.pending === 'text') {
        if (st.typing) { finishTyping(); }
        else scheduleAuto();
      }
    } else {
      clearTimeout(skipTimer);
    }
    updateBadges();
  }

  function toggleUI() {
    st.uiHidden = !st.uiHidden;
    $('game-screen').classList.toggle('hideui', st.uiHidden);
  }

  function goFullscreen(on) {
    try {
      if (on && !document.fullscreenElement) {
        (document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen || function () {}).call(document.documentElement);
      } else if (!on && document.fullscreenElement) {
        (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document);
      }
    } catch (e) {}
  }

  /* ---------------------------- 事件 ---------------------------- */
  function bind() {
    // 标题菜单
    qsa('#title-screen [data-act]').forEach(function (b) {
      b.addEventListener('click', function () {
        AUDIO.unlock();
        AUDIO.sfx('select');
        var act = b.getAttribute('data-act');
        if (act === 'new') newGame();
        else if (act === 'continue') openPanel('load');
        else if (act === 'gallery') openPanel('gallery');
        else if (act === 'config') openPanel('config');
      });
    });

    // 结局画面按钮
    qsa('#ending-screen [data-act]').forEach(function (b) {
      b.addEventListener('click', function () {
        AUDIO.sfx('select');
        var act = b.getAttribute('data-act');
        if (act === 'back-title') showTitle();
        else if (act === 'gallery') openPanel('gallery');
      });
    });

    // 工具栏
    qsa('#toolbar button').forEach(function (b) {
      b.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var t = b.getAttribute('data-t');
        AUDIO.sfx('click');
        if (t === 'log') openPanel('log');
        else if (t === 'auto') toggleAuto();
        else if (t === 'skip') toggleSkip();
        else if (t === 'save') openPanel('save');
        else if (t === 'load') openPanel('load');
        else if (t === 'config') openPanel('config');
        else if (t === 'menu') backToTitle();
      });
    });

    // 关闭面板
    qsa('.panel .x, .panel [data-close]').forEach(function (b) {
      b.addEventListener('click', function () { AUDIO.sfx('click'); closePanel(); });
    });
    $('shade').addEventListener('click', function () { closePanel(); });

    // 点击推进
    $('game-screen').addEventListener('click', function (ev) {
      if (ev.target.closest('#toolbar')) return;
      if (ev.target.closest('#choices')) return;
      if (openPanelName) return;
      if (st.skip || st.auto) return;
      advance();
    });

    // 右键 / 滚轮
    $('game-screen').addEventListener('contextmenu', function (ev) {
      ev.preventDefault();
      toggleUI();
    });
    $('game-screen').addEventListener('wheel', function (ev) {
      if (ev.deltaY < 0 && st.inGame) { ev.preventDefault(); openPanel('log'); }
    }, { passive: false });

    // 键盘
    window.addEventListener('keydown', function (ev) {
      var tag = (ev.target && ev.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      if (ev.key === ' ' || ev.key === 'Enter') {
        ev.preventDefault();
        if (openPanelName) return;
        if (st.pending === 'text') advance();
        else if (!st.inGame) { AUDIO.unlock(); newGame(); }
      } else if (ev.key === 'Escape') {
        if (openPanelName) closePanel();
        else if (st.inGame) openPanel('log');
      } else if (ev.key === 'Control') {
        if (st.inGame && st.pending === 'text' && !st.skip) toggleSkip();
      } else if (ev.key === 'h' || ev.key === 'H') {
        toggleUI();
      }
    });
    window.addEventListener('keyup', function (ev) {
      if (ev.key === 'Control' && st.skip) toggleSkip();
    });

    // 设置项
    qsa('#panel-config input[data-vol]').forEach(function (inp) {
      inp.addEventListener('input', function () {
        var k = inp.getAttribute('data-vol');
        var v = Number(inp.value) / 100;
        AUDIO.setVolume(k, v);
        var sib = inp.parentNode.querySelector('.cfg-val');
        if (sib) sib.textContent = inp.value;
      });
    });

    qsa('#panel-config .seg[data-speed] button').forEach(function (b) {
      b.addEventListener('click', function () {
        cfg.speed = Number(b.getAttribute('data-v'));
        saveCfg(); syncConfig(); AUDIO.sfx('click');
      });
    });
    qsa('#panel-config .seg[data-auto] button').forEach(function (b) {
      b.addEventListener('click', function () {
        cfg.autoGap = Number(b.getAttribute('data-v'));
        saveCfg(); syncConfig(); AUDIO.sfx('click');
      });
    });
    qsa('#panel-config .seg[data-full] button').forEach(function (b) {
      b.addEventListener('click', function () {
        cfg.fullscreen = Number(b.getAttribute('data-v'));
        saveCfg(); syncConfig();
        goFullscreen(!!cfg.fullscreen);
        AUDIO.sfx('click');
      });
    });
    qsa('#panel-config [data-clear]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-clear');
        if (k === 'save') {
          for (var i = 0; i < SLOTS; i++) localStorage.removeItem(SAVE_PREFIX + i);
          toast('存档已清除');
        } else {
          for (var j = 0; j < SLOTS; j++) localStorage.removeItem(SAVE_PREFIX + j);
          localStorage.removeItem(END_KEY);
          localStorage.removeItem(CFG_KEY);
          unlocked = {};
          toast('全部数据已清除');
        }
        AUDIO.sfx('click');
      });
    });

    // 首次交互解锁音频
    ['pointerdown', 'keydown'].forEach(function (e) {
      window.addEventListener(e, function once() {
        AUDIO.unlock();
        window.removeEventListener(e, once);
      });
    });
  }

  /* ---------------------------- 启动 ---------------------------- */
  function mountTitleChara() {
    var photo = document.querySelector('.ta-photo');
    if (photo && window.BG && window.BG.title) photo.src = window.BG.title;
    var host = document.querySelector('.t-chara');
    if (!host) return;
    var set = window.ASSETS && window.ASSETS.su;
    var src = set && (set.calm || set.smile || set.sad);
    if (!src) return;
    host.innerHTML = '<img src="' + src + '" alt="" draggable="false">';
  }

  function init() {
    loadCfg();
    loadUnlocked();
    buildTitleDust();
    mountTitleChara();
    bind();
    showTitle();

    // CC-BY 音乐署名（有外部音乐文件时才显示）
    var creditEl = qs('#music-credit');
    if (creditEl && window.BGM_CREDITS && window.BGM_CREDITS.length) {
      var seenC = {};
      var rowsC = [];
      window.BGM_CREDITS.forEach(function (c) {
        var keyC = c.title + c.author;
        if (seenC[keyC]) return;
        seenC[keyC] = 1;
        rowsC.push('“' + c.title + '” by ' + c.author + ' (' + c.license + ')');
      });
      creditEl.textContent = 'BGM: ' + rowsC.join('   ·   ');
    }
    // 调试入口：window.__DEBUG_JUMP='label' + window.__DEBUG_STEPS=N，或 ?d=N / #d=N
    var q = (location.search || '') + '&' + (location.hash || '');
    var dm = /[?&#]d=(\d+)/.exec(q);
    var jm = /[?&#]jump=([\w]+)/.exec(q);
    var dj = window.__DEBUG_JUMP || (jm ? jm[1] : null);
    var dn = (typeof window.__DEBUG_STEPS === 'number') ? window.__DEBUG_STEPS
           : (dm ? Number(dm[1]) : null);
    if (dj || dn) {
      cfg.speed = 0;
      setTimeout(function () {
        newGame(dj || null);
        var n = dn === null ? 4 : dn;
        var i = 0;
        var tm = setInterval(function () {
          if (i++ >= n) { clearInterval(tm); return; }
          advance();
        }, 240);
      }, 140);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    state: st,
    newGame: newGame,
    advance: advance,
    openPanel: openPanel,
    closePanel: closePanel
  };
})();
