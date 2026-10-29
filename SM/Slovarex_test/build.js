/**
 * build.js — сборка «Словарекс» в dist/
 * Запуск: npm run build
 */
const fs = require('fs');
const path = require('path');
const terser = require('terser');
const CleanCSS = require('clean-css');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

// ⚠ Порядок ВАЖЕН:
//   App.js   — определяет getid, saveToVKStorage, syncAllDataToVK, showRewardedAd и т.п.
//   words.js — определяет DICTIONARY и BASE_WORDS_POOL
//   game.js  — использует всё вышеперечисленное
const JS_BUNDLE = [
  'App.js',
  'words.js',
  'game.js',
];

// Копируется как есть. platform.js ОБЯЗАТЕЛЬНО отдельно —
// его читают inline-скрипты в <head> (темы / weak-device) до загрузки бандла.
const JS_COPY = ['platform.js'];
const IMG_COPY = ['map.jpg', 'player.png'];
const CSS_FILES = ['style.css', 'responsive.css'];

function resolve(rel) {
  const a = path.join(ROOT, rel);
  if (fs.existsSync(a)) return a;
  const b = path.join(ROOT, 'src', rel);
  if (fs.existsSync(b)) return b;
  return null;
}
function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }

// Страховка на случай `export` в словаре (маловероятно, но пусть будет)
function sanitizeExport(code) {
  return code
    .replace(/^\s*export\s+default\s+/gm, 'var __default_ = ')
    .replace(/^\s*export\s+(?=(?:const|let|var|function|class|async\s+function))/gm, '')
    .replace(/^\s*export\s*\{[^}]*\}\s*;?\s*$/gm, '');
}

async function buildJS() {
  console.log('\n📦 JS (App.js + words.js + game.js → game.min.js)...');
  const parts = [];
  for (const rel of JS_BUNDLE) {
    const abs = resolve(rel);
    if (!abs) { console.warn(`   ⚠ Не найден: ${rel}`); continue; }
    let code = fs.readFileSync(abs, 'utf8').replace(/\r\n/g, '\n');
    code = sanitizeExport(code);
    // ; в конце — защита от склейки `)` одного файла и `(` следующего
    parts.push(`/* ${rel} */\n${code}\n;`);
  }
  const combined = parts.join('\n');
  console.log(`   • Склеено: ${combined.length.toLocaleString('ru-RU')} символов`);

  const result = await terser.minify(combined, {
    ecma: 2018,
    compress: {
      drop_console: true,     // удаляет console.log/warn/error
      drop_debugger: true,
      passes: 2,
    },
    mangle: { toplevel: false }, // сокращает имена переменных
    format: { comments: false }, // удаляет все комментарии
  });
  if (result.error) throw result.error;

  ensureDir(DIST);
  fs.writeFileSync(path.join(DIST, 'game.min.js'), result.code);
  console.log(`   ✅ dist/game.min.js (${(result.code.length / 1024).toFixed(1)} КБ)`);
}

function buildCSS() {
  console.log('\n🎨 CSS (style.css + responsive.css → style.min.css)...');
  const parts = [];
  for (const rel of CSS_FILES) {
    const abs = resolve(rel);
    if (!abs) { console.warn(`   ⚠ Не найден: ${rel}`); continue; }
    parts.push(fs.readFileSync(abs, 'utf8'));
  }
  const result = new CleanCSS({ level: 2, rebase: false }).minify(parts.join('\n'));
  if (result.errors.length) throw new Error(result.errors.join('; '));
  ensureDir(DIST);
  fs.writeFileSync(path.join(DIST, 'style.min.css'), result.styles);
  console.log(`   ✅ dist/style.min.css (${(result.styles.length / 1024).toFixed(1)} КБ)`);
}

function buildHTML() {
  console.log('\n📄 HTML...');
  const srcPath = resolve('index.html');
  if (!srcPath) throw new Error('index.html не найден');
  let html = fs.readFileSync(srcPath, 'utf8');

  // 1. Убираем локальные скрипты App.js / words.js / game.js.
  //    ⚠ platform.js НЕ трогаем — остаётся в <head> отдельным файлом.
  html = html.replace(
    /<script\s+src\s*=\s*["'](?:\.\/)?(?:App|words|game)\.js["']\s*><\/script>\s*/gi,
    ''
  );
  // 2. Убираем style.css и responsive.css (они ушли в style.min.css)
  html = html.replace(
    /<link\s+rel\s*=\s*["']stylesheet["']\s+href\s*=\s*["'](?:\.\/)?(?:style|responsive)\.css["']\s*\/?>\s*/gi,
    ''
  );
  // 3. Вставляем собранный CSS перед </head>
  html = html.replace(
    /<\/head>/i,
    '    <link rel="stylesheet" href="style.min.css">\n</head>'
  );
  // 4. Вставляем бандл перед </body> (после inline OK-hiding — он идёт в конце)
  html = html.replace(
    /<\/body>/i,
    '    <script src="game.min.js"></script>\n</body>'
  );

  ensureDir(DIST);
  fs.writeFileSync(path.join(DIST, 'index.html'), html);
  console.log('   ✅ dist/index.html');
}

function copyAssets() {
  console.log('\n📎 Копирую статику...');
  const files = JS_COPY.concat(IMG_COPY);
  for (const rel of files) {
    const abs = resolve(rel);
    if (!abs) { console.warn(`   ⚠ Не найден: ${rel}`); continue; }
    ensureDir(DIST);
    fs.copyFileSync(abs, path.join(DIST, rel));
    console.log(`   ✅ dist/${rel}`);
  }
}

(async () => {
  const t0 = Date.now();
  console.log('🚀 Сборка в dist/');
  if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true, force: true });
  await buildJS();
  buildCSS();
  buildHTML();
  copyAssets();
  console.log(`\n✨ Готово за ${((Date.now() - t0) / 1000).toFixed(2)}с\n`);
})().catch(e => { console.error('\n❌', e); process.exit(1); });