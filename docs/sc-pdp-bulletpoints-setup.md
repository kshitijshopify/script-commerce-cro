# SC – PDP Bulletpoints: setup guide

This block shows a short list of product benefits (USPs) near the product title, variant picker or **Add to cart** button. Each product can have its own bullets.

It takes about 5 minutes.

---

## Before you start

- **Back up your theme.** Go to **Online Store → Themes**, click **…** next to your theme, then **Duplicate**.
- **Check which case you're in:**
  - **A. The block is already installed in your theme** (it's in the ScriptCommerce test theme). Skip to **Step 2**.
  - **B. You need to add it to a different theme.** Start with **Step 1**.

---

## Step 1 – Add the files to your theme (only for case B)

Open the code editor: **Online Store → Themes → … → Edit code**.

This block is for Dawn and Dawn-like themes (product section with a `{%- case block.type -%}` loop).

1. **Create the snippet.** In the **snippets** folder, click **Add a new snippet** and name it `sc-pdp-bulletpoints`. Paste in the full contents of `snippets/sc-pdp-bulletpoints.liquid`, then click **Save**.
2. **Open the product section.** It's usually `sections/main-product.liquid`. (If you can't find it, open `templates/product.json` and look at the `"type"` of the `"main"` section.)
3. **Show the block on the page.** Search the file for `{%- when 'buy_buttons' -%}`. Paste these two lines just above it:

   ```liquid
   {%- when 'sc_bulletpoints' -%}
     {% render 'sc-pdp-bulletpoints', block: block, product: product %}
   ```

4. **Add the block settings.** Scroll to `{% schema %}` and find `"blocks": [`. Copy the whole `"type": "sc_bulletpoints"` block from `sections/main-product.liquid` in the ScriptCommerce theme and paste it inside that list (add a comma between blocks). Click **Save**.

---

## Step 2 – Create the metafield (one time per store)

1. Go to **Settings → Custom data → Products → Add definition**.
2. Fill in:
   - **Name:** `CRO | PDP | Bulletpoints`
   - **Namespace and key:** `standard.cro_pdp_bulletpoints`
   - **Type:** **Single line text** → select **List of values**
3. Click **Save**.

If your store already has this metafield from the old "CRO | Bulletpoints" block, skip this step – your existing bullets work as they are.

> Want a different metafield? Type its `namespace.key` in the block's **Metafield** setting. Single or multi-line text fields also work (one bullet per line).

---

## Step 3 – Add bullets to a product

1. Open a product in **Products**.
2. Scroll to **Metafields** → **CRO | PDP | Bulletpoints**.
3. Add one value per bullet (up to 5 are shown by default – change **Maximum bullets** in the block to show more).
4. Optional formatting inside a bullet:
   - `**text**` → **bold**
   - `*text*` → *italic*
   - `__text__` → underlined

   Other HTML is shown as plain text (it is never run as code).

Products without bullets show nothing – unless you fill **Fallback bullets** in the block (one per line), which then shows for every product without its own bullets.

---

## Step 4 – Place and style the block

1. Go to **Online Store → Themes → Customize** and open a product page.
2. In the product information section click **Add block → SC – PDP Bulletpoints**. Drag it under the title, price or variant picker.
3. Style it:
   - **List style:** Disc, Circle, Decimal or Icon.
   - **Icon:** pick a default check icon, upload an image, or paste your own SVG. **Icon source = Auto** uses image → SVG → default, in that order.
   - **Container:** border on/off, border color, corner radius, background. Turn off the border and leave the background transparent for a plain list.
   - **Typography:** desktop and mobile font size (0 = theme default), font weight.
4. Click **Save**.

### Custom SVG rules

Paste a single `<svg>…</svg>`. For safety, an SVG that contains scripts, `on…=` event attributes, links (`href`), `<style>`, `<foreignObject>` or `<iframe>` is ignored and the default icon shows instead. Use `fill="currentColor"` or `stroke="currentColor"` so **Icon color** applies.

---

## Changes compared with the old "CRO | Bulletpoints" block

- New block type `sc_bulletpoints` (old: `cro_bulletpoints`). Re-add the block once in the theme editor; the metafield stays the same.
- Mobile font size now works (the old CSS had a `max-with` typo).
- Setting `icon_margin_rigght` is now `icon_margin_right`.
- Transparent colors fall back to the theme's own text color / no background (no theme-specific settings needed).
- Icons line up with the first line of long, multi-line bullets.
