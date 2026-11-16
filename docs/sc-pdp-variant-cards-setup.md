# SC – Variant cards: setup guide

This block replaces the normal size/variant buttons on the product page with cards. Each card shows the variant name, the price per kg, a "Save 37%" badge and, if you choose, a "Bestseller" label.

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

## Step 3 – Price per kg

Fill in each variant's **Shipping weight** (e.g. 7.3 kg). That's all. You can show the price per 100 g, lb or oz instead in the **Weight-based price per** setting.

For other units (per litre, per m²), tick **Show unit price** on the variant in Shopify and fill in the quantity. The block uses Shopify's unit price first when it's set.

If a variant has neither, its card shows the normal price instead, with no savings badge.

## Step 4 – Savings badge

This needs no setup. The badge compares each card's price per kg with the **first variant's**:

> Savings % = (first variant's price per kg − this card's price per kg) ÷ first variant's price per kg × 100

To hide the badge, clear the **Badge text** setting.

## Step 5 – "Bestseller" label (the only metafield needed)

1. Go to **Settings → Custom data → Variants → Add definition**.
2. Name: `Popular variant`. Namespace and key: `custom.popular_variant`. Type: **True or false**. Save.
3. Open the product, click the variant (e.g. 7.3 kg), set **Popular variant** to **True**, and save.

The label shows on every variant set to True. Change the text in the block's **Label** setting, or clear it to hide the label.
