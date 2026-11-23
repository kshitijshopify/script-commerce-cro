# SC | PDP Size Slider (Fit Scale)

## Files
- `snippets/sc-size-slider.liquid` – markup + block-scoped CSS (`#sc_ss-{{ block.id }}`, classes `sc_ss__*`)
- `sections/main-product.liquid` – schema block `sc_pdp_size_slider` ("SC | Size Slider") + `when` case in the block loop (Dawn has no `product-form.liquid` block loop). Setting IDs are `sc_ss_*`.

## Store setup (Settings > Custom data)

### Metaobject definition
Name: `SC | PDP | Size Slider` — Type: `sc_pdp_size_slider`

| Field name | Key | Type | Notes |
|---|---|---|---|
| Name | `name` | Single line text | Display name, required. Helps identify the entry (e.g. product name). |
| Heading | `heading` | Single line text | |
| Labels | `labels` | Single line text, **list of values** | Required. e.g. Tight / True to size / Loose |
| Scale position | `scale_position` | Integer | Required, min 0, max 100 (percentage) |

(Metaobject field keys are plain keys; the `sc_pdp_size_slider.` prefix in the competitor doc is the type, not part of the key.)

### Product metafield definition
Name: `SC | Size Slider` — Namespace and key: `custom.sc_size_slider`
Type: Metaobject reference (`SC | PDP | Size Slider`), single value.
(The competitor used "Mixed reference" under the reserved `standard` namespace. A plain metaobject reference is enough since there is only one definition; if you pick Mixed reference, the code still works.)

## Differences from the competitor version
- Dot position is clamped (`calc(pos% - pos*0.16px)`), so at 100% it no longer overflows the bar.
- Position is forced to a number between 0 and 100.
- Removed duplicated `visually-hidden` text and the `h5` (heading is a `<p>`, so no broken heading hierarchy).
- Heading and labels are escaped.
- CSS scoped per block; no global `span.` selectors.
- Removed unused conditional checks for transparent colors; colors are always applied.

## QA
- [ ] Product without metafield -> nothing renders
- [ ] Position 0 / 50 / 100
- [ ] 2, 3 and 5 labels
- [ ] Border on/off, negative space values, mobile width
