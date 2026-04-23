---
title: All Layouts Showcase
author: pengdo@myorange.io
date: 2026-04-23
theme: light
---

<!-- layout: title -->
<!-- mark: AI -->
# Design Deck
# 17 Layouts
## Orangeimpact Design System · 2026
pengdo@myorange.io · 2026.04.23

---
<!-- layout: section-divider -->
# Structure
## 01 / 06

---
<!-- layout: part-cover -->
# Part 1
# 구조의 기본기
프레젠테이션을 구성하는 6가지 구조 레이아웃 — 표지, 섹션 구분, 부 표지, 선언, 목차, 마무리.

데크의 뼈대를 결정합니다.

---
<!-- layout: statement -->
# 절제는 **선택**입니다.
디자인의 모든 결정은 무엇을 빼느냐로 시작합니다.

---
<!-- layout: toc -->
<!-- chapter: "00 · 시작" -->
<!-- meta: "Contents" -->
# Contents
1. 구조의 기본기 · p.02
2. 콘텐츠와 본문 · p.05
3. 숫자와 데이터 · p.10
4. 비교와 그리드 · p.13
5. 흐름과 시간 · p.16
6. 특수 레이아웃 · p.18

---
<!-- layout: section-divider -->
# Content
## 02 / 06

---
<!-- layout: content -->
<!-- chapter: "02 · Content" -->
<!-- meta: "기본 레이아웃" -->
<!-- source: "출처 · 내부 자료" -->
# 콘텐츠 레이아웃의 기본 구조

본문은 좌측 정렬, 최대 폭 1440px, 18px 본문에 28px 줄간격이 기본입니다. 오렌지 사각 마커는 시각적 리듬을 만듭니다.

- 한 슬라이드당 하나의 핵심 메시지를 유지
- 본문은 6줄 이내로 압축, 더 길면 다음 슬라이드로 분리
- 키워드는 **굵게** 처리하되 슬라이드당 3개 이내
- 출처는 하단 좌측 크롬에 자동 배치

---
<!-- layout: two-column -->
<!-- chapter: "02 · Content" -->
<!-- meta: "두 단 비교" -->
# 두 가지 관점을 나란히

:::col
### 사용자 입장
사용자는 한 화면에서 핵심을 빠르게 흡수하길 원합니다. 두 단 구조는 정보를 비교할 때 가장 효과적입니다.

- 좌·우 비교가 직관적
- 시선의 자연스러운 흐름
:::

:::col
### 발표자 입장
발표자는 양쪽 관점을 동시에 다루며 청중의 사고를 확장합니다. 가운데 구분선이 두 영역을 명확히 분리합니다.

- 균형 잡힌 구도
- 한 슬라이드 — 한 비교
:::

---
<!-- layout: quote -->
<!-- chapter: "02 · Content" -->
<!-- meta: "Quote" -->
> 디자인은 단순한 것을 다르게 보이도록 만드는 게 아니라, 복잡한 것을 단순하게 보이도록 만드는 것입니다.
— John Maeda · Laws of Simplicity

---
<!-- layout: section-divider -->
# Numbers
## 03 / 06

---
<!-- layout: big-number -->
<!-- chapter: "03 · Numbers" -->
<!-- meta: "Big Number" -->
<!-- source: "출처 · 내부 분석" -->
# 0.3%
지구 인구 81억 명 중 AI 도구를 유료로 사용하는 사람의 비율입니다. 시장은 이제 막 1%를 넘어서고 있습니다.

> 8.1 billion people on earth. 0.3% pay for AI.
— Industry Analyst, 2026

---
<!-- layout: stats -->
<!-- stats: 3 -->
<!-- chapter: "03 · Numbers" -->
<!-- meta: "Stats Grid" -->
# 시장의 세 가지 신호

## 45%
비영리 단체의 45%가 기술 투자에 충분한 자원을 확보하지 못한다고 응답했습니다.

## 절반
AI 도구를 정식으로 훈련받은 직원이 한 명도 없는 비영리의 비율입니다.

## 84%
AI를 사용 중인 비영리 84%가 추가 재원을 가장 큰 확장 장벽으로 꼽았습니다.

---
<!-- layout: chart -->
<!-- chart: donut -->
<!-- chapter: "03 · Numbers" -->
<!-- meta: "Chart" -->
# 사용자 시간 분포

:::data
탐색 | 38
실행 | 27
검토 | 20
대기 | 15
:::

---
<!-- layout: section-divider -->
# Compare & Grid
## 04 / 06

---
<!-- layout: compare -->
<!-- chapter: "04 · Compare" -->
<!-- meta: "Before / After" -->
# 명확한 경계가 정확도를 만듭니다

:::compare-before BEFORE · 구분자 없음
### 혼재된 입력
- 명령과 데이터가 섞여 경계가 글자에 묻힙니다
- 모호한 범위 — 요약 대상 판단이 사람마다 다릅니다
- 잘못된 추론이 자주 발생합니다
:::

:::compare-after AFTER · 구분자 적용
### 경계가 있는 입력
- `###` 안은 데이터, 밖은 명령으로 명확히 구분
- 좁아진 범위 — 잡음 제거가 가능합니다
- 일관된 응답이 가능해집니다
:::

---
<!-- layout: bento -->
<!-- chapter: "04 · Bento" -->
<!-- meta: "3-cell Grid" -->
# 좋은 프롬프트의 3가지 원칙

:::card target
### RULE 01
#### 구체적인 맥락
배경, 목적, 청중을 명시해 모델의 추측 범위를 좁힙니다. 추상적인 요청은 추상적인 답을 부릅니다.
:::

:::card layers
### RULE 02
#### 단계적 분해
복잡한 작업은 작은 단계로 나누어 요청합니다. CoT 패턴이 정확도를 크게 끌어올립니다.
:::

:::card check
### RULE 03
#### 검증 가능한 결과
출력 형식과 길이를 명시합니다. 검증 가능한 출력은 자동화로 이어집니다.
:::

---
<!-- layout: chain -->
<!-- chapter: "04 · Chain" -->
<!-- meta: "3-step Chain" -->
# 의도에서 결과로

:::card
### 의도 정의
무엇을 원하는지 한 문장으로 적습니다.
:::

:::card highlight
### 프롬프트 설계
맥락 · 작업 · 형식 세 단으로 구조화합니다.
:::

:::card
### 결과 검증
출력을 검토하고 다음 반복을 준비합니다.
:::

---
<!-- layout: section-divider -->
# Flow
## 05 / 06

---
<!-- layout: timeline -->
<!-- chapter: "05 · Flow" -->
<!-- meta: "Timeline" -->
<!-- highlight: 3 -->
# 도구의 진화 — 5년의 변천

1. **2022** — ChatGPT 공개, 대중적 인식 시작
2. **2023** — 기업 도입, 첫 도구화 실험
3. **2024** — 멀티모달 통합, 기업 워크플로 진입
4. **2025** — 에이전트 패러다임, 자동화 본격화
5. **2026** — 생산성 인프라로 정착

---
<!-- layout: process -->
<!-- chapter: "05 · Flow" -->
<!-- meta: "Process · 5-step" -->
<!-- highlight: 3 -->
# 한 번의 빌드 사이클

1. **이해** — 요구사항을 한 문장으로 압축
2. **탐색** — 기존 자산과 패턴을 먼저 살핍니다
3. **설계** — 구조를 먼저 그리고 컬러는 나중에
4. **구현** — 작은 단위로 점진 적용
5. **검증** — 사용자 시나리오를 직접 따라가기

---
<!-- layout: section-divider -->
# Specialized
## 06 / 06

---
<!-- layout: prompt-demo -->
<!-- chapter: "06 · Specialized" -->
<!-- meta: "Prompt Demo" -->
:::domain-chip
프롬프팅 · 기본기
:::

```prompt zero-shot
다음 문서를 3문장으로 요약하세요. 핵심 개념과 결론을 포함해 주세요.

###
{{문서 내용}}
###
```

:::response
요약: 본 문서는 디자인 시스템의 17개 레이아웃을 다룹니다. 각 레이아웃은 1920×1080 슬라이드 한 장에 최적화된 정보 밀도와 시각적 리듬을 갖습니다. ODS 토큰을 통해 색·간격·타이포가 일관됩니다.
:::

### 무엇이 좋은가
명확한 경계 — `###` 으로 데이터와 명령을 분리. 출력 형식 — 3문장 제약. 포함 항목 — 핵심 개념과 결론을 명시.

---
<!-- layout: checkpoint-rows -->
<!-- chapter: "06 · Specialized" -->
<!-- meta: "Checkpoint" -->
# 이론 ↔ 기법 매칭

**관찰 학습** | 예시를 통한 학습 ↔ **퓨샷 프롬프팅** | 입력에 예시 2-3개 포함

**연쇄 추론** | 단계적 사고 과정 ↔ **Chain of Thought** | "단계별로 생각해 봅시다" 추가

**자기 검증** | 자신의 출력을 검토 ↔ **Self-Consistency** | 여러 번 생성 후 다수결

---
<!-- layout: closing -->
# Thank you
pengdo@myorange.io
github.com/pengdo-myorange
