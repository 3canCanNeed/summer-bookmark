// 把 assets/audio 下的音频转成 data URI，写入 js/bgm.js。
// 同一首曲子可以按不同 playbackRate 挂到多个场景上，用速率区分情绪，
// 这样两首文件就能覆盖大部分场景；没有映射的场景回退到程序化合成。
// 用法: node tools/gen_audio.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dir = path.join(root, 'assets', 'audio');
const mapFile = path.join(root, '_bgm_map.json');
const outFile = path.join(root, 'js', 'bgm.js');

if (!fs.existsSync(mapFile)) {
  console.log('no _bgm_map.json, skip');
  process.exit(0);
}

const MAP = JSON.parse(fs.readFileSync(mapFile, 'utf8'));

const fileCache = {};
const slots = [];
const rates = [];
const credits = [];
const used = [];

Object.keys(MAP).forEach(function (slot) {
  const info = MAP[slot];
  const p = path.join(dir, info.file);
  if (!fs.existsSync(p)) {
    console.log('skip ' + slot + ' (missing ' + info.file + ')');
    return;
  }
  if (!fileCache[info.file]) {
    const buf = fs.readFileSync(p);
    fileCache[info.file] = buf;
    used.push({ name: info.file, kb: Math.round(buf.length / 1024) });
  }
  slots.push('  ' + JSON.stringify(slot) + ': ' + JSON.stringify(info.file));
  rates.push('  ' + JSON.stringify(slot) + ': ' + info.rate);
  credits.push({
    slot: slot, title: info.title, author: info.author,
    license: info.license, url: info.url, rate: info.rate
  });
  console.log(slot.padEnd(8) + '<- ' + info.file + '  rate ' + info.rate);
});

const blobs = used.map(function (f) {
  const b64 = fileCache[f.name].toString('base64');
  return '  ' + JSON.stringify(f.name) + ': "data:audio/ogg;base64,' + b64 + '"';
});

const head = [
  '// 自动生成，请勿手改。源文件在 assets/audio，映射表在 _bgm_map.json。',
  '// 全部为 CC-BY / CC0 授权，署名信息见 window.BGM_CREDITS。',
  'window.BGM_FILES = {',
  blobs.join(',\n'),
  '};',
  '// 场景 -> 文件名',
  'window.BGM_SLOT = {',
  slots.join(',\n'),
  '};',
  '// 场景 -> playbackRate（同一首曲子用速率区分情绪）',
  'window.BGM_RATE = {',
  rates.join(',\n'),
  '};',
  'window.BGM_CREDITS = ' + JSON.stringify(credits, null, 2) + ';',
  ''
].join('\n');

fs.writeFileSync(outFile, head, 'utf8');

const totalKb = used.reduce(function (a, f) { return a + f.kb; }, 0);
console.log('---');
console.log('slots ' + slots.length + '  files ' + used.length + ' (' + totalKb +
  ' KB) -> bgm.js ' + Math.round(Buffer.byteLength(head) / 1024) + ' KB');
