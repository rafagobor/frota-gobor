// Confere a sintaxe de todo o código do Apps Script (inclusive o JS embutido nos .html).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

function arquivos(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? arquivos(p) : [p];
  });
}

let erros = 0;
for (const arq of arquivos('apps-script')) {
  if (!/\.(js|html)$/.test(arq)) continue;
  const texto = readFileSync(arq, 'utf8');
  const blocos = arq.endsWith('.js')
    ? [texto]
    : [...texto.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1].replace(/<\?[\s\S]*?\?>/g, 'null'));
  for (const codigo of blocos) {
    try {
      new vm.Script(codigo, { filename: arq });
    } catch (e) {
      erros++;
      console.error(`ERRO de sintaxe em ${arq}: ${e.message}`);
    }
  }
}
if (erros) process.exit(1);
console.log('OK: sintaxe do apps-script');
