import { pendingView } from '../components/ui.js';

export const title = 'Metas';
export const icon = 'goals';

export const render = () => pendingView({
  title, subtitle: 'Guarde dinheiro para o que importa.',
  items: ['Metas com valor desejado, prazo e progresso', 'Contribuições e retiradas, com histórico', 'Valor reservado separado das despesas, para não contar em dobro', 'Retiradas atualizam o saldo disponível automaticamente'],
});
