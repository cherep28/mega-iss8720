MegaPage.register("map", (root, config) => {
  const geometry = window.MegaMapGeometry;
  const section = root.querySelector("#mall-map");
  if (!section) return;
  const records = window.MallCatalog?.entries || [];
  const rooms = {};
  const statusLabels = { available: "Свободно", occupied: "Занято", soon: "Скоро освободится" };
  const signature = (r) =>
    JSON.stringify([
      r.floor,
      r.area,
      r.rate,
      r.category,
      r.statusCode,
      r.image,
      r.el.querySelector(".room-price").textContent.replace(/\s/g, ""),
    ]);
  for (const [id, shape] of Object.entries(geometry)) {
    const candidates = records.filter((r) => r.id === id && r.floor === 2);
    const ambiguous = new Set(candidates.map(signature)).size > 1;
    const record = ambiguous ? null : candidates[0];
    rooms[id] = {
      id,
      floor: 2,
      status: record?.statusCode || shape.status,
      area: record?.areaLabel || { 200: "30,9 м²", 205: "204 м²" }[id] || "",
      category: record?.category || "",
      image: record?.image || "",
      cardSelector: record?.cardSelector || null,
      ambiguous,
      path: shape.path,
      source: shape.source,
    };
  }
  const floors = {
    2: {
      image: MegaPage.asset("assets/mall-plan-original.svg"),
      width: 1270,
      height: 742,
      rooms: Object.values(rooms),
    },
  };
  const canvas = section.querySelector(".mall-map__canvas");
  const size = section.querySelector(".mall-map__size");
  const layer = section.querySelector(".mall-map__layer");
  const svg = section.querySelector(".mall-map__regions");
  const card = section.querySelector(".mall-map__tooltip");
  const empty = section.querySelector(".mall-map__empty");
  const announce = section.querySelector(".mall-map__announcement");
  const details = section.querySelector('[data-map-action="details"]');
  const apply = section.querySelector('[data-map-action="apply"]');
  const zoomIn = section.querySelector('[data-zoom="in"]');
  const zoomOut = section.querySelector('[data-zoom="out"]');
  let floor = 2,
    zoom = 1,
    active = null,
    activeElement = null;
  let statusFilter = null;
  function highlightStatus() {
    section.querySelectorAll("[data-map-status]").forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.mapStatus === (statusFilter || "all")),
      );
    });
    svg.querySelectorAll(".mall-map__room").forEach((room) => {
      room.classList.toggle(
        "mall-map__room--muted",
        !!statusFilter && room.dataset.status !== statusFilter,
      );
    });
  }
  section.querySelectorAll("[data-map-status]").forEach((button) =>
    button.addEventListener("click", () => {
      statusFilter =
        button.dataset.mapStatus === "all" || statusFilter === button.dataset.mapStatus
          ? null
          : button.dataset.mapStatus;
      closeCard();
      highlightStatus();
      const count = (floors[floor]?.rooms || []).filter(
        (room) => !statusFilter || room.status === statusFilter,
      ).length;
      announce.textContent = floors[floor]
        ? `${statusFilter ? statusLabels[statusFilter] : "Все статусы"}: помещений ${count}.`
        : `Схема ${floor} этажа пока не добавлена.`;
    }),
  );
  function closeCard(returnFocus = false) {
    if (returnFocus) activeElement?.focus({ preventScroll: true });
    card.hidden = true;
    svg.querySelectorAll(".mall-map__room--selected").forEach((el) => {
      el.classList.remove("mall-map__room--selected");
      el.setAttribute("aria-expanded", "false");
    });
    active = null;
  }
  function show(room, element) {
    if (active === room && !card.hidden) return;
    active = room;
    activeElement = element;
    svg.querySelectorAll(".mall-map__room").forEach((el) => {
      el.classList.toggle("mall-map__room--selected", el === element);
      el.setAttribute("aria-expanded", String(el === element));
    });
    section.querySelector("#map-room-title").textContent = `Помещение №${room.id}`;
    const status = section.querySelector(".mall-map__tooltip-status");
    status.textContent = statusLabels[room.status];
    status.dataset.status = room.status;
    section.querySelector(".mall-map__room-meta").textContent =
      `${room.floor} этаж · ${room.area || "Площадь не указана"}`;
    section.querySelector(".mall-map__room-category").textContent = room.category;
    section.querySelector(".mall-map__room-note").textContent = room.ambiguous
      ? "Данные помещения уточняются."
      : room.cardSelector
        ? ""
        : "Подробные данные пока не добавлены.";
    const photo = section.querySelector(".mall-map__room-photo");
    photo.replaceChildren();
    if (room.image) {
      const img = document.createElement("img");
      img.src = room.image;
      img.alt = `Помещение №${room.id}`;
      photo.append(img);
    } else {
      const text = document.createElement("span");
      text.textContent = "Фото помещения пока нет";
      photo.append(text);
    }
    details.disabled = !room.cardSelector;
    card.hidden = false;
    announce.textContent = `Помещение №${room.id}, ${statusLabels[room.status]}, ${room.area || "площадь не указана"}`;
  }
  size.replaceWith(layer);
  let dragging = false;
  let suppressClick = false;
  let pointerStart = null;
  const camera = MegaPage.dependencies.Panzoom(layer, {
    canvas: true,
    contain: "outside",
    minScale: config.map.minScale,
    maxScale: config.map.maxScale,
    step: config.map.step,
    animate: false,
  });
  function updateZoom() {
    zoom = camera.getScale();
    section.querySelector(".mall-map__zoom output").textContent = `${Math.round(zoom * 100)}%`;
    zoomOut.disabled = zoom <= config.map.minScale;
    zoomIn.disabled = zoom >= config.map.maxScale;
  }
  canvas.addEventListener(
    "pointerdown",
    (event) => {
      suppressClick = false;
      pointerStart = { x: event.clientX, y: event.clientY };
    },
    true,
  );
  canvas.addEventListener("pointermove", (event) => {
    if (!pointerStart) {
      if (event.pointerType === "mouse") suppressClick = false;
      return;
    }
    if (Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 6) {
      dragging = true;
      suppressClick = true;
      closeCard();
    }
  });
  layer.addEventListener("panzoomend", () => {
    dragging = false;
    pointerStart = null;
  });
  layer.addEventListener("panzoomzoom", updateZoom);
  canvas.addEventListener(
    "click",
    (event) => {
      if (suppressClick && event.detail !== 0) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true,
  );
  canvas.addEventListener("keydown", (event) => {
    if (event.target !== canvas) return;
    const offsets = {
      ArrowLeft: [60, 0],
      ArrowRight: [-60, 0],
      ArrowUp: [0, 60],
      ArrowDown: [0, -60],
    };
    if (offsets[event.key]) {
      event.preventDefault();
      const [x, y] = offsets[event.key];
      camera.pan(x / zoom, y / zoom, { relative: true });
    }
  });
  let previousWidth = 0;
  function resize(force = false) {
    const plan = floors[floor];
    if (!plan || !canvas.clientWidth) return;
    const width = Math.max(640, canvas.clientWidth);
    if (width === previousWidth && !force) return;
    previousWidth = width;
    const height = (width * plan.height) / plan.width;
    canvas.style.height = `${Math.min(height, 742)}px`;
    layer.style.width = `${width}px`;
    layer.style.height = `${height}px`;
    camera.reset({ animate: false });
    requestAnimationFrame(() => {
      camera.pan(0, 0, { force: true });
      updateZoom();
    });
  }
  function selectFloor(value) {
    closeCard();
    floor = value;
    zoom = 1;
    section
      .querySelectorAll("[data-floor]")
      .forEach((button) =>
        button.setAttribute("aria-pressed", String(+button.dataset.floor === floor)),
      );
    const plan = floors[floor];
    svg.replaceChildren();
    canvas.hidden = !plan;
    empty.hidden = !!plan;
    zoomIn.disabled = zoomOut.disabled = !plan;
    section.querySelector(".mall-map__zoom output").textContent = "100%";
    empty.textContent = `Схема ${floor} этажа пока не добавлена.`;
    announce.textContent = plan ? `Показана схема ${floor} этажа` : empty.textContent;
    if (!plan) return;
    canvas.setAttribute(
      "aria-label",
      `Схема ${floor} этажа. Перетаскивайте схему или используйте стрелки клавиатуры`,
    );
    const image = layer.querySelector("img");
    image.src = plan.image;
    image.alt = `Оригинальная схема ${floor} этажа ТЦ МЕГА`;
    svg.setAttribute("aria-label", `Помещения ${floor} этажа`);
    svg.setAttribute("viewBox", `0 0 ${plan.width} ${plan.height}`);
    for (const room of plan.rooms) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", room.path);
      path.classList.add("mall-map__room");
      path.dataset.id = room.id;
      path.dataset.status = room.status;
      path.setAttribute("tabindex", "0");
      path.setAttribute("role", "button");
      path.setAttribute(
        "aria-label",
        `Помещение №${room.id}, ${statusLabels[room.status]}${room.area ? ", " + room.area : ""}`,
      );
      path.setAttribute("aria-controls", "map-room-card");
      path.setAttribute("aria-expanded", "false");
      path.addEventListener("pointerenter", (event) => {
        if (
          event.pointerType !== "touch" &&
          !dragging &&
          !suppressClick &&
          !card.contains(document.activeElement)
        )
          show(room, path);
      });
      path.addEventListener("focus", () => show(room, path));
      path.addEventListener("click", () => show(room, path));
      path.addEventListener("keydown", (event) => {
        if (["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) {
          event.preventDefault();
          const items = [...svg.children];
          const step = ["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1;
          items[(items.indexOf(path) + step + items.length) % items.length].focus();
        }
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          show(room, path);
          (details.disabled ? apply : details).focus();
        }
        if (event.key === "Tab" && !event.shiftKey && !card.hidden) {
          event.preventDefault();
          section.querySelector(".mall-map__card-close").focus();
        }
      });
      svg.append(path);
    }
    highlightStatus();
    resize(true);
  }
  section
    .querySelectorAll("[data-floor]")
    .forEach((button) =>
      button.addEventListener("click", () => selectFloor(+button.dataset.floor)),
    );
  section.querySelectorAll("[data-zoom]").forEach((button) => {
    button.addEventListener("click", () => {
      const step = button.dataset.zoom === "in" ? config.map.step : -config.map.step;
      camera.zoom(camera.getScale() + step);
    });
  });
  section.querySelector(".mall-map__card-close").addEventListener("click", () => closeCard(true));
  section.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !card.hidden) {
      event.preventDefault();
      closeCard(true);
    }
  });
  details.addEventListener("click", () => {
    if (active?.cardSelector)
      window.MallDetails.open(root.querySelector(active.cardSelector), details);
  });
  apply.addEventListener("click", () => {
    if (active) window.MallForms.open(`Помещение №${active.id}, ${active.floor} этаж`, apply);
  });
  new ResizeObserver(() => resize()).observe(canvas);
  window.MallMap = { rooms, floors, selectFloor, camera };
  selectFloor(2);
});
