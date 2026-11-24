# SC – PDP Review Spotlight: setup guide

A compact carousel of up to 10 curated customer reviews inside the product buy box, directly below the title/price. Each slide shows a star rating, a bold review title, a short review text and pagination dots. The reviews come from one **metaobject entry** linked to the product through a **product metafield**, so every product can have its own set of reviews.

Files:
- `snippets/sc-review-spotlight.liquid` – all markup, CSS and carousel JS (no Flickity or theme JS needed).
- `sections/main-product.liquid` – block **SC – Review Spotlight** (`sc_review_spotlight`, limit 1) + render case.
- `templates/product.json` – block placed after **Price** (can be moved in the Theme Editor).

Setup order: **metaobject definition → product metafield definition → review entry → link it to the product → Theme Editor.**

---

## 1. Create the metaobject definition (once per store)

Shopify admin → **Settings → Custom data → Metaobjects → Add definition**

| Setting | Value |
|---|---|
| Name | `CRO \| Review Spotlight` |
| Type | `cro_review_spotlight` (must be exactly this) |

Add these fields. The **key** must match exactly; the name can be anything.

| Name | Key | Type | Validation |
|---|---|---|---|
| Name | `name` | Single line text | Tick **Use as display name** |
| Rating 1 | `rating_1` | Integer | Minimum 1, Maximum 5 |
| Title 1 | `title_1` | Single line text | – |
| Content 1 | `content_1` | Multi-line text | – |
| Rating 2 | `rating_2` | Integer | Minimum 1, Maximum 5 |
| Title 2 | `title_2` | Single line text | – |
| Content 2 | `content_2` | Multi-line text | – |
| … | … | … | … |
| Rating 10 | `rating_10` | Integer | Minimum 1, Maximum 5 |
| Title 10 | `title_10` | Single line text | – |
| Content 10 | `content_10` | Multi-line text | – |

That is 31 fields in total: `name` + 10 × (`rating_N`, `title_N`, `content_N`).

**Important:** under **Access**, switch **Storefronts** to **Read / Active**. If it stays off, the theme cannot read the reviews and the block shows nothing.

Save.

---

## 2. Create the product metafield definition (once per store)

Shopify admin → **Settings → Custom data → Products → Add definition**

| Setting | Value |
|---|---|
| Name | `CRO \| PDP \| Review Spotlight` |
| Namespace and key | `standard.cro_pdp_review_spotlight` |
| Type | **Metaobject** → `CRO \| Review Spotlight`, **One entry** |

"Mixed reference" limited to `CRO | Review Spotlight` also works.

The block also accepts `standard.cro_review_spotlight` as a fallback key. If a store already has either definition, reuse it; do not create a second one.

Save.

---

## 3. Create a review entry

Shopify admin → **Content → Metaobjects → CRO | Review Spotlight → Add entry**

1. **Name** – internal label, e.g. `The Complete Snowboard – reviews`.
2. Fill **Rating / Title / Content** for as many reviews as you want (1–10).
   - A review is only shown if its **Title** is filled. Empty review slots are skipped automatically.
   - Rating 1–5 → filled stars; the rest of the 5 stars are grey.
   - Keep titles to one line and content to 2–3 lines so the box stays compact.
3. Status **Active** (if shown) → **Save**.

One entry can be reused on several products.

### Demo content (The Complete Snowboard)

| # | Rating | Title | Content |
|---|---|---|---|
| 1 | 5 | Best board I've ever owned! | Stable at high speed and super easy to turn. I rode it all week in the Alps and it handled groomers, powder and icy patches without any problem. Worth every cent. |
| 2 | 5 | Perfect all-mountain board | I wanted one board that does everything, and this is it. Carves beautifully on piste and floats nicely in fresh snow. The edges grip really well on hard pack. |
| 3 | 4 | Great for progressing riders | I'm an intermediate rider and this board helped me build confidence fast. Forgiving on landings but still responsive. Only wish it came in a few more colors. |
| 4 | 5 | Amazing quality and finish | You can feel the quality the moment you unbox it. The base is fast, the graphics look stunning and after a full season there are barely any scratches. |
| 5 | 5 | Fast delivery, great board | Arrived in two days, well packed and ready to ride. The size guide was spot on. Already recommended it to two friends from my ski club. |
| 6 | 4 | Fun in the park too | Mostly bought it for the mountain, but it's surprisingly playful on jumps and small rails. Pops well and lands soft. A true do-it-all snowboard. |

---

## 4. Link the entry to the product

Shopify admin → **Products → open the product** → scroll to **Metafields** → **CRO | PDP | Review Spotlight** → select the entry from step 3 → **Save**.

Products without a linked entry (or with no titled reviews) show nothing – no empty box.

---

## 5. Theme Editor

Online Store → Themes → **Customize** → switch to a product template → preview the product from step 4.

The block **SC – Review Spotlight** sits under the price by default. Drag it to move it, or add it via **Add block** if it's missing (max. 1 per product page).

| Group | Settings | Default |
|---|---|---|
| Carousel | Autoplay | Off |
| | Autoplay speed (2–10 s) | 5 s |
| | Fade transition | Off (slide) |
| | Show pagination dots | On |
| | Draggable / swipe | On |
| | Infinite loop | On |
| Spacing & appearance | Top spacing (0–60 px) | 16 px |
| | Bottom spacing (0–60 px) | 0 px |
| | Text color | `#000000` |
| | Background color | `#F8F8F8` |
| | Corner radius (0–32 px) | 0 px |
| Star & pagination colors | Filled rating color | `#E07988` |
| | Empty rating color | `#D9D9D9` |
| | Pagination dot color | `#D9D9D9` |
| | Active pagination dot color | `#E07988` |
| Review heading | Font size desktop / mobile (8–36 px) | 16 / 16 px |
| | Font weight (100–900) | 600 |
| | Font style | Normal |
| Review content | Font size desktop / mobile (8–36 px) | 16 / 16 px |
| | Font weight (100–900) | 400 |
| | Font style | Normal |

Mobile font sizes apply below 750 px screen width.

Carousel behaviour:
- Autoplay pauses while the mouse is over the block and resumes when it leaves. Dragging or clicking a dot restarts the timer.
- Swipe on touch, drag with the mouse, or use the left/right arrow keys when the carousel is focused.
- The box height adapts to the active review.
- With only one review, no dots and no carousel – just the single review.

---

## Troubleshooting

In the Theme Editor, a dashed note "SC – Review Spotlight: no reviews found" appears when no data is found (customers never see it). Check:

1. **Storefronts access** on the metaobject definition is on (step 1).
2. Metaobject **type** is `cro_review_spotlight` and field keys are `rating_N`, `title_N`, `content_N` (no typos, no `custom.` prefix in the field key).
3. The product metafield key is `standard.cro_pdp_review_spotlight` (or `standard.cro_review_spotlight`).
4. The entry is actually selected on **this** product and saved.
5. At least one review has a **Title**.
6. Autoplay not moving? Turn on **Autoplay** in the block and move the mouse off the block.
