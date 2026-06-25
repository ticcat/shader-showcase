export function parseHash(hash) {
  const m = /^#\/(.+)$/.exec(hash || "");
  return m ? m[1] : null;
}

export function formatHash(id) {
  return `#/${id}`;
}

export function createRouter(manifest, onSelect) {
  const ids = new Set(manifest.map((l) => l.id));
  const resolve = () => {
    const id = parseHash(location.hash);
    return id && ids.has(id) ? id : manifest[0].id;
  };
  return {
    start() {
      const select = () => onSelect(resolve());
      window.addEventListener("hashchange", select);
      select();
    },
    go(id) {
      if (location.hash !== formatHash(id)) location.hash = formatHash(id);
      else onSelect(id);
    },
  };
}
