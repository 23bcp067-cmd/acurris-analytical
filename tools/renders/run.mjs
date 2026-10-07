import { chromium } from 'playwright';
import fs from 'fs';
const specs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const only = process.argv[3];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()) });
await p.goto('http://127.0.0.1:8099/render.html'); await p.waitForFunction(() => window.ready, null, { timeout: 30000 });
fs.mkdirSync('out', { recursive: true });
for (const [name, spec] of Object.entries(specs)) {
  if (only && !name.startsWith(only)) continue;
  const t = Date.now();
  const url = await p.evaluate(s => window.renderScene(s), spec);
  fs.writeFileSync(`out/${name}.png`, Buffer.from(url.split(',')[1], 'base64'));
  console.log(name, Date.now() - t, 'ms');
}
if (errs.length) console.log('ERR', errs.slice(0, 5));
await b.close();
