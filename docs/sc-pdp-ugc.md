# SC | PDP UGC Customer Photo Carousel

## Files
- `snippets/sc-pdp-ugc.liquid` – markup, scoped CSS (`#sc_ugc-{{ block.id }}`, classes `sc_ugc__*`) and a small scoped JS (dots, autoplay).
- `sections/main-product.liquid` – schema block `sc_pdp_ugc` ("SC | UGC Section", limit 1) + `when` case in the block loop. Setting IDs are `sc_ugc_*`.

Dawn has no Flickity, `collapsible-content`, `toggle-button` or `icon` snippet (the competitor relies on all four), so this version is self-contained: CSS scroll-snap carousel, native `<details>` for the collapsible layout, text stars for ratings. No Step 5 (icon.liquid) needed.

## Store setup (Settings > Custom data)

### Metaobject definition
Name: `SC | PDP | UGC` — Type: `sc_pdp_ugc`

| Field | Key | Type |
|---|---|---|
| Name (display name, required) | `name` | Single line text |
| Button title | `button_title` | Single line text |
| Feedback title | `feedback_title` | Single line text |
| Feedback thumbnail 01..05 | `feedback_thumbnail_01` … `_05` | File – Image |
| Feedback avatar 01..05 | `feedback_avatar_01` … `_05` | File – Image |
| Feedback ratings 01..05 | `feedback_ratings_01` … `_05` | Decimal, min 1.0, max 5.0 |
| Feedback name 01..05 | `feedback_name_01` … `_05` | Single line text |
| Feedback label 01..05 | `feedback_label_01` … `_05` | Single line text |

(Field keys are the plain keys, without a type prefix.)

### Product metafield definition
Name: `SC | PDP | UGC` — Namespace and key: `custom.sc_pdp_ugc`
Type: Metaobject reference -> `SC | PDP | UGC` (single). Mixed reference also works.

## Behaviour
- A slide shows only if its thumbnail is set; avatar falls back to a placeholder.
- Ratings accept halves/decimals (4.5 etc.), rendered as a clipped star bar.
- Autoplay pauses on hover/focus and is disabled with `prefers-reduced-motion`. "Return to first" restarts from slide 1 after the last.
- Layout "Collapsible" uses `<details>`; "Open by default" sets `open`.

## Differences from the competitor version
- Removed the global `new Flickity('.main-carousel')` call (it targeted every carousel on the page and crashed without Flickity).
- Removed undefined settings (`feedback_margin_top/bottom`), duplicated "Rating" labels and a trailing comma in the schema JSON (invalid JSON).
- Dropped "Draggable" (native touch/trackpad scroll) and true wrap-around; "Infinite loop" became "return to first (autoplay)".
- Escaped text, lazy-loaded images (original loaded full-size `image.width`), CSS scoped per block, no `!important`.

## QA
- [ ] Product without metafield -> nothing renders
- [ ] 1, 3 and 5 slides; with/without avatar, rating, label
- [ ] Collapsible closed/open; Normal layout
- [ ] Dots follow scroll; autoplay on/off; mobile swipe
