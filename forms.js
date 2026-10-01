MegaPage.register("forms", (root, config) => {
  const original = root.querySelector(".rental-form");
  const dialog = document.createElement("dialog");
  dialog.className = "rental-modal";
  dialog.setAttribute("aria-labelledby", "rental-title");
  dialog.innerHTML = `
    <button type="button" class="modal-close" aria-label="Закрыть форму"><svg class="rental-modal__close-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 5l14 14M19 5L5 19" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" /></svg></button>
    <img
      class="rental-modal__cover"
      src="${MegaPage.asset("assets/2317-806-imgRectangle1.png")}"
      alt="Торговый центр МЕГА"
    >
    <div class="rental-modal__heading">
      <h2 id="rental-title">Заявка на аренду</h2>
      <p>Заполните форму ниже и наш менеджер свяжется с вами в ближайшее время.</p>
      <p class="rental-modal__room"></p>
    </div>
  `;
  const modalForm = original.cloneNode(true);
  dialog.append(modalForm);
  root.append(dialog);
  const close = () => dialog.close();
  dialog.querySelector(".modal-close").addEventListener("click", close);
  dialog.addEventListener("close", () =>
    document.documentElement.classList.remove("page--rental-open"),
  );
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    )
      close();
  });
  let opener;
  function open(room = "", source = document.activeElement) {
    if (dialog.open) return;
    opener = source;
    modalForm.elements.room.value = room;
    dialog.querySelector(".rental-modal__room").textContent = room;
    modalForm.querySelector(".rental-form__status").textContent = "";
    dialog.showModal();
    dialog.scrollTop = 0;
    document.documentElement.classList.add("page--rental-open");
  }
  window.MallForms = { open };
  dialog.addEventListener("close", () => opener?.focus({ preventScroll: true }));
  root
    .querySelectorAll(".hero__cta, .room-card__actions .button:last-child, .header-menu__cta")
    .forEach((trigger) => {
      trigger.removeAttribute("aria-disabled");
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        open(trigger.closest(".room-card")?.querySelector("h3").textContent || "", trigger);
      });
    });
  root.querySelectorAll('.rental-form select[name="business"]').forEach((select) => {
    MegaDropdown(select, "rental-form__dropdown");
  });

  function setupPhoneMask(input) {
    function format() {
      const raw = input.value;
      const caret = input.selectionStart ?? raw.length;
      let digits = raw.replace(/\D/g, "");
      let beforeCaret = raw.slice(0, caret).replace(/\D/g, "").length;
      if (/^[78]/.test(digits)) {
        digits = digits.slice(1);
        beforeCaret = Math.max(0, beforeCaret - 1);
      }
      digits = digits.slice(0, 10);
      let value = "+7";
      if (digits.length) value += " (" + digits.slice(0, 3);
      if (digits.length >= 3) value += ")";
      if (digits.length > 3) value += " " + digits.slice(3, 6);
      if (digits.length > 6) value += "-" + digits.slice(6, 8);
      if (digits.length > 8) value += "-" + digits.slice(8, 10);
      input.value = value;
      let position = value.length;
      if (caret < raw.length && beforeCaret < digits.length) {
        let count = 0;
        position = Math.min(4, value.length);
        for (let index = 4; index < value.length; index++) {
          if (/\d/.test(value[index])) count++;
          if (count === beforeCaret) {
            position = index + 1;
            break;
          }
        }
        if (!beforeCaret) position = Math.min(4, value.length);
      }
      input.setSelectionRange(position, position);
    }
    if (!input.value) input.value = "+7";
    input.addEventListener("focus", () => {
      if (!input.value) input.value = "+7";
    });
    input.addEventListener("input", format);
    input.addEventListener("change", format);
    input.addEventListener("beforeinput", (event) => {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      if (start !== end || !event.inputType.startsWith("deleteContent")) return;
      const backwards = event.inputType === "deleteContentBackward";
      let index = backwards ? start - 1 : start;
      if (backwards && start <= 4) {
        event.preventDefault();
        input.setSelectionRange(Math.min(4, input.value.length), Math.min(4, input.value.length));
        return;
      } else {
        while (index >= 2 && index < input.value.length && /\D/.test(input.value[index])) {
          index += backwards ? -1 : 1;
        }
        if (index < 2 || index >= input.value.length) return;
        event.preventDefault();
        input.setRangeText("", index, index + 1, "start");
      }
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  root.querySelectorAll(".rental-form").forEach((form) => {
    const phone = form.elements.phone;
    const name = form.elements.name;
    const email = form.elements.email;
    setupPhoneMask(phone);
    const normalizeEmail = () => {
      email.value = email.value.replace(/\s/g, "");
    };
    email.addEventListener("input", normalizeEmail);
    email.addEventListener("change", normalizeEmail);
    function validate() {
      email.setCustomValidity(
        email.value && !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email.value)
          ? "Введите адрес в формате name@example.ru."
          : "",
      );
      name.setCustomValidity(name.value.trim().length < 2 ? "Укажите ваше имя." : "");
      const digits = phone.value.replace(/\D/g, "");
      phone.setCustomValidity(
        !/^7\d{10}$/.test(digits) ? "Введите полный номер: +7 (999) 999-99-99." : "",
      );
    }
    function updateFieldState(field) {
      field.setAttribute("aria-invalid", String(!field.validity.valid));
    }
    form.addEventListener("focusout", (event) => {
      if (!event.target.matches("input:not([type=hidden]), select, textarea")) return;
      validate();
      updateFieldState(event.target);
    });
    form.addEventListener("invalid", (event) => updateFieldState(event.target), true);
    form.addEventListener("input", (event) => {
      validate();
      if (event.target.hasAttribute("aria-invalid")) updateFieldState(event.target);
      form.querySelector(".rental-form__status").textContent = "";
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      validate();
      if (!form.reportValidity()) return;
    });
  });
});
