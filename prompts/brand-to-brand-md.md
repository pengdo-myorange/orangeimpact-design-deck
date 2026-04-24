# brand-to-brand.md — URL → design-deck `brand.md` sidecar

Ported from [awesome-claude-design/prompts/brand-to-design-md.md](https://github.com/rohitg00/awesome-claude-design/tree/main/prompts). Original produces a full DESIGN.md v2; this adapter produces the **subset** that design-deck's [`lib/assets.js` parser](../lib/assets.js) actually reads.

## When to use

- User has a brand/product URL (e.g. `https://stripe.com`, `https://granola.ai`) and wants their deck to match that brand's visual tone
- User is building a partner-pitch or design-review deck for a specific company

## Schema drift guard — ONLY these keys are parsed

Do **not** invent keys outside this set. `lib/assets.js` silently drops unknown fields.

```yaml
# Flat (root level)
accent: "#HEXHEX"              # overrides --brand
theme: light | dark
family: warm-editorial | editorial-minimalism | data-dense-pro | terminal-core
      | cinematic-dark | playful-color | glass-futurism | neon-brutalist | indie-cult
chapter: "<eyebrow text>"      # default chrome chapter label
logo: "<path or inline svg>"   # optional

# Nested
typography:
  headline: "Font Family Name"
  body: "Font Family Name"
  mono: "Font Family Name"

component_overrides:
  card_radius: "12px"
  card_shadow: "0 2px 4px rgba(0,0,0,0.06)"
  bullet_shape: dash | disc | square
```

## Instructions for Claude

1. **Fetch the URL** (WebFetch) and pull: hero headline, primary CTA color, body/heading font families from CSS or OpenGraph, footer copyright tone, overall "feel" (photography-heavy / text-heavy / data-heavy).

2. **Pick the family** using heuristics:
   - Terminal·CLI·developer product → `terminal-core`
   - Design tool / playful consumer → `playful-color`
   - Hardware keynote / ML infra → `cinematic-dark`
   - Editorial magazine / bold publisher → `neon-brutalist`
   - Apple-adjacent / spatial / audio → `glass-futurism`
   - Small-batch software / media / journalism → `indie-cult`
   - Data tool (Grafana/PostHog/ClickHouse lineage) → `data-dense-pro`
   - SaaS utility (Linear/Stripe/Vercel lineage) → `editorial-minimalism`
   - Text-first / warm narrative / Notion-adjacent → `warm-editorial`

3. **Extract accent color** — the hero CTA background color, or the logo's primary fill. Return as a single `#HEXHEX`. Never return a gradient.

4. **Extract typography** — from CSS `font-family` on `<h1>` and `<body>`. If blocked/unreadable, infer from visual: serif display → `"Georgia"` fallback, grotesque → `"Inter"`, rounded → `"Nunito"`. Mono only if the site uses it in UI chrome, not just code blocks.

5. **Validate accent vs. family:**
   - If accent hue is ≈ `#16d5e6` ±20° (Claude Design default teal), refuse — tell the user "accent teal is the Claude Design fingerprint; pick a different hex or let the family's default apply."
   - If `family: neon-brutalist` but accent is pastel or neutral, warn — brutalist needs saturated, hard hues.
   - If `family: cinematic-dark` and accent is white/gray, warn — pick a saturated green/cyan/red.

6. **Output the sidecar** — only the allowed keys above. Wrap in a fenced markdown block so the user can save it directly as `brand.md` next to their deck source.

## Output format

```
🎯 Brand extract: <company name>

Family: <picked family> — <one-line why>
Accent: <#HEXHEX> — <source: CTA, logo, etc.>
Typography: headline <font>, body <font>
Notes: <any warnings from step 5, or "clean">

---
# Save as brand.md next to your deck .md:

---
family: <family>
accent: "<hex>"
theme: light
chapter: "<company> · Partner Brief"
typography:
  headline: "<font>"
  body: "<font>"
---
```

## Non-goals

- Full DESIGN.md v2 — use the original awesome-claude-design prompt if you want the 20-field pitch deck schema
- Image/logo extraction — user should handle `logo:` path separately
- Competitive analysis — this is a pure extractor, not a strategy tool
