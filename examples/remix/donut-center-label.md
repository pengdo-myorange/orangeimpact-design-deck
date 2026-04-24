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

---

<!-- layout: bento -->
# 여섯 개의 분야, 여섯 개의 출발선

:::card heart
### 01
#### 사회복지·돌봄
사례관리 보고서, 가족 소식지, 상담 요약
:::

:::card users
### 02
#### 사회적협동조합·마을공동체
조합원 공지, 마을 캠페인 안내, 뉴스레터
:::

:::card leaf
### 03
#### 지속가능발전·환경
정책 브리프, 기후 캠페인, 시민 교육 콘텐츠
:::

:::card newspaper
### 04
#### 언론·미디어
기획기사, 인터뷰 설계, 시민언론 교육
:::

:::card building
### 05
#### 지방분권·지역서비스
정책 요약, 시민 브리프, 지역 서비스 안내
:::

:::card palette
### 06
#### 예술·향토·안전교육
향토 자료 정리, 주민 교육 프로그램 설계
:::

---

<!-- layout: chip-table -->
# 6 업무군과 변화의 지도

| 업무군 | 매핑되는 카테고리 |
|---|---|
| **사회복지·돌봄** | [재구성]{.chip-orange} [성장]{.chip-blue} |
| **사회적협동조합·마을공동체** | [성장]{.chip-blue} |
| **지속가능발전·환경** | [성장]{.chip-blue} |
| **언론·미디어** | [재구성]{.chip-orange} |
| **지방분권·지역서비스** | [성장]{.chip-blue} [단기 영향 적음]{.chip-gray} |
| **예술·향토·안전교육** | [단기 영향 적음]{.chip-gray} |

:::note
여러분은 ==18%==에 속하지 않습니다. ==12%·24%==에서 AI를 도구로 쓰는 사람이 그 포지션을 차지합니다.
:::

---

<!-- layout: chart -->
<!-- chart: sparkline -->
# 최근 30일 DAU 트렌드

## 30일 간
사용자 수

:::data
DAU | 120 132 128 140 148 155 150 162 178 170 185 192 200 208 215 | orange
:::

---

<!-- layout: chart -->
<!-- chart: bar -->
<!-- highlight: 2 -->
# 기본 = 회색, 강조만 오렌지

기본적으로는 전부 회색. `<!-- highlight: N -->` 으로 N번째만 brand 로 승격.

:::data
QoQ 성장률   | 42
자동화 커버  | 78
실제 배포    | 55
NPS          | 31
:::

---

<!-- layout: chart -->
<!-- chart: donut -->
<!-- order: magnitude -->
# Magnitude 정렬 예시 — "기타" 는 항상 마지막

## 비중순
sorted by size

:::data
Compute     | 52 | orange
Storage     | 18 | orange-light
Transfer    | 12 | blue
Misc (기타) |  8 | gray-light
Observability | 10 | gray
:::
