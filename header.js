MegaPage.register("header", (root, config) => {
  const header = root.querySelector(".site-header");
  const toggle = header.querySelector(".site-header__toggle");
  const menu = header.querySelector(".header-menu");
  const compact = matchMedia("(max-width: 1400px)");
  const reset = () => {
    toggle.setAttribute("aria-expanded", "false");
    document.documentElement.classList.remove("page--menu-open");
  };
  const close = () => {
    menu.close();
    reset();
  };
  toggle.addEventListener("click", () => {
    if (!compact.matches || menu.open) return;
    menu.showModal();
    toggle.setAttribute("aria-expanded", "true");
    document.documentElement.classList.add("page--menu-open");
  });
  menu.querySelector(".header-menu__close").addEventListener("click", close);
  menu.addEventListener("close", reset);
  menu.addEventListener("click", (event) => {
    if (event.target !== menu) return;
    const bounds = menu.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      close();
  });
  menu.querySelectorAll("a").forEach((link) =>
    link.addEventListener("click", () => {
      if (link.hasAttribute("data-placeholder-link")) return;
      close();
      const target = link.hash && root.querySelector(link.hash);
      if (target) {
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
    }),
  );
  compact.addEventListener("change", () => {
    if (menu.open) close();
  });
});
