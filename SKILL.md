---
name: design-deck
description: Convert a markdown file to a 1920x1080 HTML slide deck styled with the Orangeimpact Design System, ready to print as a multi-page PDF (one slide per page). Use when the user gives you a .md file and asks for slides, a deck, a presentation, or PDF slides. Supports 17 layouts, OpenAI gpt-image-2 image generation, headless Chrome auto-PDF, and a review overlay for iteration.
user-invocable: true
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# design-deck

마크다운을 Orangeimpact 디자인 시스템으로 스타일된 1920×1080 HTML 슬라이드 덱으로 변환. Chrome 인쇄 → 슬라이드당 PDF 1페이지.

## When to invoke

- 사용자가 `.md` 파일을 주고 "슬라이드", "덱", "발표 자료", "PDF 발표자료"를 요청할 때
- 기존 `.md` 을 다듬어 다시 빌드하거나 특정 슬라이드만 수정할 때

## Core workflow

1. **Input resolution.** 사용자 메시지에서 `.md` 경로 확인. 없으면 한 문장으로 물어본다.
2. **Design system resolution.** 아래 순서로 탐색, 첫 존재하는 것을 사용:
   - `--design-system <path>` 플래그
   - md 파일 디렉토리의 `./Orangeimpact Design System/`
   - 벤더링된 `~/.claude/skills/design-deck/design-system/` (기본값)
3. **API key check.** md 파일에 `ai:` 이미지 레퍼런스가 있으면 `$OPENAI_API_KEY` 존재 확인. 없으면 사용자에게 안내하거나 `--no-image-gen` 추천.
4. **Phase 1 — 일괄 드래프트 빌드:**
   ```bash
   node ~/.claude/skills/design-deck/build.js <input.md> --mode draft
   ```
   AI 이미지는 placeholder SVG로 대체. 출력 `deck.html` 을 macOS는 `open`, 리눅스는 `xdg-open`으로 Chrome에 띄운다.
5. **Phase 2 — 리뷰 마킹 안내:** 사용자에게 두 가지 선택지를 제공:
   - 드래프트 HTML 하단 `[리뷰 모드]` 토글 → 슬라이드별 [승인]/[수정 요청]/[이미지 재생성] 버튼 사용 → `[내보내기]`로 `revisions.yaml` 저장
   - 또는 자연어로 "3번 제목 짧게, 7번 이미지 교체" 같은 지시 → Claude가 `revisions.yaml` 작성
6. **Phase 3 — 타깃 수정 반복:** `revisions.yaml` 을 읽어 마킹된 슬라이드만 수정 → `--slide N` 로 단독 프리뷰 → 승인되면 `--merge N` 로 메인 덱에 머지.
7. **Finalize.** 사용자가 "최종 빌드" 하면:
   ```bash
   node ~/.claude/skills/design-deck/build.js <input.md> --mode final --pdf
   ```
   - `--mode final` → AI 이미지 실제 생성 (OpenAI `gpt-image-2`, SHA-256 캐시)
   - `--pdf` → 헤드리스 Chrome으로 `.pdf` 자동 생성
   - 빌드 시작 시 예상 비용을 사용자에게 표시하고 진행 여부 확인
8. **Done.** `deck.pdf` 경로 전달. 사용자가 옵션을 조정하고 싶으면 HTML을 Chrome에서 열어 `Cmd+P` 수동 루트 안내.

## CLI reference

```
node ~/.claude/skills/design-deck/build.js <input.md> [options]

Options:
  --out <path>              출력 HTML 경로 (기본: <input>.html)
  --mode draft|final        draft: AI 이미지 placeholder / final: 실제 생성 (기본: final)
  --design-system <path>    ODS 경로 오버라이드
  --theme light|dark        기본 테마 (기본: light)
  --assets-folder           단일 HTML 대신 sibling assets 폴더로 출력
  --pdf                     빌드 후 헤드리스 Chrome으로 PDF 생성
  --slide <N[,N,...]>       지정 슬라이드만 단독 렌더해 preview/slide-N.html 출력
  --merge <N>               preview/slide-N.html 을 메인 덱에 머지
  --no-image-gen            AI 이미지를 placeholder로만 처리
  --images-only             이미지 생성만 수행 후 종료
  --clear-cache             이미지 캐시 삭제
  --interactive             1장씩 순차 빌드·확인 모드
  --yes                     비용 확인 프롬프트 자동 승인
```

## Markdown syntax (cheat sheet)

슬라이드 구분자: 단독 `---` 한 줄.

```markdown
---
title: 발표 제목
author: pengdo@myorange.io
date: 2026-04-23
theme: light
accent: orange
---

<!-- layout: title -->
# 오늘, AI를
# 도구로 만드는 하루
## AI 활용교육 · OPENING
pengdo@myorange.io · 2026년 4월 22일

---
<!-- layout: big-number -->
<!-- chapter: "01 · 기회의 규모" -->
# 0.3%
지구 인구 81억 중 AI를 유료로 쓰는 사람의 비율
> "8.1 billion people on earth. 0.3% pay for AI."
— Noah Epstein, X, 2026.3

---
<!-- layout: compare -->
# 모호함이 사라지면, 정확도가 오릅니다

:::compare-before BEFORE · 구분자 없음
### 혼재된 입력
- 명령과 데이터 혼재 — 경계가 글자에 묻힘
- 모호한 경계 — 요약 대상 판단이 제각각
:::

:::compare-after AFTER · 구분자 적용
### 경계가 있는 입력
- 명확한 경계 — ### 안은 데이터, 밖은 명령
- 오류 최소화 — 범위가 좁아져 잡음 제거
:::

---
<!-- layout: stats -->
<!-- stats: 3 -->
# 비영리 섹터의 현실

## 45%
비영리 45%는 "기술에 충분히 투자하지 못하고 있다"고 응답했습니다.

## 거의 절반
비영리의 절반 가까이는 AI를 훈련받았거나 능숙한 직원이 전무합니다.

## 84%
AI를 쓰는 비영리의 84%는 "추가 재원이 가장 큰 확장 요인"이라 응답했습니다.
```

전체 레이아웃 문법은 `~/.claude/skills/design-deck/README.md` 참고.

## Verification

빌드 후 Read-only 검증:
1. `grep -c 'class="sl ' <output>.html` → 빌더 JSON 로그의 예상 슬라이드 수와 일치
2. `grep '@page { size: 1920px 1080px' <output>.html` → print 규칙 존재
3. `grep 'data:font/woff2' <output>.html` → Pretendard 임베드
4. `grep 'data-screen-label' <output>.html` → 모든 슬라이드 라벨링
5. `open <output>.html` → 첫 슬라이드 보임, 방향키 네비게이션, Cmd+P 미리보기에서 슬라이드당 1페이지
6. 참조 PDF (`AI_2026-04-22.pdf` 등)와 시각적 일관성 확인 — 드리프트 발견 시 해당 레이아웃 파일만 수정

## Non-goals (range out)

- 슬라이드별 Claude 폴리시 패스 (향후 `--polish`)
- 진짜 WYSIWYG 편집 (리뷰 오버레이로 대체)
- `gpt-image-2` 외 다른 이미지 모델 어댑터
- 마크다운 테이블/푸트노트/LaTeX

## Notes

- 출력 HTML은 단일 자립형 (~3-5MB). Pretendard·ODS·로고·이미지 모두 base64 임베드.
- 리뷰 오버레이는 `@media print`로 자동 숨김. PDF에 안 나온다.
- 캐시는 `.design-deck-cache/` 에 md 파일 옆에 생성. `.gitignore` 권장.
- 크롬 시스템(브레드크럼/메타/출처/페이지)은 title/section-divider/closing에서만 자동 숨김.
