MegaPage.register("tenants", (root, config) => {
  const section = root.querySelector(".tenants");
  if (!section) return;
  const viewport = section.querySelector(".tenants__viewport");
  const track = section.querySelector(".tenants__track");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  [...track.children].forEach((slide) => {
    const clone = slide.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    track.append(clone);
  });
  const slider = new MegaPage.dependencies.Swiper(viewport, {
    wrapperClass: "tenants__track",
    slideClass: "tenants__logo",
    loop: true,
    speed: reducedMotion.matches ? 0 : config.slider.speed,
    breakpoints: config.slider.breakpoints,
    grabCursor: true,
    navigation: {
      prevEl: section.querySelector('[data-direction="-1"]'),
      nextEl: section.querySelector('[data-direction="1"]'),
    },
    a11y: { prevSlideMessage: "Предыдущий арендатор", nextSlideMessage: "Следующий арендатор" },
  });
  section.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    event.key === "ArrowLeft" ? slider.slidePrev() : slider.slideNext();
  });
  reducedMotion.addEventListener("change", () => {
    slider.params.speed = reducedMotion.matches ? 0 : config.slider.speed;
  });
});
