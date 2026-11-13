/**
 * SC – Cart shipping cost breakdown: <sc-shipping-estimator>
 * Theme-independent. Reads its config from the inner <script data-sc-csb-config> JSON,
 * fetches Shopify's live shipping rates for the chosen address and updates the
 * Shipping + Total rows of the closest [data-sc-csb] block.
 *
 * Events (bubbling, on the element):
 *  - sc:shipping-estimate  detail: { country, province, zip, shippingCents, totalCents }
 * Document events:
 *  - sc:shipping-address-change  keeps several estimators (drawer + cart page) in sync.
 */
(() => {
  if (customElements.get('sc-shipping-estimator')) return;

  const ADDRESS_KEY = 'sc-csb-address';
  const CACHE_PREFIX = 'sc-csb-rate:';
  const CACHE_TTL = 10 * 60 * 1000;
  const POLL_DELAY = 500;
  const POLL_LIMIT = 20;

  const store = {
    get(type, key) {
      try {
        const raw = window[type].getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },
    set(type, key, value) {
      try {
        window[type].setItem(key, JSON.stringify(value));
      } catch (e) {
        /* storage unavailable */
      }
    },
  };

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

  class ScShippingEstimator extends HTMLElement {
    connectedCallback() {
      const configEl = this.querySelector('script[data-sc-csb-config]');
      if (!configEl) return;
      try {
        this.config = JSON.parse(configEl.textContent);
      } catch (e) {
        return;
      }

      this.root = this.closest('[data-sc-csb]') || this;
      this.countryEl = this.querySelector('[data-sc-csb-country]');
      this.provinceWrap = this.querySelector('[data-sc-csb-province-wrap]');
      this.provinceEl = this.querySelector('[data-sc-csb-province]');
      this.zipEl = this.querySelector('[data-sc-csb-zip]');
      this.submitEl = this.querySelector('[data-sc-csb-submit]');
      this.shippingEl = this.querySelector('[data-sc-csb-shipping]');
      this.messageEl = this.querySelector('[data-sc-csb-message]');
      this.totalEl = this.root.querySelector('[data-sc-csb-total]');
      this.labels = this.config.labels || {};
      this.token = 0;

      if (!this.countryEl || !this.shippingEl) return;

      this.applyAddress(this.initialAddress());

      this.onCountryChange = this.onCountryChange.bind(this);
      this.onProvinceChange = this.onProvinceChange.bind(this);
      this.onSubmit = this.onSubmit.bind(this);
      this.onZipKeydown = this.onZipKeydown.bind(this);
      this.onExternalChange = this.onExternalChange.bind(this);

      this.countryEl.addEventListener('change', this.onCountryChange);
      this.provinceEl?.addEventListener('change', this.onProvinceChange);
      this.submitEl?.addEventListener('click', this.onSubmit);
      this.zipEl?.addEventListener('keydown', this.onZipKeydown);
      document.addEventListener('sc:shipping-address-change', this.onExternalChange);

      if (!this.config.free) this.estimate();
    }

    disconnectedCallback() {
      this.token += 1;
      document.removeEventListener('sc:shipping-address-change', this.onExternalChange);
    }

    /* ---------- Address state ---------- */

    hasCountry(name) {
      return !!name && Array.from(this.countryEl.options).some((option) => option.value === name);
    }

    initialAddress() {
      const saved = store.get('localStorage', ADDRESS_KEY);
      const customer = this.config.customer;
      if (saved && this.hasCountry(saved.country)) return saved;
      if (customer && this.hasCountry(customer.country)) return customer;
      // Default country may be a localized market name, so also match the option's visible label.
      const wanted = String(this.config.defaultCountry || '').toLowerCase();
      const match = Array.from(this.countryEl.options).find(
        (option) => option.value.toLowerCase() === wanted || option.text.trim().toLowerCase() === wanted
      );
      return { country: match ? match.value : this.countryEl.value };
    }

    applyAddress(address) {
      this.countryEl.value = address.country;
      this.renderProvinces(address.province);
      if (this.zipEl) this.zipEl.value = address.zip || '';
    }

    fallbackFor(country) {
      return (this.config.fallback && this.config.fallback[country]) || null;
    }

    renderProvinces(preferred) {
      if (!this.provinceEl || !this.provinceWrap) return;
      const option = this.countryEl.options[this.countryEl.selectedIndex];
      let provinces = [];
      try {
        provinces = JSON.parse((option && option.dataset.provinces) || '[]');
      } catch (e) {
        provinces = [];
      }

      this.provinceEl.innerHTML = '';
      if (!provinces.length) {
        this.provinceWrap.hidden = true;
        return;
      }

      provinces.forEach(([value, label]) => this.provinceEl.add(new Option(label, value)));
      const fallback = this.fallbackFor(this.countryEl.value);
      const wanted = [preferred, fallback && fallback.province].find(
        (name) => name && provinces.some(([value]) => value === name)
      );
      if (wanted) this.provinceEl.value = wanted;
      this.provinceWrap.hidden = false;
    }

    currentAddress() {
      const country = this.countryEl.value;
      const province = this.provinceWrap && !this.provinceWrap.hidden ? this.provinceEl.value : '';
      const zip = this.zipEl ? this.zipEl.value.trim() : '';
      return { country, province, zip };
    }

    /** Address used for the request: the shopper's zip, else a representative one for the country. */
    requestAddress() {
      const address = this.currentAddress();
      if (address.zip) return address;
      const fallback = this.fallbackFor(address.country);
      if (!fallback || !fallback.zip) return address;
      // A sample zip only fits its own province; for any other province the shopper must type theirs.
      if (address.province && fallback.province && address.province !== fallback.province) return address;
      return { ...address, zip: fallback.zip };
    }

    saveAddress() {
      const address = this.currentAddress();
      store.set('localStorage', ADDRESS_KEY, address);
      document.dispatchEvent(
        new CustomEvent('sc:shipping-address-change', { detail: { address, source: this } })
      );
    }

    /* ---------- Events ---------- */

    onCountryChange() {
      if (this.zipEl) this.zipEl.value = '';
      this.renderProvinces();
      this.saveAddress();
      this.estimate();
    }

    onProvinceChange() {
      this.saveAddress();
      this.estimate();
    }

    onSubmit() {
      if (this.zipEl && !this.zipEl.value.trim()) {
        this.showMessage(this.labels.zipRequired, true);
        this.zipEl.focus();
        return;
      }
      this.saveAddress();
      this.estimate();
    }

    onZipKeydown(event) {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      this.onSubmit();
    }

    onExternalChange(event) {
      if (!event.detail || event.detail.source === this) return;
      const { address } = event.detail;
      if (!this.hasCountry(address.country)) return;
      this.applyAddress(address);
      if (!this.config.free) this.estimate();
    }

    /* ---------- Rendering ---------- */

    showMessage(text, isError = false) {
      if (!this.messageEl) return;
      this.messageEl.textContent = text || '';
      this.messageEl.hidden = !text;
      this.messageEl.classList.toggle('sc-csb__message--error', !!text && isError);
      this.messageEl.setAttribute('role', isError ? 'alert' : 'status');
    }

    setLoading(loading) {
      this.toggleAttribute('aria-busy', loading);
      if (this.submitEl) this.submitEl.disabled = loading;
      if (loading) this.shippingEl.innerHTML = '<span class="sc-csb__spinner" aria-hidden="true"></span>';
    }

    renderShipping(cents) {
      this.shippingEl.innerHTML = '';
      const span = document.createElement('span');
      if (cents === null) {
        span.className = 'sc-csb__muted';
        span.textContent = '—';
      } else if (cents === 0) {
        span.className = 'sc-csb__free';
        span.textContent = this.labels.free || '';
      } else {
        span.textContent = formatMoney(cents, this.config.moneyFormat);
      }
      this.shippingEl.appendChild(span);

      if (this.totalEl) {
        const total = Number(this.config.cartTotal) + (cents || 0);
        this.totalEl.textContent = formatMoney(total, this.config.moneyWithCurrencyFormat || this.config.moneyFormat);
      }
    }

    /* ---------- Rates ---------- */

    cacheKey(address) {
      const { country, province, zip } = address;
      return `${CACHE_PREFIX}${country}|${province}|${zip}|${this.config.cartTotal}|${this.config.itemCount}`;
    }

    async estimate() {
      const token = ++this.token;
      const address = this.requestAddress();

      if (!address.zip) {
        this.renderShipping(null);
        this.showMessage(this.labels.zipRequired);
        return;
      }

      const key = this.cacheKey(address);
      const cached = store.get('sessionStorage', key);
      if (cached && Date.now() - cached.time < CACHE_TTL) {
        this.finish(address, cached.cents);
        return;
      }

      this.showMessage('');
      this.setLoading(true);

      try {
        const rates = await this.fetchRates(address);
        if (token !== this.token) return;
        this.setLoading(false);

        if (!rates.length) {
          this.renderShipping(null);
          this.showMessage(this.labels.noRates, true);
          return;
        }

        const cents = Math.min(...rates.map((rate) => Math.round(parseFloat(rate.price) * 100)));
        store.set('sessionStorage', key, { cents, time: Date.now() });
        this.finish(address, cents);
      } catch (error) {
        if (token !== this.token) return;
        this.setLoading(false);
        this.renderShipping(null);
        this.showMessage((error && error.message) || this.labels.error, true);
      }
    }

    finish(address, cents) {
      this.setLoading(false);
      this.showMessage('');
      this.renderShipping(cents);
      this.dispatchEvent(
        new CustomEvent('sc:shipping-estimate', {
          bubbles: true,
          detail: {
            ...address,
            shippingCents: cents,
            totalCents: Number(this.config.cartTotal) + cents,
          },
        })
      );
    }

    async fetchRates({ country, province, zip }) {
      const params = new URLSearchParams();
      params.append('shipping_address[zip]', zip);
      params.append('shipping_address[country]', country);
      if (province) params.append('shipping_address[province]', province);

      const base = String(this.config.cartUrl || '/cart').replace(/\/$/, '');
      const headers = { Accept: 'application/json' };

      const prepare = await fetch(`${base}/prepare_shipping_rates.json?${params}`, {
        method: 'POST',
        headers,
        cache: 'no-store',
      });

      if (!prepare.ok) {
        let message = '';
        try {
          message = this.formatErrors(await prepare.json());
        } catch (e) {
          /* non-JSON error */
        }
        throw new Error(message || this.labels.error);
      }

      for (let attempt = 0; attempt < POLL_LIMIT; attempt += 1) {
        const response = await fetch(`${base}/async_shipping_rates.json?${params}`, { headers, cache: 'no-store' });
        const text = await response.text();
        if (response.ok && text && text !== 'null') {
          const data = JSON.parse(text);
          return (data && data.shipping_rates) || [];
        }
        await wait(POLL_DELAY);
      }

      throw new Error(this.labels.error);
    }

    formatErrors(data) {
      if (!data) return '';
      if (typeof data.error === 'string') return data.error;
      return Object.entries(data)
        .map(([field, messages]) => {
          const name = field.replace(/_/g, ' ');
          return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${[].concat(messages).join(', ')}`;
        })
        .join('. ');
    }
  }

  customElements.define('sc-shipping-estimator', ScShippingEstimator);
})();
