import { createRouter } from './core/router.js';
import { icon } from './components/icons.js';
import { el, errorView, loadingView } from './components/ui.js';
import * as dashboard from './modules/dashboard.js';
import * as transactions from './modules/transactions.js';
import * as categories from './modules/categories.js';
import * as budgets from './modules/budgets.js';
import * as goals from './modules/goals.js';
import * as reports from './modules/reports.js';
import * as backup from './modules/backup.js';

const routes = { painel: dashboard, movimentacoes: transactions, categorias: categories, orcamentos: budgets, metas: goals, relatorios: reports, dados: backup };

const nav = document.getElementById('nav');
for (const [key, mod] of Object.entries(routes)) {
  nav.append(el('a', { href: `#/${key}`, 'data-route': key }, icon(mod.icon), mod.title));
}

createRouter({
  routes,
  outlet: document.getElementById('main'),
  fallback: 'painel',
  loading: loadingView,
  onError: errorView,
  onChange: (key) => {
    for (const a of nav.children) {
      if (a.dataset.route === key) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    }
  },
});
