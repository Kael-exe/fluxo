/** Cria elementos sem innerHTML: textos entram como nós de texto, nunca como HTML. */
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === 'class') node.className = value;
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else if (value !== false && value != null) node.setAttribute(key, value);
  }
  node.append(...children.flat().filter((c) => c != null && c !== false));
  return node;
}

export function pageHead(title, subtitle, actions) {
  return el('header', { class: 'page-head' },
    el('div', {}, el('h1', { tabindex: '-1' }, title), subtitle && el('p', {}, subtitle)),
    actions);
}

export function pendingView({ title, subtitle, items = [], actions, children = [] }) {
  return el('div', {},
    pageHead(title, subtitle, actions),
    ...children,
    el('section', { class: 'pending' },
      el('span', { class: 'chip' }, 'Etapa 3'),
      el('h2', {}, 'Em construção'),
      el('p', { class: 'hint' }, 'Esta tela ainda não grava nem calcula dados. Ela vai ter:'),
      el('ul', {}, items.map((i) => el('li', {}, i)))));
}

export const loadingView = () => el('div', { class: 'skeleton', role: 'status', 'aria-label': 'Carregando' });

export const errorView = () => el('section', { class: 'pending', role: 'alert' },
  el('h2', {}, 'Não foi possível abrir esta tela'),
  el('p', { class: 'hint' }, 'Recarregue a página e tente de novo.'));

let toastHost;
export function toast(message, type = 'success') {
  toastHost ??= document.body.appendChild(el('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' }));
  const t = el('div', { class: `toast toast--${type}` }, message);
  toastHost.append(t);
  setTimeout(() => t.remove(), 4000);
}

/** Resolve true se a pessoa confirmar, false se cancelar ou fechar com Esc. */
export function confirmDialog({ title, message, confirmLabel = 'Confirmar', danger = false }) {
  return new Promise((resolve) => {
    const dlg = el('dialog', { class: 'dialog', 'aria-labelledby': 'dlg-title' },
      el('h2', { id: 'dlg-title' }, title),
      el('p', {}, message),
      el('div', { class: 'dialog__actions' },
        el('button', { class: 'btn', type: 'button', onclick: () => dlg.close('cancel') }, 'Cancelar'),
        el('button', { class: `btn ${danger ? 'btn--danger' : 'btn--primary'}`, type: 'button', onclick: () => dlg.close('ok') }, confirmLabel)));
    dlg.addEventListener('close', () => { dlg.remove(); resolve(dlg.returnValue === 'ok'); });
    document.body.append(dlg);
    dlg.showModal();
  });
}
