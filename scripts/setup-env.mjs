import { copyFileSync, constants, readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

try {
  copyFileSync(new URL('../.env.example', import.meta.url), new URL('../.env', import.meta.url), constants.COPYFILE_EXCL);
  console.log('.env créé avec des valeurs vides.');
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
  console.log('.env existant conservé ; seul un jeton local manquant sera complété.');
}

// Complète seulement le jeton local manquant, sans modifier les identifiants.
const target = new URL('../.env', import.meta.url);
let contents = readFileSync(target, 'utf8');
const current = contents.match(/^MEDIA_ACCESS_TOKEN=(.*)$/m);
if (!current || !current[1].trim() || ['""', "''"].includes(current[1].trim())) {
  const entry = `MEDIA_ACCESS_TOKEN=${randomBytes(32).toString('hex')}`;
  contents = current ? contents.replace(/^MEDIA_ACCESS_TOKEN=.*$/m, entry) : `${contents.trimEnd()}\n${entry}\n`;
  writeFileSync(target, contents, { mode: 0o600 });
}
chmodSync(target, 0o600);
