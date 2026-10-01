MegaPage.register("details", (root, config) => {
  const dialog = document.createElement("dialog");
  dialog.className = "room-details";
  dialog.setAttribute("aria-labelledby", "details-title");
  dialog.innerHTML = `
    <button class="modal-close" type="button" aria-label="Закрыть информацию о помещении">
      ×
    </button>
    <div class="room-details__photo"></div>
    <div class="room-details__content">
      <div class="room-details__status"></div>
      <h2 id="details-title"></h2>
      <dl class="room-details__facts"></dl>
      <div class="room-details__neighbors">
        <p>Ближайшие арендаторы</p>
        <div class="room-details__neighbor-logos"></div>
      </div>
      <div class="room-details__bottom">
        <div class="room-details__price"></div>
        <button type="button" class="button room-details__apply">Оставить заявку</button>
      </div>
    </div>
  `;
  root.append(dialog);
  let gallery;
  let currentCard;
  let opener;
  const close = () => dialog.close();
  dialog.querySelector(".modal-close").addEventListener("click", close);
  dialog.addEventListener("close", () =>
    document.documentElement.classList.remove("page--details-open"),
  );
  dialog.addEventListener("click", (event) => {
    const r = dialog.getBoundingClientRect();
    if (
      event.target === dialog &&
      (event.clientX < r.left ||
        event.clientX > r.right ||
        event.clientY < r.top ||
        event.clientY > r.bottom)
    )
      close();
  });
  function open(card, source = document.activeElement) {
    if (!card || dialog.open) return;
    opener = source;
    currentCard = card;
    const title = currentCard.querySelector("h3").textContent;
    dialog.querySelector("h2").textContent = title;
    const is204 = title.trim().endsWith("№204");
    const photo = dialog.querySelector(".room-details__photo");
    photo.replaceChildren();
    gallery?.destroy(true, true);
    gallery = null;
    const image = currentCard.querySelector(".room-card__photo>img");
    const roomId = title.match(/№\s*(\d+)/)?.[1];
    const photos = image ? [{ src: image.src, alt: title }] : [];
    photos.push(
      ...(config.roomPhotos?.[roomId] || []).map((item) => ({
        ...item,
        src: MegaPage.asset(item.src),
      })),
    );
    if (photos.length) {
      const track = document.createElement("div");
      track.className = "room-details__track";
      photos.forEach((item) => {
        const slide = document.createElement("div");
        slide.className = "room-details__slide";
        const img = document.createElement("img");
        img.src = item.src;
        img.alt = item.alt;
        slide.append(img);
        track.append(slide);
      });
      photo.append(track);
    } else {
      const placeholder = document.createElement("p");
      placeholder.textContent = "Фото помещения пока нет";
      photo.append(placeholder);
    }
    const status = currentCard.querySelector(".room-status").cloneNode(true);
    dialog.querySelector(".room-details__status").replaceChildren(status);
    for (const direction of [-1, 1]) {
      const arrow = document.createElement("button");
      arrow.className =
        "arrow room-details__arrow " + (direction < 0 ? "arrow--previous" : "arrow--next");
      arrow.type = "button";
      arrow.disabled = photos.length < 2;
      arrow.setAttribute("aria-label", direction < 0 ? "Предыдущее фото" : "Следующее фото");
      arrow.append(document.createElement("span"));
      photo.append(arrow);
    }
    const facts = dialog.querySelector(".room-details__facts");
    facts.replaceChildren();
    const tags = [...currentCard.querySelectorAll(".room-card__tags>span")];
    const rows = [
      ["Этаж", tags[0].textContent.trim().replace(/\s*этаж/i, "")],
      ["Площадь", tags[1].textContent.trim()],
      ["Назначение", currentCard.querySelector(".room-card__category").textContent],
      ["Состояние", is204 ? "С ремонтом" : "—"],
      ["Возможность перепланировки", is204 ? "Да" : "—"],
      ["Электромощность", is204 ? "220 кВт" : "—"],
      ["Высота потолков", is204 ? "3,6 м" : "—"],
      ["Коммуникации", is204 ? "Нет" : "—"],
    ];
    rows.forEach(([caption, text]) => {
      const item = document.createElement("div");
      const label = document.createElement("dt");
      label.textContent = caption;
      const value = document.createElement("dd");
      value.textContent = text;
      item.append(label, value);
      facts.append(item);
    });
    const prices = currentCard.querySelector(".room-price").cloneNode(true);
    dialog.querySelector(".room-details__price").replaceChildren(prices);
    const neighbors = dialog.querySelector(".room-details__neighbor-logos");
    neighbors.replaceChildren();
    if (is204) {
      for (const number of [35, 36, 37, 38, 42]) {
        const logo = document.createElement("img");
        logo.src = MegaPage.asset(`assets/2317-759-imgRectangle${number}.png`);
        logo.alt = {
          35: "Рандеву",
          36: "Социальная аптека",
          37: "Samsung",
          38: "Л’Окситан",
          42: "ЛЭТУАЛЬ",
        }[number];
        neighbors.append(logo);
      }
    } else neighbors.textContent = "—";
    dialog.showModal();
    if (photos.length > 1) {
      gallery = new MegaPage.dependencies.Swiper(photo, {
        wrapperClass: "room-details__track",
        slideClass: "room-details__slide",
        slidesPerView: 1,
        rewind: true,
        speed: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 250,
        navigation: {
          prevEl: photo.querySelector(".arrow--previous"),
          nextEl: photo.querySelector(".arrow--next"),
        },
        a11y: { prevSlideMessage: "Предыдущее фото", nextSlideMessage: "Следующее фото" },
      });
    }
    dialog.scrollTop = 0;
    document.documentElement.classList.add("page--details-open");
  }
  window.MallDetails = { open };
  dialog.addEventListener("close", () => opener?.focus({ preventScroll: true }));
  root.querySelectorAll(".room-card__actions .button:first-child").forEach((button) => {
    button.removeAttribute("aria-disabled");
    button.addEventListener("click", () => open(button.closest(".room-card"), button));
  });
  dialog.querySelector(".room-details__apply").addEventListener("click", () => {
    close();
    currentCard.querySelector(".room-card__actions .button:last-child").click();
    const formDialog = root.querySelector(".rental-modal");
    const returnTo = opener;
    formDialog.addEventListener("close", () => returnTo.focus({ preventScroll: true }), {
      once: true,
    });
  });
});
