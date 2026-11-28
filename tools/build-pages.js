// Regenerates js/pages.js from the <main> blocks of the site pages.
// Run after editing any page: node tools/build-pages.js
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const pages = [
  ['home', 'index.html'],
  ['games', 'games/index.html'],
  ['code', 'code/index.html'],
  ['art', 'art/index.html'],
  ['music', 'music/index.html'],
  ['contact', 'contact/index.html'],
  ['share', 'share/index.html']
];
const out = {};
for (const [key, file] of pages) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || '';
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '';
  const meta = [...head.matchAll(/<(?:meta|link)\b[^>]*>/gi)]
    .map((m) => m[0])
    .filter((tag) => /property="og:|name="description"|name="theme-color"|rel="canonical"/.test(tag));
  if (!main) throw new Error(`No main in ${file}`);
  out[key] = { title, meta, html: main[1] };
}
const generated = '// Generated from the page <main> blocks for file:// navigation.\n'
  + '// Regenerate with: node tools/build-pages.js\n'
  + 'window.SITE_PAGES = ' + JSON.stringify(out, null, 2) + ';\n';
fs.writeFileSync(
  path.join(root, 'js/pages.js'),
  generated.replace(/\n/g, '\r\n'),
  'utf8'
);
console.log(Object.entries(out).map(([key, value]) => `${key}: ${value.html.length} chars`).join('\n'));
