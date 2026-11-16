# SC – Variant cards: setup guide

This block replaces the normal size/variant buttons on the product page with cards. Each card shows the variant name, the price per kg (or per litre), a "Save 37%" badge and, if you choose, a "Bestseller" label.

---

## Step 1 – Add the files (only if the block isn't in your theme yet)

Open **Online Store → Themes → … → Edit code**.

- **Every theme:** in **snippets**, add `sc-pdp-variant-cards` and paste in `snippets/sc-pdp-variant-cards.liquid`.
- **Horizon (or any theme with a `blocks` folder):** in **blocks**, add `sc-pdp-variant-cards` and paste in `blocks/sc-pdp-variant-cards.liquid`.
- **Dawn-like themes (no `blocks` folder):** in `sections/main-product.liquid`:
  1. Next to the other `{%- when ... -%}` lines, add:
     ```liquid
     {%- when 'sc_pdp_variant_cards' -%}
       {% render 'sc-pdp-variant-cards', block: block, product: product, section: section %}
     ```
  2. Copy the `sc_pdp_variant_cards` block from the `"blocks"` list in the schema of this repo's `main-product.liquid` into the same list in your theme.

## Step 2 – Add the block to the product page

1. Go to **Online Store → Themes → Customize** and open a product page.
2. In the product information section, click **Add block → SC – Variant cards**.
3. Drag it to where the variant picker is, above **Buy buttons**.
4. Keep the theme's own **Variant picker** block. The cards hide it and use it in the background, so the price, images and Add to cart button keep updating.

## Step 3 – Unit prices (price per kg)

Pick one of these:

- **Easiest:** fill in each variant's **Shipping weight** (e.g. 7.3 kg). The block shows the price per kg by default. You can change it to per 100 g, lb or oz in **Unit price → Show weight-based prices per**.
- **Shopify unit price:** on the variant, tick **Show unit price** and fill in the quantity. The block uses these values first.
- **Other units (litres, m², pieces):** create a **variant** metafield `custom.unit_quantity` (type *Volume*, *Weight* or *Decimal*) and fill it in on each variant. For *Decimal*, choose the unit in **Unit price → Unit of number metafields**.

If a variant has none of these, the card doesn't show a unit price or a savings badge. By default it shows the normal price instead.

## Step 4 – Savings badge

The badge compares each card's unit price with a reference variant:

> Savings % = (reference price per unit − this card's price per unit) ÷ reference price per unit × 100

The reference is the **first variant** by default (usually the smallest pack). You can change it to the **highest unit price**. Badges below **Minimum savings to show** are hidden. You can also base the badge on the **compare-at price**.

## Step 5 – "Bestseller" label

1. Go to **Settings → Custom data → Variants → Add definition**.
2. Name: `Popular variant`. Namespace and key: `custom.popular_variant`. Type: **True or false**. Save.
3. Open the product, click the variant (e.g. 7.3 kg), set **Popular variant** to **True**, and save.

The label shows on every variant set to True. Change the text and colours in the block's **Popular variant label** settings.
