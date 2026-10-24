/* ==========================================================================
   《夏日书签》 美术：SVG 立绘 + 场景背景
   ========================================================================== */
window.ART = (function () {
  'use strict';

  /* ---------------------------- 配色 ---------------------------- */
  const PALETTE = {
    su: {
      skin:  ['#fff1ea', '#f2d3c6'],
      skinD: '#e3b9a9',
      hair:  ['#3c4566', '#171b2a'],
      hairHi:'#7d8cb5',
      hair2: ['#333c5a', '#12151f'],
      iris:  ['#bfe0ff', '#5f89b8'],
      irisD: '#2d4a6c',
      lash:  '#1a1e2c',
      cloth: '#f6f4ef',
      clothS:'#dcd8cf',
      cloth2:'#33405e',
      cloth2S:'#202a42',
      accent:'#9dc0e8',
      ribbon:'#7f9cc4',
      blush: 'rgba(232,140,140,.42)'
    },
    lin: {
      skin:  ['#fff3ec', '#f4d8ca'],
      skinD: '#e6bdab',
      hair:  ['#b57c47', '#6a4223'],
      hairHi:'#e0ab73',
      hair2: ['#a06c3c', '#55341b'],
      iris:  ['#ffe0a8', '#e09a3e'],
      irisD: '#8f5417',
      lash:  '#3a2416',
      cloth: '#faf6ec',
      clothS:'#e2dccb',
      cloth2:'#f2a04e',
      cloth2S:'#c97b2f',
      accent:'#ff9a3c',
      ribbon:'#ff8f3a',
      blush: 'rgba(240,150,120,.45)'
    }
  };

  /* ---------------------------- 表情 ---------------------------- */
  // 返回 {eye, browL, browR, mouth, blush, extra} 的绘制片段
  function face(emo, c, id) {
    const p = PALETTE[id];
    const L = { x: 133, y: 141 }, R = { x: 187, y: 141 };
    const lash = p.lash;
    let eyeL, eyeR, browL, browR, mouth, blush = 0, extra = '';

    // ---- 眼睛基元 ----
    const openEye = (cx, cy, rx = 13.5, ry = 15.5, squint = 0) => {
      const oy = squint; // 上眼睑下压量
      return `
        <clipPath id="ec${id}${cx}"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/></clipPath>
        <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fffdfb"/>
        <g clip-path="url(#ec${id}${cx})">
          <ellipse cx="${cx}" cy="${cy + 1 + oy * .3}" rx="${rx * .92}" ry="${ry * .95}" fill="url(#iris-${id})"/>
          <ellipse cx="${cx}" cy="${cy + 2}" rx="${rx * .46}" ry="${ry * .5}" fill="${p.irisD}"/>
          <ellipse cx="${cx}" cy="${cy - ry * .34}" rx="${rx * .78}" ry="${ry * .3}" fill="#fff" opacity=".14"/>
          <circle cx="${cx - rx * .36}" cy="${cy - ry * .3}" r="${rx * .3}" fill="#fff" opacity=".92"/>
          <circle cx="${cx + rx * .34}" cy="${cy + ry * .42}" r="${rx * .15}" fill="#fff" opacity=".6"/>
          <ellipse cx="${cx}" cy="${cy - ry * .92}" rx="${rx * 1.1}" ry="${ry * .42}" fill="${lash}" opacity=".95"/>
        </g>
        <path d="M ${cx - rx - .5} ${cy - ry * .62} Q ${cx} ${cy - ry * 1.28} ${cx + rx + .5} ${cy - ry * .62}"
              fill="none" stroke="${lash}" stroke-width="4.2" stroke-linecap="round"/>
        <path d="M ${cx - rx - .5} ${cy - ry * .62} l -3.4 3" stroke="${lash}" stroke-width="3" stroke-linecap="round" opacity=".9"/>
        <path d="M ${cx + rx + .5} ${cy - ry * .62} l 3.4 3" stroke="${lash}" stroke-width="3" stroke-linecap="round" opacity=".9"/>
      `;
    };

    const closedEye = (cx, cy, dir = 1) => `
      <path d="M ${cx - 15} ${cy + 1} Q ${cx} ${cy - 13} ${cx + 15} ${cy + 1}"
            fill="none" stroke="${lash}" stroke-width="4" stroke-linecap="round"/>
      <path d="M ${cx - 15} ${cy + 1} l -3 ${dir > 0 ? 3 : 2.4}" stroke="${lash}" stroke-width="3" stroke-linecap="round"/>
    `;

    const closedEyeDown = (cx, cy) => `
      <path d="M ${cx - 15} ${cy - 2} Q ${cx} ${cy + 11} ${cx + 15} ${cy - 2}"
            fill="none" stroke="${lash}" stroke-width="4" stroke-linecap="round"/>
    `;

    const halfEye = (cx, cy) => `
      <clipPath id="ec${id}${cx}h"><ellipse cx="${cx}" cy="${cy}" rx="13.5" ry="15.5"/></clipPath>
      <ellipse cx="${cx}" cy="${cy}" rx="13.5" ry="15.5" fill="#fffdfb"/>
      <g clip-path="url(#ec${id}${cx}h)">
        <ellipse cx="${cx}" cy="${cy + 3}" rx="12.5" ry="14.5" fill="url(#iris-${id})"/>
        <ellipse cx="${cx}" cy="${cy + 4}" rx="6.2" ry="7.8" fill="${p.irisD}"/>
        <circle cx="${cx - 5}" cy="${cy - 2}" r="4" fill="#fff" opacity=".9"/>
        <rect x="${cx - 16}" y="${cy - 17}" width="32" height="15" fill="#f9ece4"/>
      </g>
      <path d="M ${cx - 14} ${cy - 2} Q ${cx} ${cy + 6} ${cx + 14} ${cy - 2}"
            fill="none" stroke="${lash}" stroke-width="4" stroke-linecap="round"/>
    `;

    switch (emo) {
      case 'smile':
        eyeL = closedEye(L.x, L.y, -1); eyeR = closedEye(R.x, R.y, 1);
        browL = `<path d="M 118 116 Q 133 109 148 115" stroke="${p.hair2[1]}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>`;
        browR = `<path d="M 172 115 Q 187 109 202 116" stroke="${p.hair2[1]}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>`;
        mouth = `<path d="M 152 181 Q 160 189 168 181" fill="none" stroke="#c26a63" stroke-width="2.6" stroke-linecap="round"/>`;
        blush = 1; break;
      case 'grin':
        eyeL = closedEye(L.x, L.y - 1, -1); eyeR = closedEye(R.x, R.y - 1, 1);
        browL = `<path d="M 118 114 Q 133 107 148 113" stroke="${p.hair2[1]}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
        browR = `<path d="M 172 113 Q 187 107 202 114" stroke="${p.hair2[1]}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
        mouth = `<path d="M 148 177 Q 160 194 172 177 Q 160 181 148 177 Z" fill="#b8554f"/>
                 <path d="M 152 186 Q 160 191 168 186 Q 160 189 152 186 Z" fill="#e88d86" opacity=".9"/>`;
        blush = 1; break;
      case 'cry':
        eyeL = halfEye(L.x, L.y); eyeR = halfEye(R.x, R.y);
        browL = `<path d="M 118 119 Q 133 108 147 119" stroke="${p.hair2[1]}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
        browR = `<path d="M 173 119 Q 187 108 202 119" stroke="${p.hair2[1]}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
        mouth = `<path d="M 150 180 Q 160 176 170 180 Q 166 188 160 188 Q 154 188 150 180 Z" fill="#c96a63"/>`;
        blush = 1;
        extra = `<path d="M 126 156 q -4 14 1 22 q 6 -8 -1 -22 Z" fill="#a9d8f5" opacity=".85"/>
                 <path d="M 194 156 q 4 14 -1 22 q -6 -8 1 -22 Z" fill="#a9d8f5" opacity=".85"/>`;
        break;
      case 'sad':
        eyeL = openEye(L.x, L.y, 13, 14.5, 1); eyeR = openEye(R.x, R.y, 13, 14.5, 1);
        browL = `<path d="M 117 117 Q 132 110 148 121" stroke="${p.hair2[1]}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
        browR = `<path d="M 172 121 Q 188 110 203 117" stroke="${p.hair2[1]}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
        mouth = `<path d="M 152 183 Q 160 178 168 183" fill="none" stroke="#c26a63" stroke-width="2.4" stroke-linecap="round"/>`;
        break;
      case 'surp':
        eyeL = openEye(L.x, L.y, 14.5, 17); eyeR = openEye(R.x, R.y, 14.5, 17);
        browL = `<path d="M 117 108 Q 133 101 149 108" stroke="${p.hair2[1]}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
        browR = `<path d="M 171 108 Q 187 101 203 108" stroke="${p.hair2[1]}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
        mouth = `<ellipse cx="160" cy="182" rx="6" ry="8" fill="#b8554f"/>`;
        break;
      case 'pout':
        eyeL = halfEye(L.x, L.y); eyeR = halfEye(R.x, R.y);
        browL = `<path d="M 118 114 Q 133 112 148 119" stroke="${p.hair2[1]}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
        browR = `<path d="M 172 119 Q 187 112 202 114" stroke="${p.hair2[1]}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
        mouth = `<path d="M 151 180 Q 160 187 169 180" fill="none" stroke="#c26a63" stroke-width="2.8" stroke-linecap="round"/>
                 <path d="M 151 180 Q 160 174 169 180" fill="none" stroke="#e0928b" stroke-width="2" stroke-linecap="round" opacity=".7"/>`;
        blush = 1; break;
      case 'blush':
        eyeL = halfEye(L.x, L.y + 1); eyeR = halfEye(R.x, R.y + 1);
        browL = `<path d="M 118 120 Q 133 115 148 120" stroke="${p.hair2[1]}" stroke-width="2.8" fill="none" stroke-linecap="round" opacity=".7"/>`;
        browR = `<path d="M 172 120 Q 187 115 202 120" stroke="${p.hair2[1]}" stroke-width="2.8" fill="none" stroke-linecap="round" opacity=".7"/>`;
        mouth = `<path d="M 153 181 Q 160 185 167 181" fill="none" stroke="#c26a63" stroke-width="2.4" stroke-linecap="round"/>`;
        blush = 2;
        extra = `<path d="M 208 118 q -3 8 1 13 q 4 -5 -1 -13 Z" fill="#a9d8f5" opacity=".8"/>`;
        break;
      case 'conf':
        eyeL = openEye(L.x, L.y, 13.5, 15); eyeR = halfEye(R.x, R.y);
        browL = `<path d="M 117 112 Q 133 104 149 112" stroke="${p.hair2[1]}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
        browR = `<path d="M 172 116 Q 187 112 202 118" stroke="${p.hair2[1]}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
        mouth = `<path d="M 150 182 Q 160 178 170 183" fill="none" stroke="#c26a63" stroke-width="2.4" stroke-linecap="round"/>`;
        extra = `<path d="M 206 106 q 3 7 -1 11 q -4 -4 1 -11 Z" fill="#a9d8f5" opacity=".75"/>`;
        break;
      case 'sharp':
        eyeL = openEye(L.x, L.y - 1, 13.5, 13.5, 1); eyeR = openEye(R.x, R.y - 1, 13.5, 13.5, 1);
        browL = `<path d="M 116 118 L 149 110" stroke="${p.hair2[1]}" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".9"/>`;
        browR = `<path d="M 171 110 L 204 118" stroke="${p.hair2[1]}" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".9"/>`;
        mouth = `<path d="M 153 182 L 167 182" stroke="#c26a63" stroke-width="2.4" stroke-linecap="round"/>`;
        break;
      case 'normal':
      case 'calm':
      default:
        eyeL = openEye(L.x, L.y, 13.5, 14.5, emo === 'calm' ? 1.5 : 0);
        eyeR = openEye(R.x, R.y, 13.5, 14.5, emo === 'calm' ? 1.5 : 0);
        browL = `<path d="M 118 116 Q 133 111 148 116" stroke="${p.hair2[1]}" stroke-width="2.8" fill="none" stroke-linecap="round" opacity=".75"/>`;
        browR = `<path d="M 172 116 Q 187 111 202 116" stroke="${p.hair2[1]}" stroke-width="2.8" fill="none" stroke-linecap="round" opacity=".75"/>`;
        mouth = `<path d="M 154 181 Q 160 184 166 181" fill="none" stroke="#c26a63" stroke-width="2.4" stroke-linecap="round"/>`;
        break;
    }

    return { eyeL, eyeR, browL, browR, mouth, blush, extra };
  }

  /* ---------------------------- 立绘 ---------------------------- */
  /* 优先使用由 Agnes 生成并抠图的真人立绘；缺表情时映射到最接近的已有表情 */
  var EMO_FALLBACK = {
    su:  { normal: 'calm', grin: 'smile', cry: 'sad', pout: 'sad', conf: 'calm', sharp: 'calm', surp: 'calm', blush: 'smile' },
    lin: { calm: 'normal', blush: 'smile', grin: 'normal', surp: 'normal', pout: 'sad', cry: 'sad', conf: 'sad', smile: 'normal' }
  };

  function pickAsset(id, emo) {
    var set = window.ASSETS && window.ASSETS[id];
    if (!set) return null;
    if (set[emo]) return set[emo];
    var fb = (EMO_FALLBACK[id] || {})[emo];
    if (fb && set[fb]) return set[fb];
    return set.calm || set.normal || set.smile || null;
  }

  function charSVG(id, emo) {
    var asset = pickAsset(id, emo || 'normal');
    if (asset) return '<img class="ci-img" src="' + asset + '" alt="" draggable="false">';

    const p = PALETTE[id] || PALETTE.su;
    const f = face(emo || 'normal', p, id);
    const isSu = id === 'su';
    const H = `url(#hair-${id})`, H2 = `url(#hair2-${id})`;

    const blushMark = (cx, cy) => `
      <g opacity="${f.blush === 2 ? .95 : .68}">
        <ellipse cx="${cx}" cy="${cy}" rx="18" ry="9" fill="url(#blush-${id})"/>
        <path d="M ${cx - 10} ${cy - 2} l 4 -4 M ${cx - 3} ${cy + 2} l 4 -4 M ${cx + 4} ${cy - 1} l 4 -4"
              stroke="#e08a86" stroke-width="1.6" stroke-linecap="round" opacity=".5"/>
      </g>`;

    /* ---- 后发 ---- */
    const backHair = isSu ? `
      <path d="M 160 42 C 104 42 76 88 76 146
               C 76 184 70 254 64 322 C 60 370 58 398 60 414
               C 76 424 94 426 106 420
               C 102 366 104 306 110 254
               L 210 254
               C 216 306 218 366 214 420
               C 226 426 244 424 260 414
               C 262 398 260 370 256 322
               C 250 254 244 184 244 146 C 244 88 216 42 160 42 Z" fill="${H}"/>
      <path d="M 100 130 C 94 200 90 290 88 360" stroke="${p.hairHi}" stroke-width="9"
            fill="none" opacity=".1" stroke-linecap="round"/>
      <path d="M 220 130 C 226 200 230 290 232 360" stroke="${p.hairHi}" stroke-width="9"
            fill="none" opacity=".1" stroke-linecap="round"/>
    ` : `
      <path d="M 160 42 C 106 42 80 86 80 140
               C 80 178 76 216 72 250 C 74 262 78 270 84 274
               C 92 260 98 240 102 220
               L 218 220
               C 222 240 228 260 236 274 C 242 270 246 262 248 250
               C 244 216 240 178 240 140 C 240 86 214 42 160 42 Z" fill="${H}"/>
      <path d="M 102 120 C 98 170 96 210 96 244" stroke="${p.hairHi}" stroke-width="8"
            fill="none" opacity=".12" stroke-linecap="round"/>
    `;

    /* ---- 身体 ---- */
    const body = isSu ? `
      <path d="M 160 232 C 136 232 112 240 96 254 C 86 266 82 292 82 318
               C 82 342 88 364 94 388 C 90 422 88 450 88 480 L 232 480
               C 232 450 230 422 226 388 C 232 364 238 342 238 318
               C 238 292 234 266 224 254 C 208 240 184 232 160 232 Z" fill="url(#cloth-${id})"/>
      <path d="M 96 254 C 84 268 76 294 74 324 C 72 380 72 430 72 480 L 112 480
               C 110 424 112 356 122 292 Z" fill="${p.clothS}"/>
      <path d="M 224 254 C 236 268 244 294 246 324 C 248 380 248 430 248 480 L 208 480
               C 210 424 208 356 198 292 Z" fill="${p.clothS}"/>
      <path d="M 100 250 C 116 240 137 234 160 234 C 183 234 204 240 220 250
               C 222 300 223 350 224 388 C 226 422 227 450 228 480 L 92 480
               C 93 450 94 422 96 388 C 97 350 98 300 100 250 Z" fill="url(#cloth2-${id})"/>
      <path d="M 128 246 L 160 296 L 192 246 C 182 240 171 237 160 237
               C 149 237 138 240 128 246 Z" fill="url(#cloth-${id})"/>
      <path d="M 126 245 L 160 298 L 194 245" stroke="${p.cloth2S}" stroke-width="2.4"
            fill="none" opacity=".7"/>
      <path d="M 160 250 l -15 -8 l 3 13 l -3 13 l 15 -8 Z" fill="${p.ribbon}"/>
      <path d="M 160 250 l 15 -8 l -3 13 l 3 13 l -15 -8 Z" fill="${p.ribbon}"/>
      <path d="M 160 250 l -15 -8 l 3 13 Z" fill="${p.cloth2S}" opacity=".35"/>
      <path d="M 160 250 l 15 -8 l -3 13 Z" fill="${p.cloth2S}" opacity=".35"/>
      <circle cx="160" cy="250" r="4.2" fill="${p.ribbon}"/>
      <path d="M 118 330 C 116 380 116 430 118 480" stroke="${p.cloth2S}" stroke-width="2.4"
            fill="none" opacity=".3"/>
      <path d="M 202 330 C 204 380 204 430 202 480" stroke="${p.cloth2S}" stroke-width="2.4"
            fill="none" opacity=".3"/>
      <path d="M 160 340 L 160 480" stroke="${p.cloth2S}" stroke-width="2" opacity=".18"/>
    ` : `
      <path d="M 160 232 C 136 232 112 240 96 254 C 86 266 82 292 82 318
               C 82 342 88 364 94 388 C 90 422 88 450 88 480 L 232 480
               C 232 450 230 422 226 388 C 232 364 238 342 238 318
               C 238 292 234 266 224 254 C 208 240 184 232 160 232 Z" fill="url(#cloth-${id})"/>
      <path d="M 96 254 C 84 268 76 294 74 324 C 72 380 72 430 72 480 L 112 480
               C 110 424 112 356 122 292 Z" fill="${p.clothS}"/>
      <path d="M 224 254 C 236 268 244 294 246 324 C 248 380 248 430 248 480 L 208 480
               C 210 424 208 356 198 292 Z" fill="${p.clothS}"/>
      <path d="M 96 254 C 84 268 78 292 76 318 L 108 324 C 112 294 118 272 126 262 Z"
            fill="url(#cloth2-${id})"/>
      <path d="M 224 254 C 236 268 242 292 244 318 L 212 324 C 208 294 202 272 194 262 Z"
            fill="url(#cloth2-${id})"/>
      <path d="M 160 236 C 140 236 122 242 110 253 L 101 286 L 160 322 L 219 286 L 210 253
               C 198 242 180 236 160 236 Z" fill="url(#cloth2-${id})"/>
      <path d="M 160 314 C 146 300 134 284 128 272 C 138 258 148 250 160 250
               C 172 250 182 258 192 272 C 186 284 174 300 160 314 Z" fill="url(#cloth-${id})"/>
      <path d="M 106 256 L 160 320 L 214 256" stroke="#ffffff" stroke-width="2.6"
            fill="none" opacity=".85"/>
      <path d="M 101 286 L 160 322 L 219 286" stroke="#ffffff" stroke-width="1.8"
            fill="none" opacity=".4"/>
      <path d="M 150 256 L 170 256 L 160 280 Z" fill="${p.accent}"/>
      <path d="M 154 258 L 166 258 L 160 274 Z" fill="${p.cloth2S}" opacity=".4"/>
      <path d="M 156 278 L 164 278 L 165 302 L 160 296 L 155 302 Z" fill="${p.accent}" opacity=".9"/>
      <path d="M 94 330 C 92 380 92 430 94 480" stroke="${p.clothS}" stroke-width="3"
            fill="none" opacity=".9"/>
      <path d="M 226 330 C 228 380 228 430 226 480" stroke="${p.clothS}" stroke-width="3"
            fill="none" opacity=".9"/>
    `;

    /* ---- 前发（实心一片，下沿全部停在 y<=122，眼睛中心 y=141） ---- */
    const frontHair = isSu ? `
      <path d="M 82 132 C 82 72 114 38 160 38 C 206 38 238 72 238 132
               C 234 112 227 103 217 99
               C 201 93 182 91 160 91
               C 138 91 119 95 103 103
               C 93 109 86 120 82 132 Z" fill="${H}"/>
      <path d="M 92 88 C 86 128 84 174 86 212 C 88 220 94 224 101 220
               C 97 180 99 132 104 98 Z" fill="${H}"/>
      <path d="M 228 88 C 234 128 236 174 234 212 C 232 220 226 224 219 220
               C 223 180 221 132 216 98 Z" fill="${H}"/>
      <path d="M 214 102 C 208 90 198 80 186 74 C 198 86 206 96 210 108 Z"
            fill="${H2}" opacity=".5"/>
      <path d="M 120 74 C 150 60 182 61 208 78" stroke="${p.hairHi}" stroke-width="4"
            fill="none" opacity=".2" stroke-linecap="round"/>
      <path d="M 96 104 C 93 113 91 120 87 126 C 93 121 98 114 101 106 Z" fill="${H}"/>
      <path d="M 224 104 C 227 113 229 120 233 126 C 227 121 222 114 219 106 Z" fill="${H}"/>
    ` : `
      <path d="M 82 132 C 82 72 114 38 160 38 C 206 38 238 72 238 132
               C 234 114 227 105 217 101
               C 201 95 182 93 160 93
               C 140 93 122 97 106 105
               C 95 111 87 121 82 132 Z" fill="${H}"/>
      <path d="M 92 88 C 88 128 88 168 92 200 C 95 208 101 211 108 208
               C 102 172 102 132 106 98 Z" fill="${H}"/>
      <path d="M 228 88 C 232 128 232 168 228 200 C 225 208 219 211 212 208
               C 218 172 218 132 214 98 Z" fill="${H}"/>
      <path d="M 214 102 C 206 92 196 86 186 84 C 198 92 206 100 210 110 Z"
            fill="${H2}" opacity=".45"/>
      <path d="M 150 44 C 152 22 168 8 188 10 C 178 20 166 30 164 46 Z" fill="${H}"/>
      <path d="M 158 30 C 168 20 176 14 182 12" stroke="${p.hairHi}" stroke-width="2.2"
            fill="none" opacity=".35" stroke-linecap="round"/>
      <path d="M 118 72 C 148 60 178 61 204 76" stroke="${p.hairHi}" stroke-width="4.2"
            fill="none" opacity=".24" stroke-linecap="round"/>
      <path d="M 96 106 C 93 114 91 120 88 125 C 93 121 97 114 100 108 Z" fill="${H}"/>
      <path d="M 224 106 C 227 114 229 120 232 125 C 227 121 223 114 220 108 Z" fill="${H}"/>
      <path d="M 158 100 C 156 110 154 116 150 120 C 156 115 160 108 162 100 Z" fill="${H}"/>
    `;

    /* ---- 配饰 ---- */
    const accessory = isSu ? `
      <g transform="translate(96,101) rotate(-24)">
        <rect x="-9" y="-3" width="18" height="6" rx="3" fill="#eef4fc" stroke="#9db4d0" stroke-width="1"/>
        <rect x="-5" y="-1.2" width="10" height="2.4" rx="1.2" fill="#c2d5ea"/>
        <circle cx="-6.5" cy="0" r="1" fill="#ffffff" opacity=".9"/>
      </g>
    ` : `
      <g transform="translate(216,100) rotate(20)">
        <rect x="-8" y="-2.8" width="16" height="5.6" rx="2.8" fill="${p.accent}" stroke="${p.cloth2S}" stroke-width="1"/>
        <rect x="-4.5" y="-1.1" width="9" height="2.2" rx="1.1" fill="#ffd6a8" opacity=".85"/>
        <circle cx="-6" cy="0" r="0.9" fill="#ffffff" opacity=".9"/>
      </g>
    `;

    return `
<svg viewBox="0 0 320 480" xmlns="http://www.w3.org/2000/svg" class="chara-svg" preserveAspectRatio="xMidYMax meet">
  <defs>
    <linearGradient id="hair-${id}" x1="0" y1="0" x2=".3" y2="1">
      <stop offset="0" stop-color="${p.hair[0]}"/><stop offset="1" stop-color="${p.hair[1]}"/>
    </linearGradient>
    <linearGradient id="hair2-${id}" x1="0" y1="0" x2=".4" y2=".9">
      <stop offset="0" stop-color="${p.hair2[0]}"/><stop offset="1" stop-color="${p.hair2[1]}"/>
    </linearGradient>
    <linearGradient id="iris-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.iris[1]}"/>
      <stop offset=".55" stop-color="${p.iris[0]}"/>
      <stop offset="1" stop-color="${p.iris[1]}"/>
    </linearGradient>
    <linearGradient id="skin-${id}" x1="0" y1="0" x2=".2" y2="1">
      <stop offset="0" stop-color="${p.skin[0]}"/><stop offset="1" stop-color="${p.skin[1]}"/>
    </linearGradient>
    <linearGradient id="cloth-${id}" x1="0" y1="0" x2=".3" y2="1">
      <stop offset="0" stop-color="${p.cloth}"/><stop offset="1" stop-color="${p.clothS}"/>
    </linearGradient>
    <linearGradient id="cloth2-${id}" x1="0" y1="0" x2=".3" y2="1">
      <stop offset="0" stop-color="${p.cloth2}"/><stop offset="1" stop-color="${p.cloth2S}"/>
    </linearGradient>
    <radialGradient id="blush-${id}" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="${p.blush}"/><stop offset="1" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
    <radialGradient id="halo-${id}" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="${p.accent}" stop-opacity=".3"/>
      <stop offset="1" stop-color="${p.accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <ellipse cx="160" cy="200" rx="150" ry="190" fill="url(#halo-${id})" opacity=".5"/>

  ${backHair}

  <path d="M 139 188 L 139 226 Q 160 240 181 226 L 181 188 Z" fill="url(#skin-${id})"/>
  <path d="M 139 188 L 139 212 Q 160 224 181 212 L 181 188 Z" fill="${p.skinD}" opacity=".38"/>

  ${body}

  <path d="M 160 56 C 200 56 220 92 220 134 C 220 167 209 193 192 206
           C 184 213 172 217 160 217 C 148 217 136 213 128 206
           C 111 193 100 167 100 134 C 100 92 120 56 160 56 Z" fill="url(#skin-${id})"/>
  <path d="M 128 206 C 136 213 148 217 160 217 C 172 217 184 213 192 206
           C 182 211 172 213 160 213 C 148 213 138 211 128 206 Z" fill="${p.skinD}" opacity=".26"/>

  ${f.blush ? blushMark(122, 163) + blushMark(198, 163) : ''}

  ${f.browL}${f.browR}
  ${f.eyeL}${f.eyeR}
  <path d="M 159 170 q 3 2 2 4" stroke="${p.skinD}" stroke-width="2" fill="none"
        stroke-linecap="round" opacity=".75"/>
  ${f.mouth}
  ${f.extra}

  ${frontHair}
  ${accessory}

</svg>`;
  }

  /* ---------------------------- 场景 ---------------------------- */
  // 每个场景返回 SVG 字符串（铺满容器，viewBox 1600x900）
  const SCENES = {
    classroom: { sky: ['#f3e6cf', '#e8cfa8'], build: 'classroom' },
    corridor:  { sky: ['#e9dfcc', '#cdbfa6'], build: 'corridor' },
    corridor_morning: { sky: ['#f4ecdc', '#dfd2b8'], build: 'corridor', light: '#fff6e0' },
    library:   { sky: ['#2b2f3c', '#1b1e28'], build: 'library', light: '#ffe8b8' },
    library_dusk: { sky: ['#5b3a30', '#2a1d22'], build: 'library', light: '#ffb45e' },
    rooftop:   { sky: ['#8fc4e8', '#d9edf7'], build: 'rooftop', light: '#fff6d8' },
    rooftop_dusk: { sky: ['#f2a15e', '#6a4a72'], build: 'rooftop', light: '#ffd9a0' },
    gate_morning: { sky: ['#a8d8f0', '#e8f4fa'], build: 'gate', light: '#fff6d8' },
    gate_night: { sky: ['#1a2340', '#0c1020'], build: 'gate', light: '#9fc4f0' },
    sky_summer: { sky: ['#4a90c8', '#bfe4f5'], build: 'sky' },
    sky_dusk:   { sky: ['#e8845a', '#4a3a6a'], build: 'sky' },
    ruin:       { sky: ['#8a7f6e', '#4a4238'], build: 'ruin' },
    black:      { sky: ['#000', '#000'], build: 'none' },
    white:      { sky: ['#fff', '#fff'], build: 'none' }
  };

  function sceneSVG(name) {
    const img = window.BG && window.BG[name];
    if (img) {
      return `<div class="scene" data-scene="${name}"><img class="scene-img" src="${img}" alt="" draggable="false"></div>`;
    }
    const s = SCENES[name] || SCENES.black;
    return `<div class="scene" data-scene="${name}">
      <div class="scene-base" style="background:linear-gradient(180deg,${s.sky[0]},${s.sky[1]})"></div>
      ${buildLayer(s)}
    </div>`;
  }

  function buildLayer(s) {
    const L = s.light || '#fff';
    switch (s.build) {
      case 'classroom': return `
        <svg class="scene-art" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="cr-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c2a074"/><stop offset="1" stop-color="#7c5c38"/></linearGradient>
            <linearGradient id="cr-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6edda"/><stop offset="1" stop-color="#e4d4b8"/></linearGradient>
            <linearGradient id="cr-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ed2f2"/><stop offset=".62" stop-color="#d8eefb"/><stop offset="1" stop-color="#f2f8e6"/></linearGradient>
            <linearGradient id="cr-beam" x1="0" y1="0" x2=".62" y2="1"><stop offset="0" stop-color="#fff6d8" stop-opacity=".62"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></linearGradient>
            <linearGradient id="cr-ceil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf6ea"/><stop offset="1" stop-color="#ebe0ca"/></linearGradient>
          </defs>
          <rect width="1600" height="900" fill="url(#cr-wall)"/>
          <rect width="1600" height="86" fill="url(#cr-ceil)"/>
          <path d="M 0 86 H 1600 L 1548 122 H 52 Z" fill="#d9cbb0" opacity=".75"/>
          <rect y="560" width="1600" height="120" fill="#d8c9ab"/>
          <rect y="552" width="1600" height="9" fill="#bba887"/>
          <rect y="680" width="1600" height="220" fill="url(#cr-floor)"/>
          <g stroke="#6f5230" stroke-width="3" opacity=".2">
            <path d="M 0 750 H 1600 M 0 830 H 1600"/>
          </g>
          <rect x="58" y="140" width="556" height="386" rx="4" fill="#fdfaf2"/>
          <rect x="78" y="160" width="516" height="346" fill="url(#cr-sky)"/>
          <g fill="#8fbb72" opacity=".45">
            <circle cx="176" cy="470" r="66"/><circle cx="252" cy="492" r="48"/><circle cx="470" cy="500" r="70"/>
          </g>
          <g fill="#ffffff" opacity=".6">
            <ellipse cx="300" cy="238" rx="88" ry="30"/><ellipse cx="384" cy="212" rx="58" ry="22"/>
          </g>
          <g stroke="#fdfaf2" stroke-width="15">
            <path d="M 336 160 V 506"/><path d="M 78 330 H 594"/>
          </g>
          <path d="M 78 506 L 594 506 L 790 900 L 30 900 Z" fill="url(#cr-beam)"/>
          <rect x="1000" y="150" width="520" height="270" rx="6" fill="#33493c" stroke="#7a6a50" stroke-width="13"/>
          <g stroke="#ffffff" stroke-width="2.4" opacity=".2">
            <path d="M 1044 200 h 420 M 1044 240 h 330 M 1044 280 h 386 M 1044 320 h 268 M 1044 360 h 190"/>
          </g>
          <rect x="1120" y="428" width="280" height="12" rx="6" fill="#9a8a72" opacity=".7"/>
          <g opacity=".6">
            <circle cx="1330" cy="72" r="50" fill="none" stroke="#b0a594" stroke-width="7"/>
            <path d="M 1330 34 V 72 H 1362" stroke="#b0a594" stroke-width="7" fill="none"/>
          </g>
          <g opacity=".95">
            ${(() => {
              let o = '';
              for (let i = 0; i < 4; i++) {
                const x = 110 + i * 300;
                o += `<g><rect x="${x}" y="612" width="238" height="18" rx="9" fill="#b0905f"/><rect x="${x + 22}" y="630" width="17" height="96" fill="#8a6c44"/><rect x="${x + 199}" y="630" width="17" height="96" fill="#8a6c44"/><rect x="${x + 10}" y="726" width="218" height="10" rx="5" fill="#7a5c38" opacity=".55"/></g>`;
              }
              return o;
            })()}
          </g>
        </svg>`;
      case 'corridor': return `
        <svg class="scene-art" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
          <defs><linearGradient id="cg1" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#4a4238"/><stop offset=".5" stop-color="#8d7f6a"/><stop offset="1" stop-color="#4a4238"/>
          </linearGradient></defs>
          <rect width="1600" height="900" fill="url(#cg1)"/>
          <rect x="0" y="0" width="1600" height="900" fill="none"/>
          <g fill="#6b5f4e">
            <path d="M 0 0 H 400 L 640 900 H 0 Z"/><path d="M 1600 0 H 1200 L 960 900 H 1600 Z"/>
          </g>
          <g fill="#1c1912" opacity=".55">
            <path d="M 0 620 L 620 560 L 620 900 L 0 900 Z"/><path d="M 1600 620 L 980 560 L 980 900 L 1600 900 Z"/>
          </g>
          <g fill="#f0e6d2" opacity=".85">
            <rect x="620" y="420" width="360" height="150" rx="4"/>
          </g>
          <g fill="#0f0d0a" opacity=".3"><rect x="0" y="0" width="1600" height="120"/></g>
          <g opacity=".5" fill="#fff">
            <path d="M 700 560 L 780 560 L 860 900 L 620 900 Z" opacity=".08"/>
          </g>
        </svg>`;
      case 'library': return `
        <svg class="scene-art" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="lbfloor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#7a5c3d"/><stop offset="1" stop-color="#4a3524"/></linearGradient>
            <linearGradient id="beam" x1="0" y1="0" x2=".4" y2="1">
              <stop offset="0" stop-color="${L}" stop-opacity=".34"/>
              <stop offset="1" stop-color="${L}" stop-opacity="0"/></linearGradient>
            <linearGradient id="winlight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="${L}" stop-opacity=".85"/>
              <stop offset="1" stop-color="${L}" stop-opacity=".2"/></linearGradient>
          </defs>
          <rect width="1600" height="900" fill="#5a4a39"/>
          <rect y="640" width="1600" height="260" fill="url(#lbfloor)"/>
          <!-- 书架 -->
          <g fill="#6a503a">
            <rect x="0" y="60" width="430" height="600"/>
            <rect x="1170" y="60" width="430" height="600"/>
          </g>
          <g stroke="#31221a" stroke-width="10">
            <path d="M 0 190 H 430 M 0 320 H 430 M 0 450 H 430 M 0 580 H 430"/>
            <path d="M 1170 190 H 1600 M 1170 320 H 1600 M 1170 450 H 1600 M 1170 580 H 1600"/>
            <path d="M 110 60 V 660 M 220 60 V 660 M 330 60 V 660"/>
            <path d="M 1280 60 V 660 M 1390 60 V 660 M 1500 60 V 660"/>
          </g>
          <g opacity=".9">
            ${(() => {
              let out = '';
              const cols = ['#6b4a3a','#4a5a4a','#3f4a63','#6a5a3a','#5a3f4a','#405060'];
              let seed = 7;
              const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
              for (let row = 0; row < 4; row++) {
                const y = 78 + row * 130;
                for (let i = 0; i < 12; i++) {
                  const x = 8 + i * 35;
                  const h = 62 + rnd() * 26;
                  out += `<rect x="${x}" y="${y + (86 - h)}" width="${26 + rnd() * 6}" height="${h}" fill="${cols[Math.floor(rnd()*cols.length)]}" opacity="${.55 + rnd()*.35}"/>`;
                }
                for (let i = 0; i < 12; i++) {
                  const x = 1178 + i * 35;
                  const h = 62 + rnd() * 26;
                  out += `<rect x="${x}" y="${y + (86 - h)}" width="${26 + rnd() * 6}" height="${h}" fill="${cols[Math.floor(rnd()*cols.length)]}" opacity="${.5 + rnd()*.35}"/>`;
                }
              }
              return out;
            })()}
          </g>
          <!-- 窗 -->
          <rect x="560" y="90" width="480" height="470" fill="${L}" opacity=".9"/>
          <rect x="560" y="90" width="480" height="470" fill="url(#winlight)" opacity=".7"/>
          <g stroke="#3a3026" stroke-width="16" fill="none">
            <rect x="560" y="90" width="480" height="470"/>
            <path d="M 800 90 V 560 M 560 325 H 1040"/>
          </g>
          <!-- 光柱 -->
          <path d="M 570 560 L 1030 560 L 1240 900 L 380 900 Z" fill="url(#beam)"/>
          <!-- 窗外的树影 -->
          <g opacity=".15" fill="#3f5a34">
            <path d="M 610 130 q 26 46 6 92 q 34 -14 42 30 q -30 14 -52 -8 q -12 40 -40 22 q 12 -46 44 -52 q -14 -46 0 -84 Z"/>
            <path d="M 960 118 q 32 40 18 88 q 30 -8 36 34 q -36 18 -50 -12 q -20 38 -44 12 q 18 -42 40 -44 q -14 -44 0 -78 Z"/>
          </g>
          <!-- 书桌 -->
          <g fill="#8a6a44">
            <rect x="600" y="600" width="420" height="22" rx="6"/>
            <rect x="620" y="622" width="18" height="120"/><rect x="980" y="622" width="18" height="120"/>
          </g>
          <rect width="1600" height="900" fill="#20180f" opacity=".16"/>
        </svg>`;
      case 'rooftop': return `
        <svg class="scene-art" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="cl1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#7fb8e0"/><stop offset="1" stop-color="#e8f4fa"/></linearGradient>
          </defs>
          <g opacity="${s.sky[0] === '#f2a15e' ? 0 : 1}" fill="#fff">
            <ellipse cx="320" cy="180" rx="160" ry="46" opacity=".9"/>
            <ellipse cx="420" cy="160" rx="110" ry="38" opacity=".85"/>
            <ellipse cx="1180" cy="130" rx="190" ry="44" opacity=".8"/>
            <ellipse cx="1050" cy="160" rx="110" ry="30" opacity=".7"/>
          </g>
          <!-- 远景城市 -->
          <g fill="#7d93a8" opacity=".45">
            <rect x="60" y="560" width="90" height="120"/><rect x="170" y="520" width="70" height="160"/>
            <rect x="260" y="580" width="110" height="100"/><rect x="1200" y="540" width="80" height="140"/>
            <rect x="1300" y="580" width="120" height="100"/><rect x="1440" y="520" width="70" height="160"/>
          </g>
          <!-- 地面 -->
          <rect y="660" width="1600" height="240" fill="#b9b2a4"/>
          <rect y="660" width="1600" height="240" fill="#8d877c" opacity=".35"/>
          <g stroke="#9c958a" stroke-width="3" opacity=".55">
            <path d="M 0 740 H 1600 M 0 820 H 1600 M 200 660 V 900 M 600 660 V 900 M 1000 660 V 900 M 1400 660 V 900"/>
          </g>
          <!-- 栏杆 -->
          <g stroke="#7a8a92" stroke-width="9" fill="none">
            <path d="M 0 640 H 1600"/>
            <path d="M 0 600 H 1600" stroke-width="6"/>
            ${Array.from({length: 21}, (_, i) => `<path d="M ${i * 80} 600 V 660" stroke-width="5"/>`).join('')}
          </g>
          <!-- 水塔 -->
          <g>
            <ellipse cx="1330" cy="560" rx="150" ry="40" fill="#8e8880"/>
            <path d="M 1180 560 L 1200 660 L 1460 660 L 1480 560 Z" fill="#a5a096"/>
            <ellipse cx="1330" cy="560" rx="150" ry="40" fill="#bdb8ae"/>
            <path d="M 1210 600 h 240 M 1205 630 h 250" stroke="#8e8880" stroke-width="4" opacity=".6"/>
          </g>
          <!-- 门 -->
          <g fill="#6f6a62">
            <rect x="60" y="420" width="180" height="240" rx="4"/>
            <rect x="74" y="434" width="152" height="212" fill="#8b857b"/>
            <circle cx="200" cy="550" r="7" fill="#4a463f"/>
          </g>
        </svg>`;
      case 'gate': return `
        <svg class="scene-art" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
          <defs><linearGradient id="gt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="${s.sky[0]}"/><stop offset="1" stop-color="${s.sky[1]}"/></linearGradient></defs>
          <rect width="1600" height="900" fill="url(#gt)"/>
          <g fill="#6f8a5a" opacity=".65">
            <path d="M 0 700 q 200 -60 400 0 q 200 60 400 0 q 200 -60 400 0 q 200 60 400 0 V 900 H 0 Z"/>
          </g>
          <rect y="760" width="1600" height="140" fill="#b0a99c"/>
          <path d="M 0 760 H 1600" stroke="#8f887c" stroke-width="6"/>
          <!-- 校门 -->
          <g fill="#8e9196">
            <rect x="120" y="380" width="40" height="380"/>
            <rect x="640" y="380" width="40" height="380"/>
          </g>
          <g stroke="#9aa0a6" stroke-width="10" fill="none" opacity=".9">
            <path d="M 160 420 H 640"/>
            <path d="M 160 400 H 640"/>
            ${Array.from({length: 13}, (_, i) => `<path d="M ${170 + i * 38} 400 V 760" stroke-width="6"/>`).join('')}
          </g>
          <rect x="120" y="360" width="560" height="30" fill="#a8adb2"/>
          <!-- 校舍 -->
          <g fill="#cfc9bd">
            <rect x="900" y="300" width="640" height="460"/>
          </g>
          <g fill="#e8e2d6">
            ${Array.from({length: 4}, (_, r) => Array.from({length: 8}, (_, c) =>
              `<rect x="${930 + c * 76}" y="${330 + r * 110}" width="54" height="72" rx="3"/>`).join('')).join('')}
          </g>
          <g fill="#9fb4c4" opacity=".55">
            ${Array.from({length: 4}, (_, r) => Array.from({length: 8}, (_, c) =>
              `<rect x="${930 + c * 76}" y="${330 + r * 110}" width="54" height="72" rx="3"/>`).join('')).join('')}
          </g>
          <!-- 树 -->
          <g fill="#4a6a42" opacity=".85">
            <ellipse cx="820" cy="560" rx="120" ry="90"/>
            <ellipse cx="760" cy="620" rx="80" ry="60"/>
            <rect x="800" y="620" width="26" height="140" fill="#5a4632"/>
          </g>
          <rect width="1600" height="900" fill="${s.sky[0]}" opacity=".08"/>
        </svg>`;
      case 'sky': return `
        <svg class="scene-art" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
          <defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="${s.sky[0]}"/><stop offset="1" stop-color="${s.sky[1]}"/></linearGradient></defs>
          <rect width="1600" height="900" fill="url(#sk)"/>
          <g fill="#fff" opacity=".55">
            <ellipse cx="380" cy="240" rx="220" ry="60"/>
            <ellipse cx="500" cy="210" rx="140" ry="46"/>
            <ellipse cx="1150" cy="330" rx="260" ry="66"/>
            <ellipse cx="980" cy="300" rx="120" ry="40"/>
            <ellipse cx="700" cy="640" rx="300" ry="70" opacity=".5"/>
          </g>
          <g opacity=".25" fill="#fff">
            <path d="M 0 780 q 400 -80 800 0 q 400 80 800 0 V 900 H 0 Z"/>
          </g>
        </svg>`;
      case 'ruin': return `
        <svg class="scene-art" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
          <rect width="1600" height="900" fill="${s.sky[0]}"/>
          <g fill="#5a5147">
            <path d="M 0 520 L 240 480 L 240 900 L 0 900 Z"/>
            <path d="M 1600 500 L 1360 470 L 1360 900 L 1600 900 Z"/>
            <rect x="240" y="640" width="1120" height="260"/>
          </g>
          <g fill="#3d372f">
            <rect x="420" y="560" width="120" height="80" rx="4"/>
            <rect x="900" y="520" width="180" height="120" rx="4"/>
            <path d="M 700 640 l 90 -40 l 30 40 Z"/>
          </g>
          <g stroke="#2a251f" stroke-width="8" opacity=".7">
            <path d="M 240 640 H 1360"/><path d="M 620 640 V 900"/><path d="M 980 640 V 900"/>
          </g>
          <g fill="#8a8175" opacity=".5">
            <path d="M 0 860 q 500 -40 1600 -20 V 900 H 0 Z"/>
          </g>
          <rect width="1600" height="900" fill="#0e0c0a" opacity=".25"/>
        </svg>`;
      default: return '';
    }
  }

  return { charSVG, sceneSVG, PALETTE };
})();
