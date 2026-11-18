// Gera docs/modelo-dados.md a partir de core/schema.js (fonte única).
import { writeFileSync } from 'node:fs';
import { TABELAS, ENUMS } from '../core/schema.js';

const linhas = [
  '# Modelo de dados',
  '',
  '> Gerado por `npm run docs:modelo` a partir de `core/schema.js`. Não edite à mão.',
  '',
  'Planilhas:',
  '- **BASE**: "🚛 Frota Gobor — Base" (Drive compartilhado).',
  '- **MOTORISTAS**: "🔒 Frota Gobor — Motoristas" (acesso restrito ADMIN/DP; decisão D-15).',
  '',
  'Legenda: **obr.** = obrigatório · **calc.** = calculado pelo sistema (coluna protegida) · **chave** = identifica o registro.',
  '',
];
for (const t of TABELAS) {
  linhas.push(`## ${t.nome}`, '', `${t.descricao}. Planilha: **${t.planilha}**${t.chave.length ? ` · chave: \`${t.chave.join(' + ')}\`` : ''}${t.sistema ? ' · aba de sistema (protegida)' : ''}.`, '');
  linhas.push('| Coluna | Tipo | Regras | Descrição |', '|---|---|---|---|');
  for (const c of t.colunas) {
    const regras = [c.obrigatorio && 'obr.', c.calculada && 'calc.', t.chave.includes(c.nome) && 'chave', c.fk && `→ ${c.fk}`].filter(Boolean).join(' · ');
    const tipo = c.tipo === 'enum' ? `enum \`${c.enum}\`` : c.tipo;
    linhas.push(`| \`${c.nome}\` | ${tipo} | ${regras} | ${c.descricao || ''} |`);
  }
  linhas.push('');
}
linhas.push('## Listas (enums)', '');
for (const [nome, valores] of Object.entries(ENUMS)) linhas.push(`- **${nome}**: ${valores.join(', ')}`);
linhas.push('');
writeFileSync('docs/modelo-dados.md', linhas.join('\n'));
console.log('OK: docs/modelo-dados.md');
