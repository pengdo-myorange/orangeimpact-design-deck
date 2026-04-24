---
title: Donut with center label — Claude Design-style chart
chapter: Chart Recipe · donut
source: design-deck / inspired by sample.pptx
---

<!-- layout: title -->
# Donut · 중앙 라벨
## `layout: chart` + `chart: donut` + H2/paragraph = OpenAI pptx 톤

---

<!-- layout: chart -->
<!-- chart: donut -->
# 일의 재구성, 네 가지 방향

## OpenAI
4 categories

:::data
자동화 위험 / Automation-exposed      | 18 | orange-dark
재구성 / Reshaped                     | 24 | orange
성장 / Growth                         | 12 | blue
단기 영향 적음 / Minimally-affected near term | 46 | gray
:::

---

<!-- layout: chart -->
<!-- chart: donut -->
# 팔레트 alias 테스트

## 2026 Q2
spend share

:::data
Compute     | 52 | orange
Storage     | 18 | orange-light
Transfer    | 12 | blue
Observability | 10 | gray
Misc        |  8 | gray-light
:::

---

# Thank you

ODS 팔레트 alias (`orange`, `orange-dark`, `blue`, `gray` …) 는 모든 차트 타입에 적용됩니다.

---

<!-- layout: statement -->
# 이미 벌어지는 변화에, 우리는 ==관찰자==인가 ==참여자==인가?

오늘 이 자리는, 여러분이 '==참여자=='가 되는 첫 시간입니다.

---

# Inline highlight syntax

Statement / big-number / stats / bento — 모든 레이아웃에서 동일하게 동작:

- `==text==` → 오렌지 bold 강조 (sample pdf p8/p10/p13/p14 톤)
- 기존 `**bold**` 는 검정 bold 그대로 (영향 없음)
- 강조 단어는 슬라이드당 ==1–2개== 권장 — 남발하면 앵커 효과 사라짐
