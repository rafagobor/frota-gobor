// Build do Apps Script.
// 1) core/ → apps-script/server/00_core.js (objeto global `Core`; o Apps Script não tem módulos ES)
// 2) apps-script/ui/*.html → apps-script/server/01_painel.js (HTML do painel numa constante)
// 3) dist/Frota.gs: TODO o servidor num único arquivo, para instalar sem terminal
//    (copiar e colar no editor do Apps Script da planilha).
import { build } from 'esbuild';
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';

const pacote = JSON.parse(readFileSync('package.json', 'utf8'));

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

// Painel: index.html com estilos e app embutidos (substitui os <?!= incluir_('ui/...') ?>)
const ui = (n) => readFileSync(`apps-script/ui/${n}.html`, 'utf8');
const painel = ui('index').replace(/<\?!=\s*incluir_\('ui\/(\w+)'\)\s*\?>/g, (_, n) => ui(n));
if (/incluir_\(/.test(painel)) throw new Error('Painel com include não resolvido');
writeFileSync('apps-script/server/01_painel.js',
  '// GERADO por `npm run build` a partir de apps-script/ui/. NÃO EDITAR ESTE ARQUIVO.\n' +
  `var PAINEL_HTML = ${JSON.stringify(painel)};\n`);

// Arquivo único
const dir = 'apps-script/server';
const arquivos = readdirSync(dir).filter((n) => n.endsWith('.js')).sort();
const hoje = new Date().toISOString().slice(0, 10);
// Cabeçalho só com ASCII: o arquivo inteiro é ASCII para sobreviver a qualquer copiar/colar
// (documento Google, e-mail, editores que trocam a codificação).
const cabecalho = `/**
 * PAINEL DE FROTA GOBOR - versao ${pacote.version} - gerado em ${hoje}
 *
 * COMO INSTALAR (sem terminal):
 *   1. Abra a planilha "Frota Gobor - Base" > Extensoes > Apps Script.
 *   2. Apague todo o conteudo do arquivo Codigo.gs e cole ESTE texto inteiro no lugar.
 *   3. Salve (Ctrl+S ou o icone de disquete). Volte para a planilha e recarregue a pagina.
 *   4. Use o menu Frota > Admin > Criar/validar base (autorize quando o Google pedir).
 * Para atualizar: repita os passos 1 a 3 com o texto da versao nova.
 *
 * Gerado por "npm run build" a partir do repositorio frota-gobor. Nao edite aqui.
 */
`;
/** Troca todo caractere não ASCII por \\uXXXX (válido em strings, regex e comentários). */
function ascii(texto) {
  let saida = '';
  for (const ch of texto) {
    const cp = ch.codePointAt(0);
    if (cp < 128) { saida += ch; continue; }
    const unidades = cp > 0xffff ? [0xd800 + ((cp - 0x10000) >> 10), 0xdc00 + ((cp - 0x10000) & 0x3ff)] : [cp];
    saida += unidades.map((u) => '\\u' + u.toString(16).padStart(4, '0')).join('');
  }
  return saida;
}
const corpo = ascii(arquivos.map((n) => `\n// ===== ${n} =====\n` + readFileSync(`${dir}/${n}`, 'utf8')).join('\n'));
if (/[^\x00-\x7f]/.test(cabecalho + corpo)) throw new Error('dist/Frota.gs ainda tem caracteres não ASCII');
mkdirSync('dist', { recursive: true });
writeFileSync('dist/Frota.gs', cabecalho + corpo);
console.log(`OK: apps-script/server/00_core.js, 01_painel.js e dist/Frota.gs (${Math.round((cabecalho + corpo).length / 1024)} KB)`);
