import { pendingView } from '../components/ui.js';

export const title = 'Orçamentos';
export const icon = 'budgets';

export const render = () => pendingView({
  title, subtitle: 'Limites mensais por categoria.',
  items: ['Valor definido, usado e restante', 'Percentual consumido', 'Alerta ao chegar perto ou passar do limite'],
});
