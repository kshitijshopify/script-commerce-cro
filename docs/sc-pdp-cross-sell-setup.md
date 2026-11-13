# SC – Up-/Cross-selling: setup guide

This block shows a small "Buy it with" list of add-on products under the **Add to cart** button. Shoppers can add these products to their cart without leaving the product page.

You choose which add-on products show for each product. It takes about 10 minutes.

---

## Before you start

- **Back up your theme.** Go to **Online Store → Themes**, click **…** next to your theme, then **Duplicate**.
- **Check which case you're in:**
  - **A. The block is already installed in your theme** (it's in the ScriptCommerce test theme). Skip to **Step 2**.
  - **B. You need to add it to a different theme.** Start with **Step 1**.

---

## Step 1 – Add the files to your theme (only for case B)

Open the code editor: **Online Store → Themes → … → Edit code**.

### If your theme is Horizon (or another theme that has a `blocks` folder)

1. In the **snippets** folder, click **Add a new snippet** and name it `sc-pdp-cross-sell`. Paste in the full contents of `snippets/sc-pdp-cross-sell.liquid`, then click **Save**.
2. In the **blocks** folder, click **Add a new block** and name it `sc-pdp-cross-sell`. Paste in the full contents of `blocks/sc-pdp-cross-sell.liquid`, then click **Save**.

That's all. Go to Step 2.

### If your theme is Dawn or a Dawn-like theme (no `blocks` folder)

1. **Create the snippet.** Follow point 1 from the Horizon steps above.
2. **Open the product section.** It's usually `sections/main-product.liquid`.
   - If you can't find it, open `templates/product.json`. Find the section type next to `"main"`, for example `"type": "main-product"`. Then open the file in `sections/` with that name.
3. **Show the block on the page.** Search the file (Ctrl/Cmd + F) for `{%- when 'buy_buttons' -%}`. Find the next line that starts with `{%- when`. Paste these two lines just above it:

   ```liquid
   {%- when 'sc_pdp_cross_sell' -%}
     {% render 'sc-pdp-cross-sell', block: block, product: product %}
   ```

4. **Add the block settings.** Scroll to the bottom of the file, to `{% schema %}`. Find the line `"blocks": [`. Paste the whole block definition directly under it, followed by a comma. You'll find that definition in this repo's `sections/main-product.liquid`, in the object that starts with `"type": "sc_pdp_cross_sell"`.
5. Click **Save**. If the editor shows a red error, a comma is usually missing or there's one too many. Every block object needs a comma after it, except the last one.

---

## Step 2 – Create the product metafield (one time)

1. Go to **Settings → Custom data → Products**.
2. Click **Add definition**.
3. Fill in:
   - **Name:** `CRO | Up/Cross-Selling`
   - **Namespace and key:** `standard.cro_up_cross_selling`
   - **Type:** **Product**, then select **List of products**
4. Click **Save**.

> Already using the old "CRO | Cross selling" block? The new block uses the same metafield, so the products you've already picked carry over automatically.

---

## Step 3 – Choose add-on products for a product

1. Go to **Products** and open a product, for example a camera.
2. Scroll down to **Metafields** and click **CRO | Up/Cross-Selling**.
3. Pick one or more add-on products, for example a case and a strap. The order you pick them in is the order they appear.
4. Click **Save**.

Repeat for every product that should show add-ons. If a product has no add-ons, the block stays hidden on its page, unless you use the Search & Discovery option below.

---

## Step 3B – Or let Search & Discovery fill it (no metafield needed)

You don't have to pick add-ons for every product by hand. The block can also show products from Shopify's free **Search & Discovery** app.

**Option 1: Complementary products (you choose them in the app)**

1. Install **Search & Discovery** from the Shopify App Store, if you don't have it yet.
2. Open the app and go to **Product recommendations**.
3. Search for a product, for example the camera. Under **Complementary products**, add the add-ons, for example a case and a strap.
4. Click **Save**.

**Option 2: Related products (automatic)**

Shopify suggests these automatically, based on what customers buy together and on similar products. You don't need to set anything up. Shopify needs some order history before it has good suggestions. In the app's **Related products** section you can also add or remove suggestions yourself.

**Choose which products the block shows**

In the block settings, **Product source** controls this:

| Product source | What shows |
|---|---|
| **Metafield, then Search & Discovery** (default) | The products you picked in the metafield. If there are none, Search & Discovery products. |
| **Metafield only** | Only the products you picked in the metafield. |
| **Search & Discovery only** | Only the products from the app. |

Use **Search & Discovery recommendations** to choose **Complementary, then related** (default), **Complementary only** or **Related only**.

If nothing is found anywhere, the block shows the **Fallback collection** (if one is set) or stays hidden.

> Note: Search & Discovery changes can take a few minutes to show on the store.

---

## Step 4 – Add the block on the product page

1. Go to **Online Store → Themes → Customize**.
2. In the page selector at the top, choose **Products → Default product**. Then preview a product that has add-ons.
3. In the left sidebar, click your product section, then **Add block → SC – Up-/Cross-selling**.
4. Drag the block so it sits directly under **Buy buttons**.
5. Click **Save**.

Tip: in the editor, the block always shows, even on a product with no add-ons. It shows sample products and a grey note so you can still style it. Shoppers never see the sample products or the note.

---

## Step 5 – Adjust the look (optional)

The most useful settings:

| Setting | What it does |
|---|---|
| **Heading** | The title above the products, for example "Buy it with", "Pairs well with" or "Goes well with". |
| **Layout** | **Slides**: a carousel with arrows. **Stack**: a list that opens and closes when the heading is clicked. **Normal**: a list that's always open. |
| **Open stack by default** | Only for the Stack layout. Sets whether the list starts open. |
| **When to show** | **Always**, or **After main product is added to cart**. The second option keeps the shopper focused on the main product first. |
| **Product source** | Metafield, Search & Discovery, or both (see Step 3B). |
| **Maximum products** | The most add-ons shown: up to 12 from the metafield, up to 10 from Search & Discovery. |
| **Products with several variants** | **Dropdown** lets the shopper pick the size or colour. **First available** adds the first in-stock variant and shows its name. **Link** sends the shopper to that product's page. |
| **Sold-out products** | Hide them, or show them with a disabled button. |
| **Button text / Success text** | For example "+ Add" and "Added". |
| **After adding** | Open the cart drawer, stay on the page and only update the cart count, or go to the cart page. |
| **Fallback collection** | Optional. Shown on products that have no add-ons picked. |
| **Colours, sizes, spacing** | Heading, product text, prices, button, arrows, box, and spacing for desktop and mobile. |

---

## Troubleshooting

| Problem | Fix |
|---|---|
| The block doesn't appear on the live store | Check that the product has add-ons picked (Step 3) and that **Show up-/cross-selling** is ticked. Also check that the add-ons are published to the Online Store and that sold-out products aren't hidden. |
| Search & Discovery products don't show | Check that **Product source** isn't set to **Metafield only**, and that the product has complementary products saved in the app. Wait a few minutes after saving in the app. Note that Related products need order history. |
| It only appears after adding to cart | **When to show** is set to **After main product is added to cart**. Change it to **Always**. |
| The metafield doesn't appear on the product | Check that the definition's type is **Product → List of products** (Step 2). |
| The block is missing from the **Add block** list | The files from Step 1 weren't saved, or the schema has a comma error. |
| The cart drawer doesn't open after adding | Some themes don't have a drawer. Set **After adding** to **Stay on page** or **Go to cart page**. |
| "You can't add more…" message | The add-on product has no more stock available. |

---

## For developers

- Everything (Liquid, CSS, JS) lives in `snippets/sc-pdp-cross-sell.liquid`. All classes start with `sc-pcs`, and all CSS is scoped to the block id.
- The carousel is native CSS scroll-snap, with no Swiper or CDN.
- Search & Discovery products are loaded by JS from `{{ routes.product_recommendations_url }}.json?product_id=…&intent=complementary`, then `intent=related`. Rows use the same markup as the Liquid rows, and prices use `shop.money_format`. The block stays hidden until the request finishes, so it never shows an empty box.
- Order of sources: metafield (Liquid), then Search & Discovery (JS), then the fallback collection (Liquid, shown if JS finds nothing).
- Products are added to the cart with `POST /cart/add.js`. The block never reuses the main product form.
- After adding, the block refreshes the cart in the theme's own way:
  - **Dawn:** `cart-drawer` / `cart-notification` `renderContents()` and `PUB_SUB_EVENTS.cartUpdate`
  - **Horizon:** a `cart:update` event, then it opens `cart-drawer-component`
  - **Other themes:** a `cart:refresh` event
- Analytics events, which bubble from the block:
  - `sc:cross-sell:added`, with variant, product, main product, cart and `source` (`metafield`, `complementary`, `related` or `collection`) in the detail
  - `sc:cross-sell:loaded`, sent after the Search & Discovery request finishes
  - `sc:cross-sell:error`
  - `sc:cross-sell:arrow`
  - `sc:cross-sell:toggle`

  Use these to track attach rate and arrow clicks.
