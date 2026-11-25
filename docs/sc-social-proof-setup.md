# SC – Social Proof: setup guide

This block shows a small social-proof line on the product page: a stack of customer/influencer avatars, a bold name with an optional verified checkmark, and a short message. Example:

> (avatars) **emma.style** ✓ and 63,000 others are thrilled with us

It is the avatar-only version of the older **SC – Social proof banner**. It looks the same as that block's "Social banner" type, but it has **no rating banner** (no stars, no `(rating)` text).

No metafields are needed. Everything is set in the theme editor, and the same content shows on every product that uses the template.

It takes about 3 minutes.

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

1. **Create the snippet.** In the **snippets** folder, click **Add a new snippet** and name it `sc-social-proof`. Paste in the full contents of `snippets/sc-social-proof.liquid`, then click **Save**.
2. **Open the product section.** It's usually `sections/main-product.liquid`.
3. **Show the block on the page.** Inside the `{%- case block.type -%}` loop, paste these two lines just above `{%- when 'title' -%}`:

   ```liquid
   {%- when 'sc_social_proof' -%}
     {%- render 'sc-social-proof', block: block -%}
   ```

4. **Add the block settings.** Scroll to `{% schema %}` and find `"blocks": [`. Copy the whole `"type": "sc_social_proof"` block from `sections/main-product.liquid` in the ScriptCommerce theme and paste it inside that list (add a comma between blocks). Click **Save**.

---

## Step 2 – Add the block to the product page

1. Go to **Online Store → Themes → Customize**.
2. Open the **Product** template and click the main product section.
3. Click **Add block → SC | Social Proof**. You can add it once per product section.
4. Drag it to where you want it. A common place is just under the price or just above **Add to cart**.
5. Click **Save**.

---

## Step 3 – Fill in the content

| Setting | What it does |
|---|---|
| Avatar 1–5 | Customer or influencer photos. Empty slots are hidden. Square images work best. |
| Customer / influencer name | Shown in bold. Leave empty to hide it. |
| Show verified checkmark | Adds the blue tick after the name. |
| Social message | The text after the name, for example "and 63,000 others are thrilled with us". |
| Bold message text | Makes the message semi-bold. |

In the theme editor, if nothing is filled in, you'll see placeholder avatars and a hint so the block is still easy to find. On the live store it stays hidden until at least one avatar, a name or a message is set.

---

## Step 4 – Style it (optional)

| Group | Settings |
|---|---|
| Avatars | Shape (round/square), size on desktop and mobile, overlap, ring color |
| Text | Alignment (left/centre), font size on desktop and mobile |
| Corners | Corner style (rounded/square) and corner radius |
| Colors | Background, text, name, verified checkmark, border |
| Border | Show border on/off |
| Spacing | Top margin, bottom margin, vertical and horizontal padding |

Tips:
- For a plain line like the example, set **Background** to a transparent color, padding to `0`, and keep the border off.
- For a card look, keep the default background (`#F8F6F3`) and a corner radius of 14px.
- If the name is long, it wraps onto the next line instead of overflowing.

---

## Good to know

- **No JavaScript.** The block is plain HTML and CSS, so it loads instantly and survives theme editor reloads.
- **Safe styling.** All CSS is scoped to this block (`#sc-sp-<block id>`), so it won't affect other blocks.
- **Name is escaped.** The message is a rich text field, so basic formatting such as bold and links works.
- **Verified label.** The checkmark's screen-reader label is "Verified" (English).
- **Placeholder content.** The defaults (`emma.style`, "63,000 others") are examples. Replace them with real data before going live.
- **Together with the banner block.** You can use both **SC – Social proof banner** and **SC | Social Proof** on one product page. Their styles don't clash.

---

## Files

| File | Purpose |
|---|---|
| `snippets/sc-social-proof.liquid` | Markup and scoped CSS (classes `sc-sp__*`) |
| `sections/main-product.liquid` | `sc_social_proof` schema block and the `when` case that renders it |

---

## Quick test checklist

- [ ] Block appears in **Add block** as "SC | Social Proof".
- [ ] 1, 3 and 5 avatars all look right (overlap, ring, no clipping).
- [ ] Name with and without the verified checkmark.
- [ ] Long name and long message wrap cleanly on mobile.
- [ ] Round vs square avatars, left vs centre alignment.
- [ ] All fields empty: hidden on the live store, placeholder only in the editor.

---

## Troubleshooting

- **Block doesn't appear in Add block.** The `sc_social_proof` schema block is missing from `main-product.liquid`. Redo Step 1.4.
- **Block is added but nothing shows.** On the live store, the block is hidden when no avatar, name or message is set. Fill at least one.
- **Avatars look stretched or cropped.** Use square images; the block crops them to a square.
- **Message text looks too bold.** Turn off **Bold message text**, and check the rich text doesn't contain bold tags.
