// Empacota core/ num único arquivo para o Apps Script, que não suporta módulos ES.
// Resultado: apps-script/server/00_core.js, com o objeto global `Core`.
import { build } from 'esbuild';

await build({
  entryPoints: ['core/index.js'],
  bundle: true,
  format: 'iife',
  globalName: 'Core',
  target: 'es2019',
  charset: 'utf8',
  legalComments: 'none',
  outfile: 'apps-script/server/00_core.js',
  banner: { js: '// GERADO por `npm run build` a partir de core/. NÃO EDITAR ESTE ARQUIVO.' },
});
console.log('OK: apps-script/server/00_core.js');
