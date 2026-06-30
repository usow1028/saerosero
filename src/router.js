const routes = new Map();

export function route(path, handler) {
  routes.set(path, handler);
}

export function navigate(path, state = {}) {
  const full = path.startsWith('/') ? path : `/${path}`;
  history.pushState(state, '', `#${full}`);
  return dispatch(full, state);
}

export function startRouter(onRoute) {
  window.addEventListener('popstate', () => dispatch(location.hash.slice(1) || '/', history.state ?? {}));
  window.addEventListener('hashchange', () => dispatch(location.hash.slice(1) || '/', history.state ?? {}));
  return dispatch(location.hash.slice(1) || '/', history.state ?? {});
}

function matchRoute(path) {
  if (routes.has(path)) return { handler: routes.get(path), params: {} };
  for (const [pattern, handler] of routes) {
    if (!pattern.includes(':')) continue;
    const re = new RegExp(`^${pattern.replace(/:[^/]+/g, '([^/]+)')}$`);
    const m = path.match(re);
    if (m) {
      const keys = [...pattern.matchAll(/:([^/]+)/g)].map((x) => x[1]);
      const params = Object.fromEntries(keys.map((k, i) => [k, m[i + 1]]));
      return { handler, params };
    }
  }
  return null;
}

function dispatch(path, state) {
  const clean = path.split('?')[0] || '/';
  const matched = matchRoute(clean);
  if (!matched) return navigate('/');
  return matched.handler({ params: matched.params, state });
}

export { dispatch };