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
--pdf                     헤드리스 Chrome으로 PDF 생성
--slide <N[,N]>           지정 슬라이드만 단독 렌더
--merge <N>               preview/slide-N.html을 메인 덱에 머지
--no-image-gen            AI 이미지 placeholder 처리
--images-only             이미지 생성만 수행
--clear-cache             이미지 캐시 삭제
--interactive             1장씩 순차 모드
--yes                     비용 확인 자동 승인
```

## 폴더 구조

```
design-deck/
  SKILL.md / README.md / package.json / build.js
  lib/
    parse.js inline.js blocks.js
    chrome.js print-css.js stage.js icons.js
    assets.js image-gen.js review.js pdf.js
    layouts/ (structure/content/numbers/grid/flow/special)
  design-system/
    colors_and_type.css deck.css
    fonts/PretendardVariable.woff2
    assets/orangeimpact-{logo,mark,wordmark-white}.svg
  templates/shell.html
  examples/hello.md
```

## 참고

- 참조 PDF `AI_2026-04-22.pdf` (139페이지)의 톤·여백·오렌지 사용 비율을 기준점으로 삼아 레이아웃을 설계.
- 완전한 다크 테마·진짜 WYSIWYG은 이번 범위 밖 (`SKILL.md` 참고).
