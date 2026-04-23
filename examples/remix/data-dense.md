---
title: Data-Dense Pro — analyst-grade quarterly review
chapter: Remix Recipe · data-dense-pro
family: data-dense-pro
source: design-deck remix gallery
---

# Q1 2026 retention readout

## What moved, what didn't, what's next

A working document for the growth review, not a polished narrative.

---

<!-- stats: 4 -->

# Headline metrics

## 71.4%
W4 retention, +3.2pp vs Q4

## 2.18
Avg sessions / user / week, flat

## 0.144
Churn rate of paid cohort

## 18.7%
Activation→paid conversion, +1.6pp

---

<!-- chart: bar -->

# Cohort breakdown

```data
Free trial · 71.4
Self-serve paid · 84.1
Sales-led · 92.3
Enterprise · 96.0
```

Verticals where Sales is involved retain ~25pp better than self-serve. Investment thesis intact.

---

# What broke

- Mobile push delivery dropped from 94% to 81% on Apr 9 — APNs cert rollover landed without staging
- Webhook signature mismatch on the auth service caused 3.2% of paid signups to silently lose entitlements for 19 minutes
- Two segments (`ko-KR`, `ja-JP`) have onboarding-step-3 drop-off >40% — likely a typography fallback issue

---

# Next two weeks

- Re-baseline notification ops with a quarterly cert-rotation runbook
- Add entitlement-loss tripwire alert to PagerDuty (5xx + missing-grant correlation)
- Pull `ko-KR` onboarding screenshots and walk a designer through frame-by-frame
