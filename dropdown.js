(() => {
  let sequence = 0;
  const active = new Set();
  window.MegaDropdown = function createDropdown(select, className = "") {
    if (select.megaDropdown) return select.megaDropdown;
    const wrapper = document.createElement("div");
    wrapper.className = `dropdown ${className}`;
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "dropdown__trigger";
    const label = select.getAttribute("aria-label") || "Выберите значение";
    trigger.setAttribute("aria-label", label);
    trigger.setAttribute("aria-haspopup", "listbox");
    const list = document.createElement("div");
    list.className = "dropdown__list";
    list.id = `mega-options-${++sequence}`;
    list.setAttribute("role", "listbox");
    list.setAttribute("aria-label", label);
    trigger.setAttribute("aria-controls", list.id);
    function close() {
      list.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
    }
    function refresh() {
      trigger.textContent = select.selectedOptions[0]?.textContent || label;
      [...list.children].forEach((button, index) =>
        button.setAttribute("aria-selected", String(index === select.selectedIndex)),
      );
    }
    function open() {
      active.forEach((dropdown) => dropdown.close());
      list.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
      list.children[Math.max(0, select.selectedIndex)]?.focus({ preventScroll: true });
    }
    [...select.options].forEach((option, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.tabIndex = -1;
      button.textContent = option.textContent;
      button.disabled = option.disabled;
      button.setAttribute("role", "option");
      button.addEventListener("click", () => {
        select.selectedIndex = index;
        refresh();
        close();
        trigger.focus({ preventScroll: true });
        select.dispatchEvent(new Event("input", { bubbles: true }));
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });
      button.addEventListener("keydown", (event) => {
        const positions = {
          ArrowDown: (index + 1) % select.length,
          ArrowUp: (index + select.length - 1) % select.length,
          Home: 0,
          End: select.length - 1,
        };
        if (event.key in positions) {
          event.preventDefault();
          list.children[positions[event.key]].focus();
        }
      });
      list.append(button);
    });
    trigger.addEventListener("click", () => (list.hidden ? open() : close()));
    trigger.addEventListener("keydown", (event) => {
      if (["ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        open();
      }
    });
    wrapper.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !list.hidden) {
        event.preventDefault();
        event.stopPropagation();
        close();
        trigger.focus();
      }
    });
    wrapper.addEventListener("focusout", (event) => {
      if (!wrapper.contains(event.relatedTarget)) close();
    });
    document.addEventListener("pointerdown", (event) => {
      if (!wrapper.contains(event.target)) close();
    });
    select.addEventListener("change", refresh);
    select.form?.addEventListener("reset", () =>
      queueMicrotask(() => {
        close();
        refresh();
      }),
    );
    select.before(wrapper);
    select.classList.add("dropdown__native");
    wrapper.append(select, trigger, list);
    const api = { close, refresh, wrapper };
    select.refresh = refresh;
    select.megaDropdown = api;
    active.add(api);
    close();
    refresh();
    return api;
  };
})();
