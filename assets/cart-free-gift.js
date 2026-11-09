/**
 * <sc_free-gift-bar> is re-created every time the cart drawer is re-rendered.
 * On connect it adds the gift once the threshold is reached, or removes it
 * again if the cart dropped below the threshold, then refreshes the drawer.
 * With auto add off, the "Add" button in the gift box triggers the add instead.
 */
class sc_FreeGiftBar extends HTMLElement {
  // Shared across re-renders so a failing request can never loop.
  static sc_busy = false;

  connectedCallback() {
    this.querySelector('[data-free-gift-add]')?.addEventListener('click', (sc_event) => {
      if (sc_FreeGiftBar.sc_busy) return;
      sc_event.currentTarget.disabled = true;
      this.sc_addGift();
    });

    if (sc_FreeGiftBar.sc_busy) return;
    if (this.dataset.shouldAdd === 'true') {
      this.sc_addGift();
    } else if (this.dataset.shouldRemove === 'true' && this.dataset.giftLineKey) {
      this.sc_sync(`${routes.cart_change_url}.js`, { id: this.dataset.giftLineKey, quantity: 0 });
    }
  }

  sc_addGift() {
    this.sc_sync(`${routes.cart_add_url}.js`, {
      id: Number(this.dataset.giftVariantId),
      quantity: 1,
      properties: { _free_gift: 'true' },
    });
  }

  sc_sync(sc_url, sc_payload) {
    sc_FreeGiftBar.sc_busy = true;
    const sc_body = JSON.stringify({
      ...sc_payload,
      sections: 'cart-drawer,cart-icon-bubble',
      sections_url: window.location.pathname,
    });

    fetch(sc_url, { ...fetchConfig(), body: sc_body })
      .then((sc_response) => sc_response.json())
      .then((sc_state) => {
        // add.js errors (e.g. sold out) come back as { status, description }; leave the cart alone.
        if (sc_state.status || sc_state.errors || !sc_state.sections) return;
        this.sc_render(sc_state.sections);
      })
      .catch((sc_error) => console.error(sc_error))
      .finally(() => {
        sc_FreeGiftBar.sc_busy = false;
      });
  }

  sc_render(sc_sections) {
    const sc_parse = (sc_html) => new DOMParser().parseFromString(sc_html, 'text/html');

    const sc_drawer = document.querySelector('cart-drawer');
    const sc_drawerInner = document.getElementById('CartDrawer');
    if (sc_drawer && sc_drawerInner && sc_sections['cart-drawer']) {
      sc_drawerInner.innerHTML = sc_parse(sc_sections['cart-drawer']).querySelector('#CartDrawer').innerHTML;
      sc_drawer.classList.remove('is-empty');
      // The overlay element was replaced, so re-bind its click handler.
      sc_drawer.querySelector('#CartDrawer-Overlay')?.addEventListener('click', sc_drawer.close.bind(sc_drawer));
    }

    const sc_bubble = document.getElementById('cart-icon-bubble');
    if (sc_bubble && sc_sections['cart-icon-bubble']) {
      sc_bubble.innerHTML = sc_parse(sc_sections['cart-icon-bubble']).querySelector('.shopify-section').innerHTML;
    }
  }
}

if (!customElements.get('sc_free-gift-bar')) customElements.define('sc_free-gift-bar', sc_FreeGiftBar);
