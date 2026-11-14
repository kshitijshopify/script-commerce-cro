/**
 * SC – Cart upsell: <sc-cart-upsell>
 * Theme-independent: native scroll-snap slider, a variant bottom sheet built from
 * /products/{handle}.js, add via /cart/add.js and a cart UI refresh through the
 * Section Rendering API (Dawn drawer, header bubble, cart page sections), with a
 * page reload as the fallback for unknown themes.
 *
 * Inside a drawer whose panel is transformed (Dawn), the fixed sheet covers just the
 * drawer panel; on the cart page it covers the viewport.
 *
 * Document event: sc:cart-upsell:added  detail: { variantId, cart }
 */
(() => {
  if (customElements.get('sc-cart-upsell')) return;

  const COLOR_OPTION = /colou?r|farbe|couleur|kleur|colore/i;

  function formatMoney(cents, format) {
    const template = String(format || '${{amount}}').replace(/<[^>]*>/g, '');
    const placeholder = /\{\{\s*(\w+)\s*\}\}/;
    const match = template.match(placeholder);
    if (!match) return template;
    const toNumber = (precision, thousands = ',', decimal = '.') => {
      const [whole, fraction] = (cents / 100).toFixed(precision).split('.');
      const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
      return fraction ? grouped + decimal + fraction : grouped;
    };
    const formats = {
      amount: () => toNumber(2),
      amount_no_decimals: () => toNumber(0),
      amount_with_comma_separator: () => toNumber(2, '.', ','),
      amount_no_decimals_with_comma_separator: () => toNumber(0, '.', ','),
      amount_with_apostrophe_separator: () => toNumber(2, "'", '.'),
      amount_no_decimals_with_space_separator: () => toNumber(0, ' '),
      amount_with_space_separator: () => toNumber(2, ' ', ','),
      amount_with_period_and_space_separator: () => toNumber(2, ' ', '.'),
    };
    return template.replace(placeholder, (formats[match[1]] || formats.amount)());
  }

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };

  class ScCartUpsell extends HTMLElement {
    connectedCallback() {
      try {
        this.config = JSON.parse(this.querySelector('[data-sc-cu-config]').textContent);
      } catch (e) {
        this.config = { labels: {} };
      }
      this.labels = this.config.labels || {};
      this.root = this.dataset.root || '/';
      if (!this.root.endsWith('/')) this.root += '/';
      this.cartUrl = this.dataset.cartUrl || `${this.root}cart`;

      this.list = this.querySelector('[data-sc-cu-list]');
      this.prev = this.querySelector('[data-sc-cu-prev]');
      this.next = this.querySelector('[data-sc-cu-next]');
      this.errorEl = this.querySelector('[data-sc-cu-error]');

      this.onClick = this.onClick.bind(this);
      this.updateArrows = this.updateArrows.bind(this);
      this.onKeydown = this.onKeydown.bind(this);
      this.addEventListener('click', this.onClick);

      if (this.prev && this.next && this.list) {
        this.list.addEventListener('scroll', this.updateArrows, { passive: true });
        if ('ResizeObserver' in window) {
          this.resizeObserver = new ResizeObserver(this.updateArrows);
          this.resizeObserver.observe(this.list);
        }
        this.updateArrows();
      }
    }

    disconnectedCallback() {
      if (this.resizeObserver) this.resizeObserver.disconnect();
      this.closeSheet(false);
    }

    /* ---------- Slider ---------- */

    updateArrows() {
      if (!this.list || !this.prev) return;
      const max = this.list.scrollWidth - this.list.clientWidth;
      const arrows = this.prev.parentElement;
      arrows.hidden = max <= 2;
      this.prev.disabled = this.list.scrollLeft <= 2;
      this.next.disabled = this.list.scrollLeft >= max - 2;
    }

    scrollByCard(direction) {
      const item = this.list.querySelector('.sc-cu__item');
      if (!item) return;
      const gap = parseFloat(getComputedStyle(this.list).columnGap) || 0;
      this.list.scrollBy({ left: direction * (item.getBoundingClientRect().width + gap), behavior: 'smooth' });
    }

    /* ---------- Clicks ---------- */

    onClick(event) {
      const target = event.target;
      if (target.closest('[data-sc-cu-prev]')) return this.scrollByCard(-1);
      if (target.closest('[data-sc-cu-next]')) return this.scrollByCard(1);

      const add = target.closest('[data-sc-cu-add]');
      if (!add || !this.contains(add)) return;
      event.preventDefault();
      event.stopPropagation();
      if (add.hasAttribute('data-has-variants')) this.openSheet(add);
      else this.addToCart(add.dataset.variantId, add, add.dataset.sellingPlan);
    }

    /** Shows a message next to `anchor` (card / sheet), or below the list. */
    showError(message, anchor) {
      this.querySelectorAll('[data-sc-cu-item-error]').forEach((node) => (node.hidden = true));
      if (this.errorEl) this.errorEl.hidden = true;
      if (!message) return;

      let target = null;
      if (anchor) {
        target =
          (anchor.closest('.sc-cu-sheet') && anchor.closest('.sc-cu-sheet').querySelector('[data-sc-cu-sheet-error]')) ||
          (anchor.closest('.sc-cu__item') && anchor.closest('.sc-cu__item').querySelector('[data-sc-cu-item-error]'));
      }
      target = target || this.errorEl;
      if (!target) return;
      target.textContent = message;
      target.hidden = false;
    }

    setBusy(button, busy) {
      if (!button) return;
      button.setAttribute('aria-busy', String(busy));
      button.disabled = busy;
    }

    /* ---------- Variant sheet ---------- */

    async openSheet(trigger) {
      this.showError('');
      this.setBusy(trigger, true);
      let product;
      try {
        const response = await fetch(`${this.root}products/${encodeURIComponent(trigger.dataset.handle)}.js`, {
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        product = await response.json();
      } catch (e) {
        console.error('[sc-cart-upsell] Could not load product', trigger.dataset.handle, e);
        this.setBusy(trigger, false);
        this.showError(this.labels.error, trigger);
        return;
      }
      this.setBusy(trigger, false);
      this.buildSheet(product, trigger);
    }

    buildSheet(product, trigger) {
      this.closeSheet(false);
      const variants = product.variants || [];
      const options = (product.options || []).map((option, index) =>
        typeof option === 'string' ? { name: option, position: index + 1, values: [] } : option
      );
      const start = variants.find((v) => v.available) || variants[0];
      if (!start) return;
      const selected = start.options.slice();

      const sheet = el('div', 'sc-cu-sheet');
      sheet.setAttribute('role', 'dialog');
      sheet.setAttribute('aria-modal', 'true');
      sheet.setAttribute('aria-label', product.title);
      const panel = el('div', 'sc-cu-sheet__panel');
      sheet.appendChild(panel);

      const close = el('button', 'sc-cu-sheet__close');
      close.type = 'button';
      close.setAttribute('aria-label', this.labels.close || 'Close');
      close.innerHTML =
        '<svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true" focusable="false"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
      panel.appendChild(close);

      const head = el('div', 'sc-cu-sheet__product');
      const img = el('img', 'sc-cu-sheet__img');
      img.alt = '';
      img.width = 72;
      img.height = 72;
      const info = el('div');
      const title = el('p', 'sc-cu-sheet__title', product.title);
      const price = el('p', 'sc-cu-sheet__price');
      info.append(title, price);
      head.append(img, info);
      panel.appendChild(head);

      const groups = options.map((option, index) => {
        const fieldset = el('fieldset', 'sc-cu-sheet__option');
        const legend = el('legend', 'sc-cu-sheet__legend', `${option.name}: `);
        const current = el('strong');
        legend.appendChild(current);
        const values = el('div', 'sc-cu-sheet__values');
        const isColor = COLOR_OPTION.test(option.name);
        const buttons = option.values.map((value) => {
          const button = el('button', 'sc-cu-sheet__value');
          button.type = 'button';
          button.dataset.value = value;
          const cssColor = value.toLowerCase().replace(/\s+/g, '');
          if (isColor && window.CSS && CSS.supports('color', cssColor)) {
            button.classList.add('sc-cu-sheet__value--color');
            button.style.setProperty('--sc-cu-swatch', cssColor);
            button.setAttribute('aria-label', value);
            button.title = value;
          } else {
            button.textContent = value;
          }
          button.addEventListener('click', () => {
            selected[index] = value;
            update();
          });
          values.appendChild(button);
          return button;
        });
        fieldset.append(legend, values);
        panel.appendChild(fieldset);
        return { current, buttons, index };
      });

      const atc = el('button', 'sc-cu-sheet__atc');
      atc.type = 'button';
      panel.appendChild(atc);
      const sheetError = el('p', 'sc-cu-sheet__error');
      sheetError.setAttribute('role', 'alert');
      sheetError.dataset.scCuSheetError = '';
      sheetError.hidden = true;
      panel.appendChild(sheetError);

      const matches = (variant, opts) => variant.options.every((v, i) => v === opts[i]);
      let variant = start;

      const update = () => {
        variant = variants.find((v) => matches(v, selected)) || null;
        groups.forEach(({ current, buttons, index }) => {
          current.textContent = selected[index];
          buttons.forEach((button) => {
            const value = button.dataset.value;
            button.setAttribute('aria-pressed', String(value === selected[index]));
            const trial = selected.slice();
            trial[index] = value;
            const candidate = variants.find((v) => matches(v, trial));
            button.classList.toggle('is-unavailable', !candidate || !candidate.available);
          });
        });

        const image = (variant && variant.featured_image && variant.featured_image.src) || product.featured_image;
        if (image) img.src = `${image}${image.includes('?') ? '&' : '?'}width=200`;
        img.hidden = !image;

        price.textContent = '';
        if (variant) {
          if (variant.compare_at_price && variant.compare_at_price > variant.price) {
            price.appendChild(el('s', null, formatMoney(variant.compare_at_price, this.config.moneyFormat)));
          }
          price.appendChild(document.createTextNode(formatMoney(variant.price, this.config.moneyFormat)));
        }

        const available = !!(variant && variant.available);
        atc.disabled = !available;
        atc.textContent = available ? this.labels.add || 'Add to cart' : this.labels.soldOut || 'Sold out';
      };

      atc.addEventListener('click', (event) => {
        event.stopPropagation();
        if (!variant || !variant.available) return;
        const plan =
          product.requires_selling_plan && variant.selling_plan_allocations && variant.selling_plan_allocations[0]
            ? variant.selling_plan_allocations[0].selling_plan_id
            : '';
        this.addToCart(variant.id, atc, plan);
      });
      close.addEventListener('click', () => this.closeSheet());
      sheet.addEventListener('click', (event) => {
        if (event.target === sheet) this.closeSheet();
      });

      update();
      this.sheet = sheet;
      this.sheetTrigger = trigger;
      // Drawer: cover the drawer panel only. Elsewhere: the viewport (body avoids transformed ancestors).
      const host = this.closest('[role="dialog"], .drawer__inner') || document.body;
      sheet.setAttribute('style', this.getAttribute('style') || '');
      host.appendChild(sheet);
      document.addEventListener('keydown', this.onKeydown);
      // Themes often close their drawer on Escape keyup – keep that key for the sheet only.
      document.addEventListener('keyup', this.swallowEscape, true);
      requestAnimationFrame(() => sheet.classList.add('is-open'));
      close.focus();
    }

    onKeydown(event) {
      if (!this.sheet) return;
      if (event.key === 'Escape') {
        event.stopPropagation();
        this.closeSheet();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(this.sheet.querySelectorAll('button:not([disabled])'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    swallowEscape(event) {
      if (event.key === 'Escape') event.stopPropagation();
    }

    closeSheet(restoreFocus = true) {
      if (!this.sheet) return;
      this.sheet.remove();
      this.sheet = null;
      document.removeEventListener('keydown', this.onKeydown);
      // Remove after the Escape keyup that closed the sheet has passed.
      setTimeout(() => document.removeEventListener('keyup', this.swallowEscape, true), 0);
      if (restoreFocus && this.sheetTrigger && this.sheetTrigger.isConnected) this.sheetTrigger.focus();
    }

    /* ---------- Cart ---------- */

    async addToCart(variantId, button, sellingPlan) {
      if (!variantId) return;
      this.showError('');
      this.setBusy(button, true);

      const item = { id: Number(variantId), quantity: 1 };
      if (sellingPlan) item.selling_plan = Number(sellingPlan);

      // Dawn drawer: let the theme re-render itself from the same request.
      const drawer = document.querySelector('cart-drawer');
      const useDrawer = !!(drawer && typeof drawer.renderContents === 'function' && document.getElementById('CartDrawer'));
      const onCartPage = /\/cart\/?$/.test(window.location.pathname);
      const body = { items: [item] };
      if (useDrawer && !onCartPage) {
        body.sections = ['cart-drawer', 'cart-icon-bubble'];
        body.sections_url = window.location.pathname;
      }

      try {
        const response = await fetch(`${this.root}cart/add.js`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.status) {
          console.error('[sc-cart-upsell] cart/add.js failed', response.status, data, body);
          throw new Error(data.description || data.message || this.labels.error);
        }

        const cart = await fetch(`${this.root}cart.js`, { headers: { Accept: 'application/json' } }).then((r) =>
          r.json()
        );
        document.dispatchEvent(new CustomEvent('sc:cart-upsell:added', { detail: { variantId, cart } }));
        this.closeSheet(false);

        if (useDrawer && !onCartPage && data.sections) {
          try {
            drawer.renderContents(data);
            drawer.classList.toggle('is-empty', cart.item_count === 0);
            return;
          } catch (e) {
            console.warn('[sc-cart-upsell] renderContents failed, falling back', e);
          }
        }
        await this.refreshCart(cart);
        if (button.isConnected) this.setBusy(button, false);
      } catch (error) {
        this.setBusy(button, false);
        this.showError((error && error.message) || this.labels.error, button);
      }
    }

    /** Re-render the theme's cart UI (Dawn drawer, header bubble, cart page sections). */
    async refreshCart(cart) {
      try {
        document.dispatchEvent(
          new CustomEvent('cart:update', {
            bubbles: true,
            detail: { resource: cart, sourceId: 'sc-cart-upsell', data: { source: 'sc-cart-upsell', itemCount: cart.item_count } },
          })
        );
      } catch (e) {
        /* older browsers */
      }

      const parse = (html) => new DOMParser().parseFromString(html, 'text/html');
      const ids = [];
      const jobs = [];

      const drawerInner = document.querySelector('#CartDrawer .drawer__inner');
      if (drawerInner) {
        ids.push('cart-drawer');
        jobs.push((sections) => {
          const fresh = sections['cart-drawer'] && parse(sections['cart-drawer']).querySelector('.drawer__inner');
          if (fresh) drawerInner.innerHTML = fresh.innerHTML;
          document.querySelectorAll('cart-drawer').forEach((d) => d.classList.toggle('is-empty', cart.item_count === 0));
        });
      }

      const bubble = document.getElementById('cart-icon-bubble');
      if (bubble) {
        ids.push('cart-icon-bubble');
        jobs.push((sections) => {
          if (!sections['cart-icon-bubble']) return;
          const doc = parse(sections['cart-icon-bubble']);
          bubble.innerHTML = (doc.querySelector('.shopify-section') || doc.body).innerHTML;
        });
      }

      if (/\/cart\/?$/.test(window.location.pathname)) {
        const scope = document.querySelector('main') || document.body;
        scope.querySelectorAll('[id^="shopify-section-"]').forEach((section) => {
          const id = section.id.slice('shopify-section-'.length);
          if (!/cart/i.test(id) && !section.querySelector('[name^="updates"], [name="checkout"]')) return;
          ids.push(id);
          jobs.push((sections) => {
            if (!sections[id]) return;
            const doc = parse(sections[id]);
            const fresh = doc.getElementById(section.id);
            section.innerHTML = fresh ? fresh.innerHTML : doc.body.innerHTML;
          });
        });
      }

      if (!ids.length) {
        window.location.reload();
        return;
      }

      try {
        const response = await fetch(`${this.cartUrl}?sections=${ids.join(",")}`, {
          headers: { Accept: 'application/json' },
        });
        const sections = await response.json();
        jobs.forEach((job) => {
          try {
            job(sections);
          } catch (e) {
            /* keep going */
          }
        });
      } catch (e) {
        window.location.reload();
      }
    }
  }

  customElements.define('sc-cart-upsell', ScCartUpsell);
})();
