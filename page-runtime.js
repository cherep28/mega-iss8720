(() => {
  const dependencies = { Swiper: window.Swiper, Panzoom: window.Panzoom };
  for (const name of window.MegaVendorPrevious ? ["Swiper", "Panzoom"] : []) {
    const previous = window.MegaVendorPrevious?.[name];
    if (previous === undefined) delete window[name];
    else window[name] = previous;
  }
  delete window.MegaVendorPrevious;
  if (window.MegaPage) return;
  const assetBase = new URL(".", document.currentScript.src);
  const components = new Map();
  const mounted = new WeakMap();
  function init(root = document.querySelector("[data-mega-page]")) {
    if (!root) return;
    if (!mounted.has(root)) mounted.set(root, new Set());
    const ready = mounted.get(root);
    for (const [name, setup] of components) {
      if (ready.has(name)) continue;
      setup(root, window.MegaPageConfig);
      ready.add(name);
    }
  }
  window.MegaPage = {
    init,
    dependencies,
    asset: (path) => new URL(path, assetBase).href,
    register(name, setup) {
      if (components.has(name)) return;
      components.set(name, setup);
      if (document.readyState !== "loading") init();
    },
  };
  document.addEventListener("DOMContentLoaded", () => init(), { once: true });
})();
