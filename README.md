# design-deck

> 마크다운 한 파일 → 1920×1080 슬라이드 덱 + 인쇄용 PDF.
> Pretendard·Orangeimpact 톤·17 레이아웃·anti-slop 린터, 한 줄 명령으로.

```bash
node ~/.claude/skills/design-deck/build.js my-deck.md --pdf
```

PowerPoint 도, Keynote 도, Figma 도 열지 않습니다. 에디터에 머물러서 글을 쓰고, 나가면 발표 자료가 완성돼 있습니다.

---

## 왜 이게 필요한가

발표 자료를 만들 때 우리가 실제로 시간을 쓰는 곳:

- **글쓰기** — 무슨 말을 할지 생각하고 다듬기
- **그래픽 잡기** — 색·여백·폰트가 일관된지 시각적으로 확인하기
- **번역** — 슬라이드 도구의 위치 조정·그룹화·정렬 메뉴를 통해 위 두 가지를 화면에 옮기기

design-deck 은 **세 번째를 0 으로 만듭니다.** 마크다운 의도만 쓰면 ODS (Orangeimpact Design System) 가 자동으로 톤·여백·오렌지 비율을 맞춥니다. 50장짜리 덱이 한 줄 명령으로 떨어지고, Pretendard 가 PDF 안에 살아 있고, 다음 분기에 다시 빌드해도 결과가 똑같습니다.

## 시작하기 전에 (Prerequisites)

이 스킬을 처음 쓰는 분이라면 세 가지만 준비하면 됩니다.

- **Claude Code 데스크톱 앱** — [공식 설치 가이드](https://docs.claude.com/en/docs/claude-code/quickstart). 이 스킬은 Claude Code 안에서 자연어로 호출됩니다.
- **Node.js 18 이상** — 터미널에서 `node --version` 으로 확인. 없으면 [nodejs.org](https://nodejs.org) 에서 LTS 설치하거나 macOS 는 `brew install node`.
- **Pretendard 폰트 (권장, 선택)** — 최종 HTML/PDF 에는 woff2 가 자동 임베드되어 **뷰어 쪽은 설치 불필요** 합니다. 단, 작성 중인 `.md` 를 에디터나 웹에서 미리 볼 때 브랜드 톤과 같은 톤으로 보려면 시스템에 설치 권장.
  - macOS: `brew install --cask font-pretendard` 또는 [Pretendard 릴리스](https://github.com/orioncactus/pretendard/releases) 에서 `.otf` → Font Book 으로 설치
  - Windows/Linux: 같은 릴리스 페이지의 OS 별 패키지 사용

## 스킬 설치 (1분)

Claude Code 는 `~/.claude/skills/` 아래의 폴더를 자동으로 발견합니다. 터미널 세 줄:

```bash
mkdir -p ~/.claude/skills
cd ~/.claude/skills
git clone https://github.com/pengdo-myorange/orangeimpact-design-deck.git design-deck
```

설치 확인: Claude Code 를 열고 **"design-deck 스킬 있어?"** 라고 물어보면 이 README 를 읽고 "있습니다" 라고 답합니다.

## 처음 써보기 — Claude Code 에 대화만 하세요

Claude Code 데스크톱 앱을 쓰는 초보자를 위한 가장 자연스러운 경로입니다. 터미널에서 `node ...` 를 기억하지 않아도 됩니다 — Claude 가 대신 실행합니다.

### A1. 콘텐츠 → 스킬용 md 로 변환

이 스킬이 이해하는 마크다운 문법(프론트매터 + `<!-- layout: ... -->` 디렉티브 + `:::card` 같은 펜스 블록) 으로 바꾸는 일은 Claude 에게 맡기세요. 아래 프롬프트를 그대로 복사해서 내용만 붙여넣으면 됩니다.

````text
다음 내용을 design-deck 스킬용 슬라이드 마크다운으로 만들어줘.
규칙:
- ~/.claude/skills/design-deck/SKILL.md 의 마크다운 문법을 따를 것
- 최소 레이아웃 디렉티브(<!-- layout: ... -->)만 써서 복잡하지 않게
- 첫 슬라이드는 title, 데이터/수치 슬라이드는 big-number 또는 stats,
  비교는 compare, 본문은 content, 마무리는 closing
- 출처가 있으면 <!-- source: "출처" --> 로 하단에 표기
- 파일은 ~/Desktop/<파일명>.md 로 저장해줘

== 내용 ==
<여기에 메모·초안·개요를 그대로 붙여넣기>
````

Claude 는 `SKILL.md` 를 읽어 현재 지원하는 레이아웃을 확인한 뒤, 내용을 슬라이드 단위로 쪼개 `.md` 파일을 작성합니다.

### A2. 생성된 md 확인

아주 간단한 데크는 이런 모양만 있어도 빌드됩니다 (`title` 프론트매터만 있으면 최소 조건 충족).

```markdown
---
title: 내 첫 발표
---

<!-- layout: title -->
# 제목 한 줄
## 부제
작성자 · 날짜

---
<!-- layout: content -->
# 본문 슬라이드

- 첫 번째 포인트
- 두 번째 포인트
- 세 번째 포인트
```

### A3. "이 파일로 슬라이드 만들어줘"

Claude 에게 경로를 주고 빌드를 요청합니다. 스킬이 자동 실행됩니다.

```text
> 이 파일로 슬라이드 만들어줘: ~/Desktop/my-deck.md

Claude: design-deck 스킬로 빌드합니다…
  ✓ lint clean
  ✓ 14 슬라이드 · Pretendard 임베드
  ✓ verify 통과
  ~/Desktop/my-deck.html 열어드릴까요?
```

### A4. 피드백으로 반복

결과 HTML 을 Chrome 에 띄워놓고 자연어로 수정 요청:

- "3번 슬라이드 제목 더 짧게"
- "5번 슬라이드를 big-number 레이아웃으로 바꿔"
- "마지막 슬라이드에 출처 `<!-- source: "OpenAI, 2026.4" -->` 추가"

Claude 가 `.md` 를 수정하고 다시 빌드합니다.

### A5. PDF 로 내보내기

```text
> PDF 로 내보내줘

Claude: --pdf 플래그로 다시 빌드합니다…
  ✓ ~/Desktop/my-deck.pdf (14 페이지, 1920×1080)
```

## CLI 로 직접 (파워 유저용)

명령을 직접 쓰고 싶다면 이 경로가 가장 빠릅니다.

1. `hello.md` 를 만듭니다.

   ```markdown
   ---
   title: 첫 덱
   ---

   # 안녕하세요
   ## 마크다운 한 페이지로 슬라이드 한 장

   ---
   <!-- layout: bento -->
   # 17개 레이아웃

   :::card
   ### 빠른 시작
   #### 한 줄 명령
   `--pdf` 플래그 하나로 PDF까지 자동 생성.
   :::

   :::card
   ### 일관된 톤
   #### ODS 자동 적용
   Pretendard, 오렌지, 4px 그리드 — 매번 동일.
   :::

   :::card
   ### 오프라인 단일 파일
   #### 어디서나 재생
   폰트도 이미지도 모두 base64 임베드.
   :::
   ```

2. 빌드 + PDF 한 번에:

   ```bash
   node ~/.claude/skills/design-deck/build.js hello.md --pdf
   open hello.html
   ```

끝. 우측 상단에 오렌지임팩트 로고, Pretendard 폰트, 오렌지 강조색이 자동으로 들어갑니다. `Cmd+P` → Save as PDF 수동 루트도 가능. 전체 문법 레퍼런스는 [`examples/all-layouts.md`](examples/all-layouts.md) (17 레이아웃 · 24 슬라이드 데모) 와 [`examples/opening-bookmatch.md`](examples/opening-bookmatch.md) (실제 PDF 한 벌 재현) 를 참고하세요.

## 핵심 기능

| | |
|---|---|
| 🎨 **17개 레이아웃** | title · section · part-cover · statement · toc · content · two-column · quote · image · big-number · stats · chart · compare · bento · chain · timeline · process · profile · prompt-demo · checkpoint-rows · closing |
| 📦 **단일 자립형 HTML** | Pretendard·로고·이미지 모두 base64 임베드 (~3-5MB). 오프라인 동작, 인터넷 없는 곳에서도 재생 가능 |
| 🖨️ **헤드리스 PDF** | `--pdf` 한 줄로 1920×1080·슬라이드당 1페이지 PDF. Playwright 우선, 없으면 Chrome headless 폴백 |
| 🤖 **AI 이미지 생성** | `![캡션](ai:"프롬프트")` 한 줄로 OpenAI gpt-image-2 호출. SHA-256 캐시로 재빌드 시 0원 |
| 🎯 **Brand sidecar** | `brand.md` 한 파일로 accent·typography·radius·shadow 오버라이드. DESIGN.md v2 호환 |
| 🚫 **8 anti-slop 룰** | emoji·가짜 stats·gradient·teal default·blinking dot·icon stack 등 자동 검사 |
| ⭐ **Critique 모드** | 5축 비평 슬라이더 (철학/계층/디테일/기능/창의) + 3-designer-debate 노트 |
| ✅ **자동 검증** | `--verify` 로 빌드 후 슬라이드 수·폰트 임베드·@page 규칙 자동 점검 |

## 마크다운 문법

### 슬라이드 구분

단독 `---` 한 줄.

### 프론트매터 (선택)

파일 최상단의 첫 `---…---` 쌍.

```yaml
---
title: 발표 제목
author: pengdo@myorange.io
date: 2026-04-23
theme: light
---
```

### 슬라이드 디렉티브

각 슬라이드 위에 HTML 주석으로 지정.

| 디렉티브 | 의미 |
|---|---|
| `<!-- layout: bento -->` | 레이아웃 (기본 `content`) |
| `<!-- theme: dark -->` | 테마 오버라이드 |
| `<!-- chapter: "Ch 3" -->` | 좌상단 브레드크럼 |
| `<!-- meta: "01/06" -->` | 우상단 메타 |
| `<!-- source: "출처" -->` | 좌하단 출처 |
| `<!-- stats: 3 -->` | stats 셀 수 |
| `<!-- highlight -->` | 직전 카드 하이라이트 |
| `<!-- icon: heart -->` | Lucide 아이콘 |

### 블록 (fenced)

```markdown
:::col
좌측 열
:::

:::col
우측 열
:::

:::card
### 라벨
#### 카드 제목
본문
:::

:::compare-before BEFORE
- 비교 좌측
:::

:::compare-after AFTER
- 비교 우측
:::
```

### 이미지

```markdown
![일반 이미지](./photo.jpg)
![AI 생성](ai:"warm-toned office desk, photographic" size:1536x1024)
```

전체 문법은 [`examples/all-layouts.md`](examples/all-layouts.md) — 17개 레이아웃을 한 번에 보여주는 24장 데모.

## CLI

```
node ~/.claude/skills/design-deck/build.js <input.md> [options]
```

| 플래그 | 설명 |
|---|---|
| `--out <path>` | 출력 HTML 경로 (기본: `<input>.html`) |
| `--mode draft\|final` | `draft`: AI 이미지 placeholder / `final`: 실제 생성 (기본: `final`) |
| `--design-system <path>` | ODS 경로 오버라이드 |
| `--theme light\|dark` | 기본 테마 |
| `--pdf` | PDF 생성 (Playwright → Chrome 폴백) |
| `--slide <N[,N]>` | 지정 슬라이드만 단독 렌더 |
| `--merge <N>` | `preview/slide-N.html` 을 메인 덱에 머지 |
| `--no-image-gen` | AI 이미지 placeholder 처리 |
| `--images-only` | 이미지만 생성 후 종료 |
| `--clear-cache` | 이미지 캐시 삭제 |
| `--yes` | 비용 확인 자동 승인 |
| `--showcase` | ≥5장 덱에서 grammar 정의용 2장만 빌드 → `<out>.showcase.html` |
| `--verify` | 빌드 후 자동 검증 (슬라이드 수, 폰트, @page) |
| `--strict` | lint warning 1건이라도 있으면 빌드 실패 |

## Brand sidecar — 한 파일로 톤 전체를 흔든다

마크다운 파일과 같은 폴더에 `brand.md` 가 있으면 자동 로드합니다. 형식은 [awesome-claude-design](https://github.com/rohitg00/awesome-claude-design) 의 DESIGN.md v2 사양과 호환되어, `brandmd`·`styleseed` 같은 외부 추출 도구의 출력을 거의 그대로 가져올 수 있습니다.

```yaml
---
# 기본 (v1)
accent: "#FF6F1F"
theme: dark
chapter: "Q2 2026"
logo: ./my-logo.svg

# 확장 (DESIGN.md v2)
family: warm-editorial          # 4 family preset 중 하나
typography:
  headline: "Pretendard Variable"
  body: "Pretendard Variable"
  mono: "JetBrains Mono"
component_overrides:
  card_radius: 24
  card_shadow: "0 6px 24px rgba(0,0,0,0.06)"
  bullet_shape: dash            # square|disc|dash
---
```

[`examples/brand-test/`](examples/brand-test/) 에 v2 사이드카가 실제로 어떻게 적용되는지 보여주는 smoke test 가 있습니다.

## Family presets — 4개의 톤

`family:` 한 줄로 spacing / radius / shadow / bullet 만 변형됩니다 (ODS 의 컬러·기본 폰트는 보존). [`examples/remix/`](examples/remix/) 에 4개 데모.

| Family | 영감 | 변형 |
|---|---|---|
| `warm-editorial` | Notion · Resend · Claude | 기본 ODS — 변형 없음 |
| `editorial-minimalism` | Linear · Stripe · Vercel | 여백 +20%, shadow none, radius 6px, dash bullet |
| `data-dense-pro` | PostHog · ClickHouse · Grafana | 여백 −20%, radius 8px, tnum 강제 |
| `terminal-core` | Ollama · Warp · Raycast | mono 폰트 강제 |

## Anti-AI-slop 린터

빌드 시 자동 실행. 위반은 `output.build.json.warnings[]` 에 기록 + 콘솔 경고. `--strict` 면 빌드 실패. 슬라이드 시작에 `<!-- lint: off -->` 추가 시 해당 슬라이드 검사 건너뜀.

| 규칙 | 의미 | 출처 |
|---|---|---|
| `no-emoji` | 본문 emoji 금지 (체크 마크 등 텍스트 심볼은 OK) | huashu |
| `no-data-slop` | "10,000+ users" 같이 출처 없는 큰 숫자 패턴 금지 | huashu |
| `no-gradient` | linear/radial-gradient 금지 | huashu |
| `no-svg-imagery` | 인라인 SVG 곡선 path (사람·사물 그림 의심) 금지 | huashu |
| `ai-prompt-slop` | AI 프롬프트에 gradient/purple/neon/cyberpunk 금지 | huashu |
| `no-teal-default` | accent 가 Claude Design 기본 teal `#16d5e6` ±20° hue 면 경고 | awesome-claude-design |
| `no-blinking-dot` | `<!-- chip: live -->`, `🟢 LIVE`, `pulse-dot` 등 status indicator 슬롭 | awesome-claude-design |
| `no-icon-stack` | 같은 Lucide 아이콘이 ≥3 슬라이드에서 반복 (도배 방지) | awesome-claude-design |

## Critique 모드

빌드한 HTML 을 Chrome 으로 열고 좌하단 **`[리뷰 모드]`** 토글 → 슬라이드별 [승인]/[수정 요청]/[이미지 재생성] + **`[★ 비평]`** 으로 깊은 리뷰 패널이 뜹니다.

- **5축 슬라이더** (0–10): 철학 일관성 · 시각 계층 · 디테일 · 기능성 · 창의성
- **3-designer-debate** 노트 영역:
  - Editorial Minimalist (Linear/Stripe 톤): "여백 부족 / 위계 강함"
  - Data-Dense Pro (PostHog/ClickHouse 톤): "차트 라벨 잘림"
  - Warm Editorial (Notion/Resend 톤): "CTA 따뜻함 부족"
- 점수·메모는 슬라이드 별로 localStorage 자동 저장. **`[⤓ 내보내기]`** 로 `revisions.yaml` 다운로드 → 다음 라운드 수정의 입력으로.

빌드 시 LLM 호출은 일어나지 않습니다 — 비평은 사람이 직접 메모하는 구조입니다.

## Showcase 갤러리

[`showcase/`](showcase/) 는 사용자가 빌드한 실제 덱을 PR 로 받는 디렉토리입니다. 양식은 [`showcase/CONTRIBUTING.md`](showcase/CONTRIBUTING.md) 참고.

## 폴더 구조

```
design-deck/
├── SKILL.md / README.md / package.json / build.js
├── lib/
│   ├── parse.js · inline.js · blocks.js
│   ├── chrome.js · print-css.js · stage.js · icons.js
│   ├── assets.js · image-gen.js · review.js · pdf.js
│   └── lint.js · verify.js · family-presets.js
├── design-system/
│   ├── colors_and_type.css · deck.css
│   ├── fonts/PretendardVariable.woff2
│   └── assets/logos/orangeimpact{,-all-white}.svg
├── templates/shell.html
├── examples/
│   ├── all-layouts.md           # 17 layout showcase (24 slides)
│   ├── brand-test/              # DESIGN.md v2 sidecar smoke test
│   └── remix/                   # 4 aesthetic family demos
└── showcase/                    # community PRs
```

## 영감 받은 곳 (Acknowledgments)

이 스킬은 다음 오픈소스에서 핵심 패턴을 차용했습니다. 마음에 드신다면 그쪽도 ★ 눌러주세요:

| 프로젝트 | 우리가 가져온 것 |
|---|---|
| **[alchaincyf/huashu-design](https://github.com/alchaincyf/huashu-design)** | showcase-first 워크플로 (5장 이상 덱은 톤부터 검증), 5축 critique 패널, 17-layout showcase 구조, 5개 baseline anti-slop 룰 |
| **[rohitg00/awesome-claude-design](https://github.com/rohitg00/awesome-claude-design)** | DESIGN.md v2 사양, 9개 aesthetic family 카탈로그, 8개 anti-slop fingerprint 중 3개 (teal default · blinking dot · icon stack), remix recipes 패턴, 3-designer-debate 비평 |
| **[Anthropic frontend aesthetics cookbook](https://github.com/anthropics/claude-cookbooks/blob/main/coding/prompting_for_frontend_aesthetics.ipynb)** | "NEVER use generic AI-generated aesthetics" 베이스라인 룰 — Inter/Roboto/system font, 보라색 그라디언트, 쿠키 커터 레이아웃 회피의 기준점 |

특히 awesome-claude-design 의 **anti-slop fingerprint 큐레이션** 은 이 스킬 lint 규칙의 정신적 토대고, huashu-design 의 **showcase-first 패턴** 은 50장짜리 덱을 다 그리고 나서 톤이 틀렸다는 걸 깨닫는 지옥을 막아주는 가장 가치 있는 워크플로입니다.

## 범위 밖 (out of scope)

- 슬라이드별 Claude 폴리시 패스 (향후 `--polish` 옵션)
- 진짜 WYSIWYG 에디터 (리뷰 오버레이로 대체)
- gpt-image-2 외 이미지 모델 어댑터
- 마크다운 테이블 / 푸트노트 / LaTeX
- 9 family preset 중 5개 (`cinematic-dark`, `playful-color`, `glass-soft-futurism`, `neon-brutalist`, `cult-indie`) — enum 만 받고 `warm-editorial` 폴백

## 라이선스

내부 도구 (Orangeimpact). 외부 영감 출처는 각자의 라이선스를 따릅니다 (위 표 참고).
