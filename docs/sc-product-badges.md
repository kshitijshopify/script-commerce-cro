# SC | PDP Product Badges (CRO)

Script Commerce version of the "PDP product badges" CRO. All classes/IDs/settings use the `sc_` prefix.

## Step 1 – Section schema block
File: `sections/main-product.liquid`
- Schema block `sc_product_badges` ("SC | Product Badges", limit 1) added before the `title` block.
- Render case `{%- when 'sc_product_badges' -%}` added in the block loop.
- Setting IDs: `sc_badge_*`, `sc_icon_badge_1..3`, `sc_color_badge_1..3`, `sc_border_badge_1..3`, `sc_background_badge_1..3`.

## Step 2 – Snippet
File: `snippets/sc_product_badges.liquid`
- Renders only when at least one badge metafield has a value.
- Styles are scoped by block ID (`#sc_badges-{{ block.id }}`), so no clashes with other CSS.
- Classes: `.sc_badges`, `.sc_badges--top-left|top-right`, `.sc_badge`, `.sc_badge--1|2|3`.

## Step 3 – Wiring
Dawn has no `product-info` snippet, so instead of pasting a render call there, the block is rendered in the `main-product.liquid` block loop:
`{%- render 'sc_product_badges', product: product, block: block -%}`
In the theme editor: Product page > Add block > "SC | Product Badges" and drag it above/below the Title.

## Step 4 – Metafield definition (Settings > Custom data > Products)
| Name | Namespace and key | Type |
|---|---|---|
| SC \| Product Badges | custom.sc_product_badges | List of single line text (item count max 3) |

Item 1 = Badge 01, item 2 = Badge 02, item 3 = Badge 03 (styling per badge in the theme editor).
(`standard.` is a reserved namespace, so `custom.` is used.)

## Differences from the competitor version
- Title is not re-rendered by the snippet (Dawn already has a Title block) – avoids duplicate H1.
- Removed "Below the title" and "Gap with Title" settings; ordering is controlled by block order in the editor.
- Badge text is escaped; empty badges are not rendered (the original showed empty boxes).
- Mobile breakpoint aligned to Dawn (749px).

## QA checklist
- [ ] No metafields filled → nothing rendered
- [ ] Only badge 02 filled → only one badge, no empty boxes
- [ ] Icon on/off, left/right alignment, custom font in theme editor
- [ ] Mobile view, no horizontal overflow
