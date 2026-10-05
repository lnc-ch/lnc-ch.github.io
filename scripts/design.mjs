import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const command = process.argv[2];
if (!['dev','build'].includes(command)) throw new Error('Use: node scripts/design.mjs dev|build');
const packagePath = new URL('../node_modules/astro/package.json',import.meta.url);
const pkg = JSON.parse(readFileSync(packagePath,'utf8'));
const bin = typeof pkg.bin==='string' ? pkg.bin : pkg.bin.astro;
const executable=fileURLToPath(new URL(bin,new URL('.',packagePath)));
const fixtures=process.argv.includes('--fixtures');
const flags=process.argv.slice(3).filter(arg=>arg!=='--fixtures');
const result = spawnSync(process.execPath,[executable,command,...flags], {
  stdio:'inherit',env:{...process.env,LNC_PREVIEW:'1',LNC_TEST_FIXTURES:fixtures ? '1' : '0'},
});
if(result.error) throw result.error;
process.exitCode=result.status ?? 1;
