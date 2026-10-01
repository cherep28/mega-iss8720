MegaPage.register("catalog", (root, config) => {
  const grid = root.querySelector(".catalog__grid");
  const cards = [...grid.children];
  const number = (text) => parseFloat(text.replace(/\s/g, "").replace(",", "."));
  const data = cards.map((el, index) => ({
    el,
    index,
    area: number(el.querySelectorAll(".room-card__tags>span")[1].textContent),
    floor: number(el.querySelector(".room-card__tags>span").textContent),
    rate: number(el.querySelector(".room-price strong:last-child").textContent),
    category: el.querySelector(".room-card__category").textContent.trim(),
    status: el.querySelector(".room-status").textContent.trim(),
  }));
  data.forEach((record) => {
    record.id = record.el
      .querySelector("h3")
      .textContent.match(/№\s*(.+)/)?.[1]
      .trim();
    record.areaLabel = record.el.querySelectorAll(".room-card__tags>span")[1].textContent.trim();
    record.statusCode =
      record.status === "Свободно" ? "available" : record.status === "Занято" ? "occupied" : "soon";
    record.image = record.el.querySelector(".room-card__photo > img")?.getAttribute("src") || "";
    record.el.dataset.catalogKey = `room-${record.index}`;
    record.cardSelector = `[data-catalog-key="room-${record.index}"]`;
  });
  window.MallCatalog = { entries: data };
  const panel = root.querySelector(".catalog-filter");
  panel.id = "catalog-filter-panel";
  const ranges = [...panel.querySelectorAll(".catalog-filter__range")].map((group, i) => {
    const max = Math.ceil(Math.max(...data.map((d) => (i ? d.rate : d.area))));
    group.querySelector(".range-control__track").remove();
    group.querySelector(".range-control__values").remove();
    const values = document.createElement("div");
    values.className = "range-control";
    ["От", "До"].forEach((label, n) => {
      const input = document.createElement("input");
      input.type = "range";
      input.min = "0";
      input.max = String(max);
      input.step = "0.01";
      input.value = String(n ? max : 0);
      input.setAttribute("aria-label", `${i ? "Ставка" : "Площадь"} ${label.toLowerCase()}`);
      values.append(input);
    });
    group.append(values);
    const outputs = document.createElement("div");
    outputs.className = "range-control__values";
    outputs.innerHTML = "<span></span><span></span>";
    group.append(outputs);
    const pair = [...values.querySelectorAll("input")];
    const refresh = () =>
      pair.forEach((input, n) => {
        outputs.children[n].textContent =
          Number(input.value).toLocaleString("ru-RU", { maximumFractionDigits: 2 }) +
          (i ? " руб / м²" : " м²");
        input.setAttribute("aria-valuetext", outputs.children[n].textContent);
      });
    pair.forEach((input, n) =>
      input.addEventListener("input", () => {
        if (+pair[0].value > +pair[1].value) input.value = pair[1 - n].value;
        refresh();
      }),
    );
    pair.forEach((input) => {
      input.refresh = refresh;
    });
    refresh();
    return pair;
  });
  const dropdowns = [];
  function select(old, label, options) {
    const select = document.createElement("select");
    select.setAttribute("aria-label", label);
    options.forEach(([value, text]) => select.add(new Option(text, value)));
    const classes = old.className;
    old.replaceWith(select);
    dropdowns.push(MegaDropdown(select, classes));
    return select;
  }
  const choices = panel.querySelectorAll(".catalog-filter__choice .catalog-filter__select");
  const status = select(choices[0], "Статус", [
    ["", "Все"],
    ...["Свободно", "Занято", "Скоро освободится"].map((s) => [s, s]),
  ]);
  const category = select(choices[1], "Категория", [
    ["", "Все"],
    ...[...new Set(data.map((d) => d.category))].map((s) => [s, s]),
  ]);
  const sorts = [
    ["default", "По умолчанию"],
    ["area-up", "Площадь: по возрастанию"],
    ["area-down", "Площадь: по убыванию"],
    ["rate-up", "Ставка: по возрастанию"],
    ["rate-down", "Ставка: по убыванию"],
  ];
  const sort = select(panel.querySelector(".catalog-filter__sort"), "Сортировка", sorts);
  const mobileSort = select(root.querySelector(".catalog__mobile-sort"), "Сортировка", sorts);
  const floors = new Set();
  panel.querySelectorAll(".catalog-filter__floor-options button").forEach((b) => {
    b.removeAttribute("aria-disabled");
    b.setAttribute("aria-pressed", "false");
    b.onclick = () => {
      const n = Number(b.textContent);
      floors.has(n) ? floors.delete(n) : floors.add(n);
      b.setAttribute("aria-pressed", String(floors.has(n)));
    };
  });
  let filtered = [...data],
    page = 1,
    all = false;
  const pagination = root.querySelector(".pagination");
  const summary = document.createElement("p");
  summary.className = "catalog__summary";
  summary.setAttribute("role", "status");
  grid.before(summary);
  const empty = document.createElement("p");
  empty.className = "catalog__empty";
  empty.textContent = "Помещения не найдены. Измените параметры или сбросьте фильтры.";
  grid.after(empty);
  function render() {
    [status, category, sort, mobileSort].forEach((s) => s.refresh());
    ranges.flat().forEach((i) => i.refresh());
    const size = innerWidth <= 600 ? config.catalog.mobilePageSize : config.catalog.desktopPageSize;
    const count = Math.max(1, Math.ceil(filtered.length / size));
    page = Math.min(page, count);
    const order = [...filtered];
    const [key, direction] = sort.value.split("-");
    if (key !== "default")
      order.sort(
        (a, b) => (a[key] - b[key]) * (direction === "down" ? -1 : 1) || a.index - b.index,
      );
    cards.forEach((c) => {
      c.hidden = true;
    });
    (all ? order : order.slice((page - 1) * size, page * size)).forEach((d) => {
      grid.append(d.el);
      d.el.hidden = false;
    });
    summary.textContent = `Найдено помещений: ${filtered.length}`;
    empty.hidden = filtered.length > 0;
    pagination.replaceChildren();
    pagination.hidden = filtered.length === 0;
    function button(text, label, fn, disabled = false, current = false) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "pagination__button";
      b.textContent = text;
      b.setAttribute("aria-label", label);
      b.disabled = disabled;
      if (current) {
        b.classList.add("pagination__button--current");
        b.setAttribute("aria-current", "page");
      }
      b.onclick = () => {
        fn();
        render();
        root.querySelector("#catalog").scrollIntoView({ block: "start" });
      };
      pagination.append(b);
      return b;
    }
    button("‹", "Предыдущая страница", () => page--, all || page === 1);
    for (let n = 1; n <= count; n++)
      button(
        String(n),
        `Страница ${n}`,
        () => {
          all = false;
          page = n;
        },
        false,
        !all && page === n,
      );
    button(
      "Все",
      "Все помещения",
      () => {
        all = !all;
        page = 1;
      },
      false,
      all,
    ).classList.add("pagination__button--all");
    button("›", "Следующая страница", () => page++, all || page === count);
  }
  function apply() {
    for (const pair of ranges) {
      pair.forEach((i) => i.setCustomValidity(""));
      if (
        pair.some((i) => !i.value || !i.checkValidity()) ||
        Number(pair[0].value) > Number(pair[1].value)
      ) {
        pair[0].setCustomValidity("Укажите допустимый диапазон: от меньшего значения к большему.");
        pair[0].reportValidity();
        return;
      }
    }
    filtered = data.filter(
      (d) =>
        d.area >= Number(ranges[0][0].value) &&
        d.area <= Number(ranges[0][1].value) &&
        d.rate >= Number(ranges[1][0].value) &&
        d.rate <= Number(ranges[1][1].value) &&
        (!floors.size || floors.has(d.floor)) &&
        (!status.value || d.status === status.value) &&
        (!category.value || d.category === category.value),
    );
    page = 1;
    all = false;
    render();
  }
  const applyButton = panel.querySelector(".catalog-filter__apply");
  applyButton.removeAttribute("aria-disabled");
  applyButton.onclick = apply;
  ranges.flat().forEach((i) => i.addEventListener("input", () => i.setCustomValidity("")));
  const reset = document.createElement("button");
  reset.type = "button";
  reset.className = "catalog-filter__reset";
  reset.textContent = "Сбросить фильтры";
  panel.append(reset);
  reset.onclick = () => {
    ranges.forEach((pair) =>
      pair.forEach((i, n) => {
        i.value = n ? i.max : "0";
        i.setCustomValidity("");
      }),
    );
    status.value = "";
    category.value = "";
    floors.clear();
    panel
      .querySelectorAll("[aria-pressed]")
      .forEach((b) => b.setAttribute("aria-pressed", "false"));
    sort.value = mobileSort.value = "default";
    apply();
  };
  [sort, mobileSort].forEach(
    (s) =>
      (s.onchange = () => {
        sort.value = mobileSort.value = s.value;
        page = 1;
        render();
      }),
  );
  const toggle = root.querySelector(".catalog__filter-toggle");
  toggle.removeAttribute("aria-disabled");
  toggle.setAttribute("aria-controls", panel.id);
  const toggleText = toggle.querySelector(".catalog__filter-toggle-text");
  const compactFilters = matchMedia("(max-width: 1100px)");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let filterAnimation = null;
  const animatedProperties = ["height", "paddingTop", "paddingBottom", "marginTop", "opacity"];

  function clearFilterAnimation() {
    filterAnimation?.cancel();
    filterAnimation = null;
    panel.style.removeProperty("display");
    panel.style.removeProperty("overflow");
    panel.inert = compactFilters.matches && !panel.classList.contains("catalog-filter--open");
  }

  function setFiltersOpen(open, animate = false) {
    const currentStyle = getComputedStyle(panel);
    const from = Object.fromEntries(
      animatedProperties.map((property) => [property, currentStyle[property]]),
    );
    if (currentStyle.display === "none") {
      animatedProperties.forEach((property) => {
        from[property] = property === "opacity" ? "0" : "0px";
      });
    }
    clearFilterAnimation();
    panel.classList.toggle("catalog-filter--open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggleText.textContent = open ? "Скрыть фильтры" : "Показать фильтры";
    panel.inert = compactFilters.matches && !open;
    if (!animate || !compactFilters.matches || reducedMotion.matches) return;

    dropdowns.forEach((dropdown) => dropdown.close());
    panel.style.display = "grid";
    const targetStyle = getComputedStyle(panel);
    const to = Object.fromEntries(
      animatedProperties.map((property) => [
        property,
        open ? targetStyle[property] : property === "opacity" ? "0" : "0px",
      ]),
    );
    panel.style.overflow = "hidden";
    filterAnimation = panel.animate([from, to], {
      duration: 280,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    });
    filterAnimation.onfinish = clearFilterAnimation;
  }
  setFiltersOpen(true);
  toggle.onclick = () => {
    setFiltersOpen(!panel.classList.contains("catalog-filter--open"), true);
  };
  window.addEventListener("resize", clearFilterAnimation);
  reducedMotion.addEventListener("change", clearFilterAnimation);
  panel.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.tagName === "INPUT") {
      e.preventDefault();
      apply();
    }
  });
  [matchMedia("(max-width:600px)"), matchMedia("(max-width:1100px)")].forEach((m) =>
    m.addEventListener("change", render),
  );
  render();
});
