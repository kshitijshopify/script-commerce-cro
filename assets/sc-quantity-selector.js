/**
 * SC – Quantity selector: <sc-quantity-selector>
 * Theme-independent. Talks to the product form only through standard form fields:
 *  - quantity mode: input[name="quantity"] of the product form (created if missing)
 *  - variant mode:  the form's variant radios / selects (matched by option value)
 *
 * Many themes reset the quantity input after a variant change or add to cart, so the
 * chosen quantity is re-applied on those moments and right before the form submits.
 *
 * Event (bubbling): sc:quantity-selector:change  detail: { index, quantity, value, label }
 */
(() => {
  if (customElements.get('sc-quantity-selector')) return;

  const norm = (value) => String(value == null ? '' : value).trim().toLowerCase();

  class ScQuantitySelector extends HTMLElement {
    connectedCallback() {
      this.mode = this.dataset.mode === 'variant' ? 'variant' : 'quantity';
      this.formId = this.dataset.formId || '';
      this.options = Array.from(this.querySelectorAll('[data-sc-qs-option]'));
      this.selectedEl = this.querySelector('[data-sc-qs-selected]');
      this.active = this.options.find((o) => o.classList.contains('is-active')) || this.options[0];
      if (!this.active) return;

      this.onClick = this.onClick.bind(this);
      this.onKeydown = this.onKeydown.bind(this);
      this.onSubmit = this.onSubmit.bind(this);
      this.onDocumentChange = this.onDocumentChange.bind(this);
      this.reapply = this.reapply.bind(this);

      this.addEventListener('click', this.onClick);
      this.addEventListener('keydown', this.onKeydown);
      // Capture phase on document runs before the theme's own submit handler.
      document.addEventListener('submit', this.onSubmit, true);
      document.addEventListener('change', this.onDocumentChange);

      // Optional Dawn-style pub/sub (feature-detected).
      this.unsubscribers = [];
      if (typeof window.subscribe === 'function' && window.PUB_SUB_EVENTS) {
        ['variantChange', 'cartUpdate'].forEach((name) => {
          const eventName = window.PUB_SUB_EVENTS[name];
          if (eventName) this.unsubscribers.push(window.subscribe(eventName, () => this.reapply()));
        });
      }

      if (this.mode === 'quantity') {
        if (this.hasAttribute('data-hide-quantity')) this.hideThemeQuantity();
        this.applyQuantity();
        // Themes often initialise their quantity input after us – apply again once loaded.
        window.addEventListener('load', this.reapply, { once: true });
        setTimeout(this.reapply, 300);
      } else if (this.hasAttribute('data-hide-variant-picker')) {
        this.hideVariantPicker();
      }
    }

    disconnectedCallback() {
      document.removeEventListener('submit', this.onSubmit, true);
      document.removeEventListener('change', this.onDocumentChange);
      (this.unsubscribers || []).forEach((unsubscribe) => typeof unsubscribe === 'function' && unsubscribe());
    }

    /* ---------- Form helpers ---------- */

    get form() {
      return (this.formId && document.getElementById(this.formId)) || null;
    }

    formFields(selector) {
      const fields = [];
      if (this.formId) {
        document.querySelectorAll(`${selector}[form="${CSS.escape(this.formId)}"]`).forEach((el) => fields.push(el));
      }
      if (this.form) this.form.querySelectorAll(selector).forEach((el) => fields.includes(el) || fields.push(el));
      return fields;
    }

    quantityInput() {
      const existing = this.formFields('input[name="quantity"]').find((el) => el !== this.hiddenQuantity);
      if (existing) return existing;
      if (!this.hiddenQuantity && (this.form || this.formId)) {
        this.hiddenQuantity = document.createElement('input');
        this.hiddenQuantity.type = 'hidden';
        this.hiddenQuantity.name = 'quantity';
        if (this.formId) this.hiddenQuantity.setAttribute('form', this.formId);
        this.appendChild(this.hiddenQuantity);
      }
      return this.hiddenQuantity || null;
    }

    hideThemeQuantity() {
      const input = this.formFields('input[name="quantity"]')[0];
      if (!input) return;
      const wrapper = input.closest('.product-form__quantity, .product-form__input, .quantity-selector, .quantity') || input;
      if (!this.contains(wrapper)) wrapper.style.display = 'none';
    }

    hideVariantPicker() {
      const pickers = new Set();
      this.formFields('input[type="radio"], select').forEach((field) => {
        if (field.name === 'quantity' || field.name === 'id') return;
        const picker = field.closest('variant-selects, variant-radios, .product-form__input, fieldset');
        if (picker) pickers.add(picker);
      });
      pickers.forEach((picker) => (picker.style.display = 'none'));
    }

    /* ---------- Applying the selection ---------- */

    applyQuantity({ silent = false } = {}) {
      const input = this.quantityInput();
      if (!input) return;
      const quantity = String(parseInt(this.active.dataset.quantity, 10) || 1);
      if (input.value === quantity) return;
      input.value = quantity;
      if (!silent && input.type !== 'hidden') input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    applyVariant() {
      const wanted = norm(this.active.dataset.value);
      if (!wanted) return;

      const radio = this.formFields('input[type="radio"]').find((el) => norm(el.value) === wanted);
      if (radio) {
        if (!radio.checked) {
          radio.checked = true;
          radio.dispatchEvent(new Event('change', { bubbles: true }));
        }
        return;
      }

      const select = this.formFields('select').find((el) =>
        Array.from(el.options).some((option) => norm(option.value) === wanted)
      );
      if (select) {
        const option = Array.from(select.options).find((o) => norm(o.value) === wanted);
        if (option && select.value !== option.value) {
          select.value = option.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    }

    reapply() {
      if (this.mode === 'quantity') {
        this.applyQuantity({ silent: true });
      } else {
        this.syncFromVariant();
        if (this.hasAttribute('data-hide-variant-picker')) this.hideVariantPicker();
      }
    }

    /* ---------- State ---------- */

    select(option, { focus = false } = {}) {
      if (!option || option === this.active) return;
      this.setActive(option);
      if (focus) option.focus();

      if (this.mode === 'quantity') this.applyQuantity();
      else this.applyVariant();

      this.dispatchEvent(
        new CustomEvent('sc:quantity-selector:change', {
          bubbles: true,
          detail: {
            index: Number(option.dataset.index),
            quantity: parseInt(option.dataset.quantity, 10) || 1,
            value: option.dataset.value || '',
            label: option.dataset.label || '',
          },
        })
      );
    }

    setActive(option) {
      this.active = option;
      this.options.forEach((o) => {
        const isActive = o === option;
        o.classList.toggle('is-active', isActive);
        o.setAttribute('aria-checked', String(isActive));
        o.tabIndex = isActive ? 0 : -1;
      });
      if (this.selectedEl) this.selectedEl.textContent = option.dataset.label || '';
    }

    /** Variant mode: highlight the option matching the theme's current selection. */
    syncFromVariant() {
      const chosen = new Set();
      this.formFields('input[type="radio"]').forEach((el) => el.checked && chosen.add(norm(el.value)));
      this.formFields('select').forEach((el) => el.name !== 'quantity' && chosen.add(norm(el.value)));
      const match = this.options.find((o) => o.dataset.value && chosen.has(norm(o.dataset.value)));
      if (match && match !== this.active) this.setActive(match);
    }

    /* ---------- Handlers ---------- */

    onClick(event) {
      const option = event.target.closest('[data-sc-qs-option]');
      if (option && this.contains(option)) this.select(option);
    }

    onKeydown(event) {
      const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
      if (!keys.includes(event.key) || !event.target.closest('[data-sc-qs-option]')) return;
      event.preventDefault();
      const last = this.options.length - 1;
      const current = this.options.indexOf(this.active);
      let next = current;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = current === last ? 0 : current + 1;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = current === 0 ? last : current - 1;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = last;
      this.select(this.options[next], { focus: true });
    }

    onSubmit(event) {
      if (this.mode !== 'quantity') return;
      const form = event.target;
      if (form && (form.id === this.formId || form === this.form)) this.applyQuantity({ silent: true });
    }

    onDocumentChange(event) {
      const target = event.target;
      if (!target || this.contains(target)) return;
      const belongsToForm =
        (this.formId && target.getAttribute && target.getAttribute('form') === this.formId) ||
        (this.form && this.form.contains(target));
      if (!belongsToForm) return;

      if (this.mode === 'variant') {
        this.syncFromVariant();
      } else if (target.name === 'quantity') {
        // Shopper used the theme's quantity input: highlight a matching option if there is one.
        const match = this.options.find((o) => o.dataset.quantity === String(target.value));
        if (match && match !== this.active) this.setActive(match);
      } else {
        // Variant change: the theme may reset its quantity input asynchronously.
        setTimeout(this.reapply, 50);
        setTimeout(this.reapply, 600);
      }
    }
  }

  customElements.define('sc-quantity-selector', ScQuantitySelector);
})();
