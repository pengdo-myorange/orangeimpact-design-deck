---
title: Brand Sidecar v2 — smoke test
---

# Brand sidecar v2

## DESIGN.md compatible smoke test

Drop a `brand.md` next to this file to override accent, typography, and component styles without editing the markdown.

---

# What changed

- accent → blue (`#2563EB`)
- mono font → `JetBrains Mono` (visible in code block below)
- card radius → 24px
- card shadow → softer
- bullet shape → dash

---

<!-- layout: bento -->

# Bento — radius + shadow override

:::card
### Card 1
#### Bigger radius
24px corners + softer shadow.
:::

:::card
### Card 2
#### Brand variable
Inherits the new accent color.
:::

:::card
### Card 3
#### Inline mono
Code uses `JetBrains Mono` if installed.
:::

---

# Code block — mono font swap

```js prompt
// build.js — DESIGN.md sidecar v2
const { brandToCss } = await import('./lib/assets.js');
const css = brandToCss(fm);
```

---

# Thank you

brand.md is the bridge between Orangeimpact ODS and any DESIGN.md spec from awesome-claude-design.
