// 把 index.html 连同 css/js/assets/bgm 打包成一个可双击运行的单文件 HTML。
// 用法: node tools/build.js [输出路径]
// 默认输出到仓库根目录同名 HTML。
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const srcFile = path.join(root, 'index.html');
const outFile = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(root, '夏日书签.html');

let html = fs.readFileSync(srcFile, 'utf8');

// 1. 内联样式表
html = html.replace(/<link[^>]*href="([^"]+\.css)"[^>]*>/g, function (m, href) {
  const p = path.join(root, href);
  if (!fs.existsSync(p)) return m;
  const css = fs.readFileSync(p, 'utf8');
  return '<style>\n' + css + '\n</style>';
});

// 2. 内联脚本
html = html.replace(/<script src="([^"]+\.js)"><\/script>/g, function (m, src) {
  const p = path.join(root, src);
  if (!fs.existsSync(p)) return m;
  const js = fs.readFileSync(p, 'utf8');
  return '<script>\n' + js + '\n</script>';
});

fs.writeFileSync(outFile, html, 'utf8');
console.log('built ' + outFile + '  ' + Math.round(Buffer.byteLength(html) / 1024) + ' KB');

// 体检：只找标签上的外部引用（js 代码里的字符串拼接不算）
const left = html.match(/<(?:script|link|img)[^>]+(?:src|href)="(?!data:)([^"]+)"/g) || [];
if (left.length) {
  console.log('!! 仍有外部引用: ' + left.join(', '));
} else {
  console.log('ok: 无外部引用，单文件可离线运行');
}
