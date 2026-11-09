import { el, pendingView } from '../components/ui.js';
import { formatBRL } from '../utils/currency.js';

export const title = 'Painel';
export const icon = 'dashboard';

// Etapa 3: estes totais virão de services/calculations.js.
const totals = { generalCents: 0, reservedCents: 0 };

function monthFilter() {
  const now = new Date();
  const value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return el('label', { class: 'field' }, 'Mês (ativa na Etapa 3)', el('input', { type: 'month', value, disabled: true }));
}

function readout(kind, label, cents) {
  return el('div', { class: 'readout' }, el('dt', {}, el('span', { class: `dot ${kind}` }), label), el('dd', {}, formatBRL(cents)));
}

export function render() {
  const { generalCents, reservedCents } = totals;
  const availableCents = generalCents - reservedCents;
  const reservedPct = generalCents > 0 ? Math.min(100, Math.max(0, (reservedCents / generalCents) * 100)) : 0;

  const track = el('div', {
    class: 'flow__track', role: 'img',
    'aria-label': `Do saldo geral de ${formatBRL(generalCents)}, ${formatBRL(reservedCents)} estão reservados em metas e ${formatBRL(availableCents)} estão disponíveis.`,
  }, el('div', { class: 'flow__reserved' }), el('div', { class: 'flow__available' }));
  track.style.setProperty('--reserved', `${reservedPct}%`);
  track.style.setProperty('--available', generalCents > 0 ? `${100 - reservedPct}%` : '0%');

  const flow = el('section', { class: 'flow', 'aria-label': 'Saldos' },
    track,
    el('dl', { class: 'readouts' },
      readout('', 'Saldo geral', generalCents),
      readout('dot--reserved', 'Reservado em metas', reservedCents),
      readout('dot--available', 'Saldo disponível', availableCents)),
    el('p', { class: 'hint' }, 'Calculado a partir das movimentações que você registrar. Não é o saldo do seu banco.'));

  return pendingView({
    title, subtitle: 'Sua situação financeira no mês.', actions: monthFilter(), children: [flow],
    items: ['Resultado do mês e comparação com o mês anterior', 'Gráfico de receitas e despesas', 'Despesas por categoria', 'Últimas movimentações', 'Próximas despesas previstas'],
  });
}
