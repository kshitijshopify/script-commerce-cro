# SC – Quantity discounts: setup guide

This block adds a "Buy more, save more" box to the product page. Shoppers pick a tier (for example 1 unit, 2 units save 10%, 3+ units save 15%) and the block shows the discounted price for each one. Picking a tier sets the quantity that gets added to the cart.

> **Important:** the block only **shows** the discount. The price at checkout comes from a Shopify discount, which you create in Step 3. Without that discount, customers still pay full price.

---

## Step 1 – Add the files (only if the block isn't in your theme yet)

Open **Online Store → Themes → … → Edit code**.

- **Every theme:** in **snippets**, add `sc-pdp-quantity-discounts` and paste in `snippets/sc-pdp-quantity-discounts.liquid`.
- **Horizon (or any theme with a `blocks` folder):** in **blocks**, add `sc-pdp-quantity-discounts` and paste in `blocks/sc-pdp-quantity-discounts.liquid`.
- **Dawn-like themes (no `blocks` folder):** in `sections/main-product.liquid`:
  1. Next to the other `{%- when ... -%}` lines, add:
     ```liquid
     {%- when 'sc_pdp_quantity_discounts' -%}
       {% render 'sc-pdp-quantity-discounts', block: block, product: product, section: section %}
     ```
  2. Copy the `sc_pdp_quantity_discounts` block from the `"blocks"` list in the schema of this repo's `main-product.liquid` into the same list in your theme.

## Step 2 – Add the block to the product page

1. Go to **Online Store → Themes → Customize** and open a product page.
2. In the product information section, click **Add block → SC – Quantity discounts**.
3. Drag it above **Buy buttons**.
4. Keep the theme's **Quantity selector** block. By default the block hides it and sets the quantity through it in the background. If your theme has no quantity selector, the block adds a hidden one for you.

## Step 3 – Create the real discount (one per tier)

Repeat these steps for each tier that has a discount (for example 2 units = 10% and 3 units = 15%):

1. Go to **Discounts → Create discount → Amount off products**.
2. **Method:** Automatic discount. **Title:** for example "Buy 2, save 10%". Customers see this title in the cart and at checkout.
3. **Discount value:** Percentage, 10. Use the same number as the tier's **Discount %** setting.
4. **Applies to:** the products (or collection) that show the block.
5. **Minimum purchase requirements:** Minimum quantity of items, 2. Use the same number as the tier's **Quantity** setting.
6. Save.

When a cart qualifies for more than one tier (for example 3 units qualifies for both 10% and 15%), Shopify applies the best discount. Leave **Combinations** off, so the tiers don't stack.

Good to know: the minimum quantity counts **all** eligible items in the cart. For example, 1 × variant A plus 1 × variant B can unlock the 2-unit tier.

## Step 4 – Set up the tiers

In the block settings, **Tier 1–4**:

| Setting | Example | Meaning |
|---|---|---|
| Show tier | on | Turn a tier on or off |
| Quantity | 2 | Units added to the cart when this tier is picked |
| Discount % | 10 | Must match the Shopify discount from Step 3 |
| Label | `2 units, save [percent]%` | Text on the tier |
| Badge | `Popular` | Optional label on the tier border |

Placeholders you can use in the label: `[qty]` quantity · `[percent]` % saved · `[price]` tier total · `[savings]` amount saved.

## Other settings

- **Only show on products tagged:** show the block only on products that have the discount, for example with the tag `volume-pricing`. Leave empty to show it everywhere.
- **Preselected tier:** "Tier with a badge" (the default) preselects the "Popular" tier, so the page opens with quantity 2.
- **Show Add to cart button:** shows a button inside the box. It clicks the theme's Add to cart, so the cart drawer opens as usual. You only need it if you hide the theme's buy buttons.
- **Stock:** if a variant tracks inventory and has fewer units than a tier needs, that tier is greyed out and can't be picked.

## Tracking

Every time a shopper picks a tier, the block fires a browser event you can send to your analytics (GA4, Klaviyo, etc.):

```js
document.addEventListener('sc:quantity-discounts:change', (e) => {
  // e.detail = { productId, variantId, quantity, tier, discount }
});
```
