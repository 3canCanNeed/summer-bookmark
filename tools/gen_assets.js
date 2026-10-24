// 把 assets/ 下的图片转成 data URI，写入 js/assets.js。
// 用法: node tools/gen_assets.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const spriteDir = path.join(root, 'assets', 'sprites');
const bgDir = path.join(root, 'assets', 'bg');
const outFile = path.join(root, 'js', 'assets.js');

function toDataUri(file, mime) {
  return 'data:' + mime + ';base64,' + fs.readFileSync(file).toString('base64');
}

// --- 立绘: {id}_{emo}.webp ---
const sprites = {};
let spriteKb = 0;
let spriteCount = 0;
fs.readdirSync(spriteDir).sort().forEach(function (file) {
  if (!/\.webp$/i.test(file)) return;
  const m = /^([a-z]+)_([a-z]+)\.webp$/i.exec(file);
  if (!m) return;
  const id = m[1];
  const emo = m[2];
  if (!sprites[id]) sprites[id] = {};
  sprites[id][emo] = toDataUri(path.join(spriteDir, file), 'image/webp');
  spriteKb += fs.statSync(path.join(spriteDir, file)).size / 1024;
  spriteCount++;
});

// --- 背景: {scene}.webp ---
const bgs = {};
let bgKb = 0;
let bgCount = 0;
fs.readdirSync(bgDir).sort().forEach(function (file) {
  if (!/\.webp$/i.test(file)) return;
  const name = file.replace(/\.webp$/i, '');
  bgs[name] = toDataUri(path.join(bgDir, file), 'image/webp');
  bgKb += fs.statSync(path.join(bgDir, file)).size / 1024;
  bgCount++;
});

const head = [
  '// 自动生成，请勿手改。源文件在 assets/sprites 与 assets/bg。',
  'window.ASSETS = ' + JSON.stringify(sprites) + ';',
  'window.BG = ' + JSON.stringify(bgs) + ';',
  ''
].join('\n');

fs.writeFileSync(outFile, head, 'utf8');

const ids = Object.keys(sprites).map(function (id) {
  return id + ': ' + Object.keys(sprites[id]).join(', ');
});
console.log('立绘 ' + spriteCount + ' 张 ' + Math.round(spriteKb) + ' KB');
ids.forEach(function (s) { console.log('  ' + s); });
console.log('背景 ' + bgCount + ' 张 ' + Math.round(bgKb) + ' KB');
console.log('  ' + Object.keys(bgs).join(', '));
console.log('assets.js ' + Math.round(Buffer.byteLength(head) / 1024) + ' KB');
