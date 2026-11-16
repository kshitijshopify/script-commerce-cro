# SC – Free gift (cart page + cart drawer): setup guide

The free gift progress bar shows customers how much more they need to spend to unlock a free gift. When they reach the minimum, the gift is unlocked and either added automatically or with one click. It appears on the **cart page** and in the **cart drawer**, both driven by one set of theme settings.

Files:
- `snippets/sc-cart-free-gift.liquid` – all markup, CSS and JS.
- `config/settings_schema.json` – settings group **SC – Free gift** (ids `sc_fg_…`).
- `sections/main-cart-items.liquid` – renders it on the cart page (`placement: 'cart'`, above the cart items).
- `snippets/cart-drawer.liquid` – renders it in the drawer (`placement: 'drawer'`, below the drawer heading).

---

## 1. Set up the gift so it really is free

Picking a product in theme settings does **not** make it free. Choose one of these two methods and set **Gift pricing** to match.

### Option A – Dedicated 0.00 gift product (recommended, simplest)

1. In Shopify admin, duplicate the product you want to give away.
2. Set its price to **0.00**. Optional: set a compare-at price (e.g. 19.90) so the bar can show the gift's value crossed out.
3. Add the tag `hidden` and remove it from collections and search so nobody buys it directly.
4. Make sure it has stock (or allow selling when out of stock).
5. In settings, choose this product and set **Gift pricing → Gift product priced 0.00**.

Safety: if the selected product costs more than 0.00 in this mode, the bar is not shown on the storefront and the Theme Editor shows a warning. Customers are never charged for a "free" gift.

### Option B – Automatic discount on a normal product

1. Shopify admin → **Discounts → Create discount → Buy X get Y** (or "Amount off products" at 100%).
2. Minimum purchase amount = the **same amount** as "Free gift minimum amount".
3. Customer gets: the gift product, quantity 1, **Free**.
4. Make it an **Automatic** discount.
5. In settings, choose the same product and set **Gift pricing → Automatic discount makes it free**.

If the gift line in the cart is not actually 0.00, the bar shows the real price instead of "Free". Test one full checkout to confirm the discount applies.

---

## 2. Turn it on

1. Online Store → Themes → Customize → **Theme settings** (gear icon) → **SC – Free gift**.
2. Fill in:
   - **Enable free gift** – master switch (use it for A/B tests).
   - **Show on cart page** / **Show in cart drawer**. The drawer needs Theme settings → Cart → Cart type: **Drawer**.
   - **Cart free gift headline**, **Free gift minimum amount** (e.g. `100` = 100.00 in your default currency).
   - **Gift product** and **Gift pricing** (see above).
   - **Auto add** – on: added as soon as the minimum is reached. Off: customers see an "Add free gift" button.
   - **Progress bar icon** – built-in icon, your own image, or pasted SVG code.
3. Save.

---

## 3. Rules

| Situation | What happens |
|---|---|
| Cart below minimum | "Add [amount] more…", bar partly filled, gift shown as locked. |
| Cart reaches minimum, Auto add ON | Gift added once (quantity 1); cart drawer / cart page and header count update without reload. |
| Cart reaches minimum, Auto add OFF | Unlocked message + "Add free gift" button. |
| Customer removes the gift while still eligible | Default: not re-added for the rest of the visit, the button comes back. Setting can switch to always re-add. |
| Cart drops below minimum | Gift removed, short note explains why (setting, on by default). |
| Customer raises the gift quantity | Reset to 1; duplicate gift lines merged. |
| Cart is empty | Hidden (setting). |
| Gift sold out | Hidden (setting), or shown with the "sold out" message. |

**What counts towards the minimum:** subtotal after product discounts (default), subtotal before discounts, or total after all discounts. The gift's own price is always excluded, so the gift can never help the cart qualify for itself.

**Currencies / Markets:** the minimum is converted with Shopify's live rate for other currencies (optionally rounded up to a whole number). Amounts use your store's money format.

Gift lines added by the bar carry a hidden line item property `_sc_free_gift` (not shown to customers).

Note: Auto add runs wherever the bar is rendered, i.e. when the cart drawer opens/refreshes or the cart page loads. With Cart type "Page" or "Popup notification", the gift is added when the customer reaches the cart page.

---

## 4. Messages

Placeholders: `[amount]` (amount still needed), `[threshold]` (minimum), `[gift]` (gift product name).

---

## 5. A/B testing

Use **Enable free gift** (or a duplicated theme) for the control group. No A/B tool code is included, so any tool can switch it. The original test result was not documented – treat a higher AOV as a hypothesis to validate.

Suggested metrics: AOV, conversion rate, revenue per visitor, % of carts reaching the minimum, gift attachment rate, items per order, checkout initiation rate.

---

## 6. How it updates (for developers)

- A watcher wraps `fetch` and `XMLHttpRequest` once per page and fires `sc:cart:changed` after any `/cart/add`, `/cart/change`, `/cart/update` or `/cart/clear` call (theme or app). The bar then reads `/cart.js` and redraws.
- When Dawn re-renders the drawer or cart page HTML, the snippet is rendered again server-side with the fresh cart. The last known gift state is kept in `sessionStorage`, so a removal by the customer is still recognised.
- The bar's own requests send `X-SC-Internal: 1` (ignored by the watcher → no loop). All instances share one lock and re-read the cart right before changing it, so the drawer and cart page never add the gift twice. Loop guard: at most 3 automatic gift changes in a row without a customer cart change in between.
- After the bar changes the gift it re-renders, via the Section Rendering API: Dawn's drawer (`cart-drawer` → `.drawer__inner`), the header bubble (`cart-icon-bubble`) and, on `/cart`, the cart sections in `<main>`. It also sends a Horizon-style `cart:update` event and `sc:free-gift:updated`. If rendering fails the page reloads; "Reload the page" can be chosen in settings.
- Custom code can request a recalculation: `document.dispatchEvent(new Event('sc:cart:refresh'))`.
- Inside the Theme Editor the gift is never added or removed automatically.
- Custom SVG icons are rebuilt from an allow-list of shape elements; scripts, links, styles and event handlers are dropped.

**Other themes (e.g. Horizon):** copy the snippet and the "SC – Free gift" settings group, then add `{% render 'sc-cart-free-gift', placement: 'cart' %}` to the cart page section and `{% render 'sc-cart-free-gift', placement: 'drawer' %}` to the cart drawer, above the line items.

---

## 7. Test checklist

- [ ] Cart below / just below / exactly at / above the minimum (cart page and drawer)
- [ ] Lower quantity so the cart drops below → gift removed, note shown
- [ ] Empty cart → bar hidden
- [ ] Auto add ON → gift added once, appears in the line items and header count
- [ ] Add to cart from a product page → drawer opens with the updated bar
- [ ] Remove gift while eligible → not re-added, button shown
- [ ] Auto add OFF → button adds the gift, keyboard (Tab + Enter) works
- [ ] Gift quantity raised → back to 1
- [ ] Gift is 0.00 at checkout
- [ ] Other currency (market) → converted minimum and correct format
- [ ] Desktop, tablet, mobile – no horizontal scroll
- [ ] Theme Editor: change minimum, product, messages, icon, colours; enable/disable

## 8. Gift choices, second gift and free shipping milestone

All optional and off by default – with them off the bar works exactly as described above.

**More gift choices (tier 1).** Theme settings → SC – Free gift → *More gift choices*. The
customer sees every product and can add one of them (one gift per tier). Auto add uses the
first available product. Each product must be free under the chosen *Gift pricing*
(0.00 product, or covered by the automatic discount).

**Second free gift (tier 2).** *Second free gift* → enable, set the minimum (higher than the
first gift's), pick the products, messages, optional icon and auto add.
- Offered only once a tier-1 gift is in the cart.
- With *Gift pricing: Automatic discount*, create a second automatic discount in Shopify
  that makes these products free from this minimum.
- Lines carry the hidden property `_sc_free_gift: 2`; they are removed when the cart drops
  below the second minimum (if *Remove gift when cart drops below minimum* is on).

**Free shipping milestone.** *Free shipping milestone* → enable and set the minimum. Make sure
your shipping rates really are free from this amount. The optimized cart drawer's own free
shipping bar hides itself while this milestone is shown in the drawer.

**One bar, several markers.** With the second gift or the shipping milestone on, the bar runs
to the highest minimum and shows a marker at each milestone (truck / gift 1 icon / gift 2).
Markers turn to the "unlocked" colours when reached. The message always talks about the
next milestone, so `[amount]` and `[threshold]` refer to that milestone.

**A/B testing.** *Display section* off keeps the markup but hides the bar
(class `sc-fg--off`); gifts are still handled. Show it in a test variant with
`.sc-fg--off { display: block !important; }`.

Test additionally:
- [ ] Tier 1 with several products: add one → the others disappear, "Added" shown
- [ ] Reach second minimum → tier-2 products appear after a tier-1 gift is in the cart
- [ ] Drop below second minimum → tier-2 gift removed, tier-1 gift kept
- [ ] Shipping marker turns green at the free shipping minimum; message moves on to the next gift

### Cart drawer: one bar

When **SC – Optimized cart drawer → Free shipping bar** is on, the drawer shows a single bar: the free shipping bar (`snippets/sc-free-shipping-bar.liquid`) gets a truck marker at the free shipping amount and a gift marker at the free gift minimum (plus the second gift, if enabled). The bar runs to the highest amount and the message is about the next milestone. The free gift component then sits below that bar with only its gift rows (`in_bar: true`); adding and removing gifts work as before. In this mode the drawer uses the cart drawer's free shipping amount, not "Free shipping milestone" from SC – Free gift (that one is still used on the cart page).
