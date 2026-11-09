import { pendingView } from '../components/ui.js';

export const title = 'Relatórios';
export const icon = 'reports';

export const render = () => pendingView({
  title, subtitle: 'Entenda para onde o dinheiro vai.',
  items: ['Receitas e despesas por período', 'Gastos por categoria e por meio de pagamento', 'Comparação mensal e evolução do saldo', 'Contribuições a metas ficam fora das despesas'],
});
