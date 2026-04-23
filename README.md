# design-deck

Markdown → 1920×1080 HTML 슬라이드 덱 (Orangeimpact Design System). Chrome 인쇄 → 슬라이드당 PDF 1페이지.

## Quick start

```bash
node ~/.claude/skills/design-deck/build.js my-deck.md
open my-deck.html    # Chrome에서 열기 → Cmd+P → Save as PDF
# 또는:
node ~/.claude/skills/design-deck/build.js my-deck.md --pdf
# → my-deck.pdf 자동 생성 (헤드리스 Chrome)
```

## 주요 기능

- 17개 레이아웃 (title/section-divider/content/two-column/quote/closing/image/stats/timeline/toc/part-cover/statement/compare/bento/chain/process/profile/prompt-demo/checkpoint-rows/big-number/chart)
- 공통 크롬 (브레드크럼/메타/출처/페이지)
- Pretendard + ODS 컬러 토큰, 4px 그리드
- AI 이미지 (OpenAI `gpt-image-2`), SHA-256 캐싱
- 헤드리스 Chrome 자동 PDF
- 리뷰 오버레이 (승인/수정요청/재생성 → `revisions.yaml`)
- 단일 자립형 HTML, 오프라인 동작, 폰트·이미지 모두 base64 임베드

## 마크다운 문법

슬라이드 구분자: 단독 `---` 한 줄.

**프론트매터 (선택)** — 파일 최상단 첫 `---…---` 쌍:
```yaml
---
title: 발표 제목
author: pengdo@myorange.io
date: 2026-04-23
theme: light
---
```

**슬라이드별 지시자** — HTML 주석:
- `<!-- layout: bento -->` — 레이아웃 (기본 `content`)
- `<!-- theme: dark -->` — 테마 오버라이드
- `<!-- chapter: "Ch 3 · 관찰 학습" -->` — 브레드크럼
- `<!-- meta: "이론 · 01/06" -->` — 상단 우측 메타
- `<!-- source: "출처 · OpenAI" -->` — 하단 좌측 출처
- `<!-- page: "04 / 14" -->` — 페이지 카운터 (미지정 시 auto)
- `<!-- accent: blue -->` — 강조 컬러 (기본 orange)
- `<!-- stats: 3 -->` — stats 레이아웃 셀 수
- `<!-- highlight -->` — 직전 카드/단계 하이라이트
- `<!-- icon: heart -->` — Lucide 아이콘

**블록 지시자** — fenced `:::` 블록:
- `:::col` / `:::` — two-column 열
- `:::compare-before 라벨` / `:::compare-after 라벨`
- `:::card` / `:::` — bento/chain 카드
- `:::response` / `:::` — prompt-demo 응답
- `:::thumbnails` / `:::` — profile 썸네일

**프롬프트 블록** — prompt-demo 전용:
````
```prompt zero-shot
당신의 프롬프트...
```
````
variants: `zero-shot`, `few-shot`, `cot`

**이미지** — 일반 + AI 생성:
```markdown
![캡션](./path.jpg)
![캡션](ai:"프롬프트 문장" size:1536x1024)
```

## CLI 옵션

```
build.js <input.md> [options]

--out <path>              출력 HTML 경로
--mode draft|final        draft: AI 이미지 placeholder / final: 실제 생성
--design-system <path>    ODS 경로 오버라이드
--theme light|dark        기본 테마
--assets-folder           sibling assets 폴더로 출력
--pdf                     PDF 생성 (Playwright 우선, 없으면 Chrome headless)
--slide <N[,N]>           지정 슬라이드만 단독 렌더
--merge <N>               preview/slide-N.html을 메인 덱에 머지
--no-image-gen            AI 이미지 placeholder 처리
--images-only             이미지 생성만 수행
--clear-cache             이미지 캐시 삭제
--interactive             1장씩 순차 모드
--yes                     비용 확인 자동 승인
--showcase                ≥5장 덱에서 grammar 정의용 2장만 빌드 → <out>.showcase.html
--verify                  빌드 후 자동 검증 (슬라이드 수, 폰트, @page 규칙)
--strict                  lint warning 1건이라도 있으면 빌드 실패
```

## Brand sidecar (DESIGN.md v2 호환)

md 파일과 같은 디렉토리에 `brand.md` 가 있으면 자동 로드. 프론트매터 필드를 오버라이드합니다. 형식은 [awesome-claude-design](https://github.com/rohitg00/awesome-claude-design) 의 DESIGN.md 사양과 호환되어, `brandmd` / `styleseed` 등 외부 추출 도구 출력을 거의 그대로 import 가능합니다.

```yaml
---
# v1 — flat overrides
accent: "#FF6F1F"          # 또는 named: blue
theme: dark
chapter: "Q2 2026"          # 모든 슬라이드 기본 브레드크럼
logo: ./my-logo.svg

# v2 — DESIGN.md 호환 nested
family: warm-editorial      # aesthetic family preset
typography:
  headline: "Pretendard Variable"
  body: "Pretendard Variable"
  mono: "JetBrains Mono"
component_overrides:
  card_radius: 24
  card_shadow: "0 6px 24px rgba(0,0,0,0.06)"
  bullet_shape: dash        # square|disc|dash
---
```

`examples/brand-test/` 가 v2 사이드카 동작 확인용 최소 예제입니다.

## Family presets

`brand.md` 의 `family:` 한 줄로 spacing / radius / shadow / bullet 만 변형 (ODS color/font 기본 보존). 4개 family 명시 구현, 나머지는 enum만 받고 `warm-editorial` 폴백.

| Family | 출처 | 변형 |
|---|---|---|
| `warm-editorial` | Notion / Resend / Claude | 기본 ODS — 변형 없음 |
| `editorial-minimalism` | Linear / Stripe / Vercel | 여백 +20%, shadow none, radius 6px, dash bullet |
| `data-dense-pro` | PostHog / ClickHouse / Grafana | 여백 -20%, radius 8px, tnum 강제 |
| `terminal-core` | Ollama / Warp / Raycast | mono 폰트 강제 |

[`examples/remix/`](examples/remix/) 에 4개 family 데모 (linear-claude · stripe-a24 · data-dense · terminal-core) 가 있습니다.

## Lint 규칙

빌드 시 자동 실행. 위반 시 콘솔 경고 + `output.build.json.warnings[]` 기록.

| 규칙 | 의미 | 출처 |
|---|---|---|
| `no-emoji` | 본문 emoji 금지 | huashu |
| `no-data-slop` | "10,000+ users" 같은 출처 없는 큰 숫자 패턴 금지 | huashu |
| `no-gradient` | linear/radial-gradient 금지 | huashu |
| `no-svg-imagery` | 인라인 SVG 곡선 path (사람·사물 그림 의심) 금지 | huashu |
| `ai-prompt-slop` | AI 프롬프트에 gradient/purple/neon/cyberpunk 금지 | huashu |
| `no-teal-default` | accent 가 Claude Design 기본 teal `#16d5e6` ±20° hue 면 경고 | awesome-claude-design |
| `no-blinking-dot` | `<!-- chip: live -->`, `🟢 LIVE`, `pulse-dot` 등 의미 없는 status indicator | awesome-claude-design |
| `no-icon-stack` | 같은 아이콘이 ≥3 슬라이드에서 반복 (Lucide 도배 방지) | awesome-claude-design |

`--strict` 로 빌드 실패 처리, 또는 슬라이드 시작에 `<!-- lint: off -->` 로 건너뛰기.

## Critique 모드

리뷰 오버레이 (`[리뷰 모드]` → `[★ 비평]`) 안에 5축 슬라이더 + 3-페르소나 노트. 자유 텍스트로 직접 메모하고 `revisions.yaml` 에 직렬화됩니다.

- 5축 점수: 철학 일관성 / 시각 계층 / 디테일 / 기능성 / 창의성 (0~10)
- 3-페르소나 노트: Editorial Minimalist · Data-Dense Pro · Warm Editorial 의 가상 의견 직접 입력
- 빌드 시 LLM 호출 없음 (스킬 철학 유지)

## Showcase

[`showcase/`](showcase/) 폴더는 사용자가 빌드한 실제 덱을 PR 로 받는 갤러리입니다. 양식은 [`showcase/CONTRIBUTING.md`](showcase/CONTRIBUTING.md) 참고.

## 폴더 구조

```
design-deck/
  SKILL.md / README.md / package.json / build.js
  lib/
    parse.js inline.js blocks.js
    chrome.js print-css.js stage.js icons.js
    assets.js image-gen.js review.js pdf.js
    lint.js verify.js family-presets.js
  design-system/
    colors_and_type.css deck.css
    fonts/PretendardVariable.woff2
    assets/logos/orangeimpact{,-all-white}.svg
  templates/shell.html
  examples/
    all-layouts.md          # 17 layout showcase (24 slides)
    brand-test/             # DESIGN.md v2 sidecar smoke test
    remix/                  # 4 aesthetic family demos
  showcase/                 # community PRs (CONTRIBUTING.md)
```

## 참고

- 톤·여백·오렌지 사용 비율은 참조 PDF `AI_2026-04-22.pdf` (139페이지) 를 기준점으로 삼아 설계.
- 영감과 anti-slop 룰의 출처:
  - [alchaincyf/huashu-design](https://github.com/alchaincyf/huashu-design) — showcase-first 워크플로, 5축 critique, 17-layout showcase 구조
  - [rohitg00/awesome-claude-design](https://github.com/rohitg00/awesome-claude-design) — DESIGN.md 사양, 9 aesthetic families, 8 anti-slop fingerprints, remix recipes, 3-designer-debate
  - [Anthropic frontend aesthetics cookbook](https://github.com/anthropics/claude-cookbooks/blob/main/coding/prompting_for_frontend_aesthetics.ipynb) — "NEVER use generic AI-generated aesthetics" 베이스라인
- 완전한 다크 테마·진짜 WYSIWYG은 이번 범위 밖 (`SKILL.md` 참고).
