import { copyFileSync, constants } from 'node:fs';

try {
  copyFileSync(new URL('../.env.example', import.meta.url), new URL('../.env', import.meta.url), constants.COPYFILE_EXCL);
  console.log('.env créé avec des valeurs vides.');
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
  console.log('.env existe déjà : conservé sans modification.');
}
