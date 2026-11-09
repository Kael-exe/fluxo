import { el, pendingView } from '../components/ui.js';

export const title = 'Backup e dados';
export const icon = 'backup';

const notice = el('div', { class: 'notice', role: 'note' },
  el('strong', {}, 'Seus dados ficam só neste navegador. '),
  'Se você limpar os dados do site ou perder o aparelho, eles somem. Exporte backups com frequência. O armazenamento local não é criptografado.');

export const render = () => pendingView({
  title, subtitle: 'Exporte, importe e restaure seus dados.', children: [notice],
  items: ['Exportar tudo em JSON e movimentações em CSV', 'Importar backup com validação do arquivo', 'Aviso antes de substituir ou mesclar dados'],
});
