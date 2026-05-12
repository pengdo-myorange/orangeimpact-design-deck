# 본문 개념 이미지 프롬프트 빌더

**적용 대상**: 본문 슬라이드에서 추상 개념·은유·시나리오를 시각화해야 할 때 (`layout: concept-image`).
**모델**: OpenAI `gpt-image-2`.
**라우팅**: `lib/visual-router.js` 가 슬라이드를 자동 분류해 이 레이아웃으로 보낼지 결정.

---

## 라우팅 규칙 (visual-router 가 자동 판정)

| 슬라이드 특성 | 추천 레이아웃 |
|---|---|
| ≥4 데이터 포인트 + 수치 | `chart` (Tufte 차트) |
| ≥3 단계 프로세스 | `process` 또는 `timeline` |
| 비교 가능한 데이터 다발 | `bento` |
| 추상 개념·은유·감성 본문 | **`concept-image`** ← 이 문서 |
| 단순 텍스트만 충분 | `content` |

`concept-image` 트리거:
- 본문에 비유 표현 (`~처럼`, `마치`, `비유하자면`, `~같은`)
- 추상 키워드 비중 ≥30% (윤리/책임/신뢰/변화/미래/공감/의미/존재/관계/가치)
- 수치·프로세스·데이터 없음

---

## 프롬프트 합성

```
<CONCEPT from slide title + body> | <STYLE_RULES> | <NEGATIVE>
```

### CONCEPT 자동 추출
1. 슬라이드 헤드라인 (h1) 의 핵심 명사구
2. 본문 첫 문단의 비유 표현
3. 위 둘을 합쳐 60–100자 한국어 묘사

예시:
- 헤드라인 "기억은 흐른다"
- 본문 "기억은 강물처럼 흐른다. 잡으려 하면 손가락 사이로 새어 나간다."
- CONCEPT → "흐르는 물줄기를 손으로 잡으려는 모습, 손가락 사이로 빠져나가는 작은 물방울. closeup composition."

### STYLE_RULES (커버와 동일 베이스, 본문용 변형)
```
pure black background (#000000),
main concept rendered as flat 2D vector illustration in focal color (#FF6F1F),
supporting elements: simple geometric shapes (circles, lines, dots) in white,
generous negative space (60%+ of canvas empty),
centered or rule-of-thirds composition,
sized for half-slide placement (1024x1024 default)
```

### NEGATIVE (커버와 동일)
```
no text, no letters, no numbers, no labels,
no gradients, no 3D rendering, no realistic photography,
no glow, no neon, no cyberpunk aesthetic,
no human faces, no AI-illustration tropes
```

---

## 마크다운 사용법

자동 (visual-router 가 결정):
```markdown
---
# 기억은 흐른다
기억은 강물처럼 흐른다. 잡으려 하면 손가락 사이로 새어 나간다.
```
→ visual-router 가 비유 표현 감지 → `concept-image` 레이아웃으로 자동 라우팅 → gpt-image-2 호출 → 좌측 텍스트 / 우측 이미지.

명시:
```markdown
<!-- layout: concept-image -->
<!-- concept-prompt: "흐르는 물줄기를 손으로 잡으려는 모습." -->
# 기억은 흐른다
기억은 강물처럼 흐른다.
```

풀블리드 모드 (이미지가 슬라이드 전체):
```markdown
<!-- layout: concept-image -->
---
title: ...
image_full: true   # frontmatter
---
```

---

## 비용 안내

`--mode draft` 일 때는 placeholder. `--mode final` 일 때 실제 생성.
gpt-image-2 1024×1024 ≈ $0.02 / 1536×1024 ≈ $0.03.
SHA-256 캐시 적용 (동일 프롬프트는 1회만 과금).

자동 라우팅이 끄고 싶을 때 `build.js --no-concept-image-auto`.
