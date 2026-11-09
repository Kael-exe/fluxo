export function createRouter({ routes, outlet, fallback, loading, onError, onChange }) {
  let token = 0;
  const current = () => {
    const key = location.hash.replace(/^#\//, '');
    return Object.hasOwn(routes, key) ? key : fallback;
  };

  async function go() {
    const key = current();
    const id = ++token;
    outlet.setAttribute('aria-busy', 'true');
    outlet.replaceChildren(loading());
    let view;
    try {
      view = await routes[key].render();
    } catch (err) {
      console.error(err);
      view = onError(err);
    }
    if (id !== token) return;
    outlet.replaceChildren(view);
    outlet.removeAttribute('aria-busy');
    document.title = `${routes[key].title} · Fluxo`;
    onChange(key);
    outlet.querySelector('h1')?.focus();
    window.scrollTo(0, 0);
  }

  addEventListener('hashchange', go);
  go();
}
