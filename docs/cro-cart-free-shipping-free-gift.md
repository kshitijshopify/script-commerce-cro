# CRO | Cart Drawer Free Shipping Progress Bar with Auto-Added Free Gift

## Read this first (non-developer, theme-agnostic, ~10 minutes)

**What this feature does**
- Adds a free-shipping progress bar at the top of the cart drawer, with a delivery message above it ("Great choice! Your order will arrive in 2-3 working days").
- Shows how much is still missing ("Only €15.40 left for free shipping"), then switches to the free gift message once shipping is unlocked.
- Shows a gift icon on the bar. When the cart reaches the gift minimum, the free gift is added to the cart as a €0 line item automatically (or with an "Add" button if you turn Auto add off).

**What you will do**
- Create 1 snippet, 1 CSS file and 1 JS file (Steps 1-3).
- Add the settings to your theme settings schema (Step 4).
- Edit the cart drawer snippet in 3 places (Step 5).
- Create a €0 gift product (Step 6).
- Turn the feature on in Theme Editor > Theme settings > Cart (Step 7).

**How to open the code editor**
- Shopify Admin > Online Store > Themes > … > Edit code

**Make a safe backup first**
- In Themes, click the … menu next to your live theme > Duplicate

**Requirements**
- Cart type must be set to **Drawer** (Theme settings > Cart > Type). The feature does not work with the cart page or the popup notification.
- The theme needs a cart drawer snippet (Dawn-based themes: `snippets/cart-drawer.liquid`). Other themes may call it `mini-cart.liquid` or similar. Search the code editor for `cart-drawer` or `CartDrawer` to find it.
- The theme must use the standard Shopify AJAX endpoints (`/cart/add.js`, `/cart/change.js`) and the `cart-drawer` and `cart-icon-bubble` sections (standard in Dawn-based themes).
- The free gift must be a product (or variant) priced at **€0**. Inventory is managed manually: a sold-out gift is still displayed, but cannot be added.
- No external app is needed.

**Important: amounts are in cents**
- 3000 = €30.00, 5000 = €50.00. This applies to both the free-shipping minimum and the free gift minimum.

Tip: Use the search box in the code editor and try: cart-drawer, CartDrawer, cart-item, settings_schema

---

## Step 1
Create a new snippet: **cart-progress-bar.liquid**

- Code editor > Snippets > Add a new snippet > name it `cart-progress-bar`
- Paste this code:

```liquid
{% doc %}
  Free shipping progress bar with an optional auto-added free gift (cart drawer only).
  All amounts are in the smallest currency unit (cents), matching cart.items_subtotal_price.

  @example
  {% render 'cart-progress-bar' %}
{% enddoc %}

{%- liquid
  assign shipping_threshold = settings.cart_shipping_threshold | default: 0
  assign gift_min = settings.cart_free_gift_min_amount | default: 0
  assign subtotal = cart.items_subtotal_price

  assign gift_variant = null
  assign gift_fallback = null
  if settings.cart_free_gift_enabled and gift_min > 0
    for gift_product in settings.cart_free_gift_products
      for variant in gift_product.variants
        if variant.available and gift_variant == null
          assign gift_variant = variant
        endif
        if gift_fallback == null
          assign gift_fallback = variant
        endif
      endfor
    endfor
    if gift_variant == null
      assign gift_variant = gift_fallback
    endif
  endif
  assign gift_enabled = false
  if gift_variant != null
    assign gift_enabled = true
  endif

  assign bar_max = shipping_threshold
  if gift_enabled and gift_min > bar_max
    assign bar_max = gift_min
  endif

  assign gift_line_key = ''
  if gift_enabled
    for item in cart.items
      if item.variant_id == gift_variant.id and item.properties._free_gift == 'true'
        assign gift_line_key = item.key
        break
      endif
    endfor
  endif

  assign shipping_unlocked = false
  if shipping_threshold > 0 and subtotal >= shipping_threshold
    assign shipping_unlocked = true
  endif
  assign gift_unlocked = false
  if gift_enabled and subtotal >= gift_min
    assign gift_unlocked = true
  endif

  assign should_add = false
  if gift_unlocked and settings.cart_free_gift_auto_add and gift_variant.available and gift_line_key == blank
    assign should_add = true
  endif
  assign should_remove = false
  if gift_enabled and gift_line_key != blank and gift_unlocked == false
    assign should_remove = true
  endif

  assign progress = 100
  if bar_max > 0
    assign progress = subtotal | times: 100.0 | divided_by: bar_max | at_most: 100 | round: 2
  endif
-%}

{%- if request.design_mode and settings.cart_free_gift_enabled and gift_enabled == false -%}
  <p class="sc_cart-progress__delivery">Free gift skipped: pick a product with a variant priced at 0.</p>
{%- endif -%}

{%- if settings.cart_progress_enabled and cart != empty and bar_max > 0 -%}
  <sc_free-gift-bar
    class="sc_cart-progress"
    data-gift-variant-id="{{ gift_variant.id }}"
    data-gift-line-key="{{ gift_line_key }}"
    data-should-add="{{ should_add }}"
    data-should-remove="{{ should_remove }}"
  >
    {%- if settings.cart_delivery_message != blank -%}
      <div class="sc_cart-progress__delivery-wrapper">
        <svg xmlns="http://www.w3.org/2000/svg" width="29" height="29" viewBox="0 0 29 29" fill="none">
          <circle cx="14.5" cy="14.5" r="14.5" fill="currentColor"></circle>
          <path d="M23.6667 9L12.2083 20.4583L7 15.25" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
        <div class="sc_cart-progress__delivery">
          {{ settings.cart_delivery_message }}
        </div>
      </div>
    {%- endif -%}

    <div class="sc_cart-progress__track-wrapper">
      <div
        class="sc_cart-progress__track"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow="{{ progress | round }}"
      >
        <span class="sc_cart-progress__fill" style="width: {{ progress }}%"></span>
      </div>

      {%- if shipping_threshold > 0 -%}
        {%- assign shipping_pos = shipping_threshold | times: 100.0 | divided_by: bar_max | round: 2 -%}
        <span
          class="sc_cart-progress__icon sc_cart-progress__icon--shipping{% if shipping_unlocked %} is-reached{% endif %}"
          style="left: {{ shipping_pos }}%"
        >
          {%- if settings.cart_progress_shipping_icon != blank -%}
            {{ settings.cart_progress_shipping_icon }}
          {%- else -%}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M1 6h13v10H1zM14 10h4l3 3v3h-7z"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
          {%- endif -%}
        </span>
      {%- endif -%}

      {%- if gift_enabled -%}
        {%- assign gift_pos = gift_min | times: 100.0 | divided_by: bar_max | round: 2 -%}
        <span
          class="sc_cart-progress__icon sc_cart-progress__icon--gift{% if gift_unlocked %} is-reached{% endif %}"
          style="left: {{ gift_pos }}%"
        >
          {%- if settings.cart_progress_gift_icon != blank -%}
            {{ settings.cart_progress_gift_icon }}
          {%- else -%}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="8" width="18" height="4"/><path d="M12 8v13M5 12v9h14v-9M7.5 8a2.5 2.5 0 010-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 010 5"/></svg>
          {%- endif -%}
        </span>
      {%- endif -%}
    </div>

    {%- liquid
      comment
        Next milestone = the lowest threshold not reached yet (works whichever of shipping/gift is smaller).
      endcomment
      assign next_milestone = ''
      assign next_target = 0
      if shipping_threshold > 0 and shipping_unlocked == false
        assign next_milestone = 'shipping'
        assign next_target = shipping_threshold
      endif
      if gift_enabled and gift_unlocked == false
        if next_milestone == '' or gift_min < next_target
          assign next_milestone = 'gift'
          assign next_target = gift_min
        endif
      endif
      assign missing = next_target | minus: subtotal | money
    -%}
    <p class="sc_cart-progress__message" role="status">
      {%- if next_milestone == 'shipping' -%}
        {{ settings.cart_shipping_remaining_message | escape | replace: '[amount]', missing }}
      {%- elsif next_milestone == 'gift' -%}
        {{ settings.cart_free_gift_remaining_message | escape | replace: '[amount]', missing }}
      {%- else -%}
        {%- if shipping_unlocked -%}{{ settings.cart_shipping_unlocked_message | escape }}{%- endif -%}
        {%- if shipping_unlocked and gift_unlocked %} {% endif -%}
        {%- if gift_unlocked -%}{{ settings.cart_free_gift_unlocked_message | escape }}{%- endif -%}
      {%- endif -%}
    </p>

    {%- if gift_enabled -%}
      <div class="sc_cart-progress__gift{% if gift_unlocked %} is-unlocked{% endif %}">
        {%- assign gift_image = gift_variant.featured_image | default: gift_variant.product.featured_image -%}
        {%- if gift_image -%}
          <img
            class="sc_cart-progress__gift-image"
            src="{{ gift_image | image_url: width: 100 }}"
            alt="{{ gift_image.alt | escape }}"
            width="50"
            height="{{ 50 | divided_by: gift_image.aspect_ratio | ceil }}"
            loading="lazy"
          >
        {%- endif -%}
        <div class="sc_cart-progress__gift-text">
          <span class="sc_cart-progress__gift-headline">{{ settings.cart_free_gift_headline | escape }}</span>
          <div class="sc_cart-progress__gift-text-info">
            <span class="sc_cart-progress__gift-text-info-title">{{ gift_variant.product.title | escape }}</span>
            {%- if gift_variant.available == false -%}
              <span class="sc_cart-progress__gift-status">{{ 'products.product.sold_out' | t }}</span>
            {%- elsif gift_unlocked -%}
              <span class="sc_cart-progress__gift-status">{{ settings.cart_free_gift_unlocked_message | escape }}</span>
            {%- endif -%}
          </div>
          {%- if gift_unlocked and settings.cart_free_gift_auto_add == false and gift_variant.available and gift_line_key == blank -%}
            <button type="button" class="button button--secondary sc_cart-progress__gift-add" data-free-gift-add>
              {{ 'products.product.add_to_cart' | t }}
            </button>
          {%- endif -%}
        </div>
      </div>
    {%- endif -%}
  </sc_free-gift-bar>
{%- endif -%}
```

---

## Step 2
Create a new asset: **component-cart-progress.css**

- Code editor > Assets > Add a new asset > Create a blank file > Name: `component-cart-progress`, Extension: `css`
- Paste this code:

```css
.sc_cart-progress {
  display: block;
  padding: 0 0 1.5rem;
  --sc_cart-progress-color: rgb(var(--color-button));
}

.sc_cart-progress__message {
  margin: 0;
  text-align: center;
  font-size: 1.4rem;
}

.sc_cart-progress__delivery, .sc_cart-progress__delivery p{
  margin: 0;
  font-size: 1.4rem;
  line-height: normal;
}

.sc_cart-progress__delivery-wrapper {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
}

.sc_cart-progress__message {
  margin-top: 0.2rem;
  font-weight: 600;
}

.sc_cart-progress__track-wrapper {
  position: relative;
  margin: 0.6rem 1.2rem 0;
  height: 2.4rem;
}

.sc_cart-progress__track {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 0.6rem;
  transform: translateY(-50%);
  border-radius: 0.3rem;
  background: rgba(var(--color-foreground), 0.12);
  overflow: hidden;
}

.sc_cart-progress__fill {
  display: block;
  height: 100%;
  background: var(--sc_cart-progress-color);
  transition: width 0.4s ease;
}

.sc_cart-progress__icon {
  position: absolute;
  top: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  padding: 0.3rem;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: rgb(var(--color-background));
  color: rgba(var(--color-foreground), 0.6);
  border: 0.1rem solid rgba(var(--color-foreground), 0.2);
}

.sc_cart-progress__icon--start,
.sc_cart-progress__icon.is-reached {
  color: rgb(var(--color-button-text));
  background: var(--sc_cart-progress-color);
  border-color: var(--sc_cart-progress-color);
}

.sc_cart-progress__icon svg {
  width: 100%;
  height: 100%;
}

.sc_cart-progress__gift {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.5rem;
  padding: 0.8rem 1rem;
  border: 0.1rem dashed rgba(var(--color-foreground), 0.3);
  border-radius: 0.4rem;
  font-size: 1.3rem;
  opacity: 0.7;
  background: #f3f3f3;
}

.sc_cart-progress__gift.is-unlocked {
  opacity: 1;
  border-style: solid;
}

.sc_cart-progress__gift-headline {
  font-weight: 700;
  font-size: 1.6rem;
  line-height: 1;
}

.sc_cart-progress__gift-text-info-title {
  font-weight: 600;
}

.sc_cart-progress__gift-text-info {
  display: flex;
  flex-direction: column;
  line-height: normal;
}

.sc_cart-progress__gift-image {
  flex: 0 0 5rem;
  width: 5rem;
  height: auto;
  object-fit: cover;
}

.sc_cart-progress__gift-text {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.sc_cart-progress__gift-status {
  color: rgba(var(--color-foreground), 0.7);
}

/* Gift quantity is fixed at 1; with auto add on, the cart total also controls removal */
.sc_cart-item--free-gift quantity-input,
.sc_cart-item--free-gift .quantity-popover__info-button {
  display: none;
}

.sc_cart-item--free-gift-locked .cart-item__quantity-wrapper {
  display: none;
}

.sc_cart-progress__gift-add {
  min-height: 3.6rem;
  padding: 0 1.6rem;
  width: fit-content;
}
```

---

## Step 3
Create a new asset: **cart-free-gift.js**

- Code editor > Assets > Add a new asset > Create a blank file > Name: `cart-free-gift`, Extension: `js`
- Paste this code:

```js
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
```

---

## Step 4
Add the settings to the theme settings schema

- Open `config/settings_schema.json`.
- Find the **Cart** group (it contains the setting `"id": "cart_type"`). Inside it, find the `"settings": [ ... ]` array.
- Paste the following items at the **end** of that `settings` array (after the last existing setting).
- Make sure there is a comma between the previous last item and the first pasted item, but never a comma after the very last item.
- Tip: If you get a red error in the editor, you likely have a missing or extra comma or quote. Compare carefully.

```json
{
  "type": "header",
  "content": "Free shipping progress bar",
  "info": "Amounts are in the smallest currency unit (cents), e.g. 3000 = €30.00. Works with the cart drawer only."
},
{
  "type": "checkbox",
  "id": "cart_progress_enabled",
  "label": "Enable free shipping progress bar",
  "default": false
},
{
  "type": "number",
  "id": "cart_shipping_threshold",
  "label": "Free shipping minimum amount",
  "info": "In cents, e.g. 5000 = €50.00",
  "default": 7000
},
{
  "type": "richtext",
  "id": "cart_delivery_message",
  "label": "Delivery reassurance message",
  "default": "<p><strong>Great choice!</strong><br>Your order will arrive in 2-3 working days</p>"
},
{
  "type": "text",
  "id": "cart_shipping_remaining_message",
  "label": "Amount left message",
  "info": "Use [amount] where the missing amount should appear",
  "default": "Only [amount] left for free shipping"
},
{
  "type": "text",
  "id": "cart_shipping_unlocked_message",
  "label": "Free shipping reached message",
  "default": "You've unlocked free shipping!"
},
{
  "type": "html",
  "id": "cart_progress_start_icon",
  "label": "Progress bar start icon",
  "info": "Paste SVG code. Leave empty to use the default icon."
},
{
  "type": "html",
  "id": "cart_progress_shipping_icon",
  "label": "Progress bar free shipping icon",
  "info": "Paste SVG code. Leave empty to use the default icon."
},
{
  "type": "header",
  "content": "Free gift",
  "info": "The gift product must cost €0 and its inventory is managed manually. A sold-out gift is shown but cannot be added."
},
{
  "type": "checkbox",
  "id": "cart_free_gift_enabled",
  "label": "Enable free item",
  "default": false
},
{
  "type": "text",
  "id": "cart_free_gift_headline",
  "label": "Cart free gift headline",
  "default": "Free gift"
},
{
  "type": "number",
  "id": "cart_free_gift_min_amount",
  "label": "Free gift minimum amount",
  "info": "In cents, e.g. 3000 = €30.00",
  "default": 5000
},
{
  "type": "product_list",
  "id": "cart_free_gift_products",
  "label": "Gift products",
  "info": "The first available product is used. Use a €0 product or variant.",
  "limit": 5
},
{
  "type": "checkbox",
  "id": "cart_free_gift_auto_add",
  "label": "Auto add",
  "default": true
},
{
  "type": "text",
  "id": "cart_free_gift_remaining_message",
  "label": "Gift amount left message",
  "info": "Use [amount] where the missing amount should appear",
  "default": "Only [amount] left for your free gift"
},
{
  "type": "text",
  "id": "cart_free_gift_unlocked_message",
  "label": "Gift unlocked message",
  "default": "Free gift unlocked!"
},
{
  "type": "html",
  "id": "cart_progress_gift_icon",
  "label": "Progress bar gift icon",
  "info": "Paste SVG code. Leave empty to use the default icon."
}
```

---

## Step 5
Edit the cart drawer snippet (3 small changes)

Open `snippets/cart-drawer.liquid` (the name varies by theme, see the top guide).

**5a. Load the CSS and JS.** Paste near the top of the file, next to the other `<script>` tags:

```liquid
{%- if settings.cart_progress_enabled -%}
  {{ 'component-cart-progress.css' | asset_url | stylesheet_tag }}
  <script src="{{ 'cart-free-gift.js' | asset_url }}" defer="defer"></script>
{%- endif -%}
```

**5b. Show the progress bar.** Find the opening tag `<cart-drawer-items` (the list of cart items). Paste this line **right above** it:

```liquid
{%- render 'cart-progress-bar' -%}
```

**5c. Mark the gift line.** Find the line that renders each cart row (a `<tr` with `class="cart-item`). Add the `{% if item.properties._free_gift ... %}` part below to the end of its class value:

```liquid
class="cart-item{% if item.properties._free_gift == 'true' %} sc_cart-item--free-gift{% if settings.cart_free_gift_auto_add %} sc_cart-item--free-gift-locked{% endif %}{% endif %}"
```

If the existing class already has other `{% if %}` parts (for example `cart-item__nested-line`), keep them and add the `_free_gift` part after them.

What this does: it hides the quantity selector on the gift line (the gift is always quantity 1). With Auto add on, it also hides the remove button, so the gift cannot be removed and instantly re-added.

---

## Step 6
Create the free gift product

How to create the gift (click-path):
- Shopify Admin > Products > Add product
- Title: for example "Free gift - Tote bag"
- Price: **0.00** (required, the gift must be free)
- Inventory: track quantity and set the stock you want to give away. Update it manually when stock changes.
- Status: Active, and make sure it is available on the **Online Store** sales channel.
- Save

If you also sell the same item at full price, create a **separate product** (or a separate variant) priced at 0 for the gift. Do not reuse the full-price variant.

---

## Step 7
Turn it on in the Theme Editor

- Online Store > Themes > Customize
- Click the **Theme settings** icon (left sidebar) > **Cart**
- Make sure **Type** is set to **Drawer**
- Scroll to **Free shipping progress bar** and set:

| Setting | What it does | Example |
|---|---|---|
| Enable free shipping progress bar | Master switch for the whole feature | On |
| Free shipping minimum amount | Cart value (in cents) that unlocks free shipping | 5000 = €50.00 |
| Delivery reassurance message | Text above the bar | Great choice! Your order will arrive in 2-3 working days |
| Amount left message | Shown while shipping is not unlocked. Write **[amount]** where the missing amount should appear | Only [amount] left for free shipping |
| Free shipping reached message | Shown once shipping is unlocked | You've unlocked free shipping! |
| Progress bar free shipping icon | Optional custom SVG code. Empty = default truck icon | |

- Scroll to **Free gift** and set:

| Setting | What it does | Example |
|---|---|---|
| Enable free item | Turns the free gift on | On |
| Cart free gift headline | Title of the gift box | Free gift |
| Free gift minimum amount | Cart value (in cents) that unlocks the gift | 7000 = €70.00 |
| Gift products | Pick the €0 gift product. The first available one is used | Free gift - Tote bag |
| Auto add | **On:** the gift is added to the cart automatically at the minimum. **Off:** an "Add" button appears in the gift box | On |
| Gift amount left message | Shown while the gift is still locked. Use **[amount]** | Only [amount] left for your free gift |
| Gift unlocked message | Shown when the gift is unlocked | Free gift unlocked! |
| Progress bar gift icon | Optional custom SVG code. Empty = default gift icon | |

- Click **Save**.

**How the bar behaves**
- The full width of the bar always equals the **larger** of the two amounts. Each icon sits at its own amount (for example shipping 5000 and gift 7000: the truck is at about 71% and the gift is at the end).
- The message under the bar always shows the **next goal that is not reached yet**. If the gift minimum is lower than the shipping minimum, the gift message comes first, then the shipping message. When both are reached, both unlocked messages show.
- If the cart drops back below the gift minimum, the gift is removed automatically.

**Custom icon tip (SVG)**
- Paste complete SVG code, for example: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">...</svg>`
- Use `currentColor` for stroke/fill so the icon follows the theme colors.

---

## Step 8
Test it

- Open your store (preview or live) and add a product to the cart. The drawer should show the delivery message, the bar and the "Only … left" message.
- Add more products until you pass the first goal: the message switches to the next goal.
- Pass the gift minimum: the gift is added as a €0 line (Auto add on), or an **Add** button shows in the gift box (Auto add off).
- Remove items so the cart goes below the gift minimum: the gift is removed from the cart.

---

## Troubleshooting (common issues)

- **Nothing shows in the cart drawer:** Check that Cart **Type** is **Drawer**, **Enable free shipping progress bar** is on, the cart is not empty, and at least one amount is greater than 0. Confirm Step 5b was pasted inside the drawer (above `<cart-drawer-items`).
- **The gift icon and gift box do not appear:** Check **Enable free item** is on, **Free gift minimum amount** is greater than 0, and a product is selected under **Gift products**.
- **The gift is added but is not free:** The gift product or variant is not priced at €0. Set its price to 0.00 (Step 6). The code does not check the price, so a paid product would be added at its normal price.
- **The gift is not added automatically:** Check **Auto add** is on, the gift is in stock, and the product is available on the Online Store sales channel. A sold-out gift shows as "Sold out" and is never added.
- **The message shows the text [amount]:** Only the exact text **[amount]** (square brackets) is replaced. Check the message settings.
- **Amounts look wrong:** Amounts are in cents, so 30 means €0.30. Use 3000 for €30.00. Multi-currency stores are not converted.
- **JSON error in settings_schema.json:** You likely misplaced a comma or quote in Step 4. Each item needs a comma after it, except the last one in the array.
- **I cannot find the cart drawer file:** Search the code editor for `cart-drawer`. If the theme has no cart drawer (only a cart page or popup), this feature cannot be installed as is.
- **Styling looks off:** All classes start with `sc_`. Adjust colors and spacing in `component-cart-progress.css`.
