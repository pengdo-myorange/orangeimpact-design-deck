# Family Picker — 3 questions → aesthetic family recommendation

Ported from [awesome-claude-design/prompts/family-picker.md](https://github.com/rohitg00/awesome-claude-design/tree/main/prompts), adapted for design-deck's 9 family presets.

## When to use

- User brings a `.md` deck source but doesn't know which `family:` to set
- User says "어떤 톤이 맞을지 모르겠다", "추천해줘", or omits `family:` and asks for suggestions
- Before running `node build.js` for a ≥5 slide deck — avoid rebuilding after a wrong grammar choice

## Instructions for Claude

Ask the three questions below one at a time (not all at once). After the third answer, output a single recommendation with rationale and a ready-to-paste `brand.md` sidecar.

Do **not** offer more than one recommendation. Do not hedge. If the user's answers point between two families, pick the one with the tighter match and name the runner-up in one line.

---

### Q1 — 덱의 목적은?

- a. **제품/기능 발표** — 스펙, 성능, 로드맵
- b. **내러티브/스토리** — 문제 정의, 여정, 철학
- c. **데이터/리서치** — 차트·표·수치가 중심
- d. **브랜드/마케팅** — 톤과 무드가 메시지 자체

### Q2 — 청중이 기대하는 분위기는?

- a. **미니멀·프로페셔널** (Linear/Stripe 느낌)
- b. **따뜻·서술적** (Notion/Claude 느낌)
- c. **밀도 높은·기술적** (PostHog/Grafana 느낌)
- d. **드라마틱·키노트급** (NVIDIA/Apple 느낌)
- e. **친근·컬러풀** (Figma/Duolingo 느낌)
- f. **편집증·브루털** (The Verge/A24 느낌)

### Q3 — 한 가지 제약이 있다면?

- a. **다크 캔버스 필수** — 무대 조명, 키노트
- b. **한글 타이포 가독성 우선** — 장시간 읽는 덱
- c. **인쇄 PDF로 배포** — 그림자·블러 최소화
- d. **브랜드 컬러가 이미 있다** — accent 는 정해져 있음
- e. **제약 없음**

---

## Recommendation matrix

| Q1 → | Q2 → | 추천 family |
|---|---|---|
| a 제품 | a 미니멀 | `editorial-minimalism` |
| a 제품 | c 밀도 | `data-dense-pro` |
| a 제품 | d 드라마틱 | `cinematic-dark` (Q3=a면 확정) |
| b 내러티브 | b 따뜻 | `warm-editorial` |
| b 내러티브 | f 편집증 | `indie-cult` |
| c 데이터 | c 밀도 | `data-dense-pro` |
| c 데이터 | d 드라마틱 | `cinematic-dark` |
| d 브랜드 | d 드라마틱 | `glass-futurism` (부드러운) / `cinematic-dark` (강한) |
| d 브랜드 | e 컬러풀 | `playful-color` |
| d 브랜드 | f 편집증 | `neon-brutalist` |
| 기타 | 터미널/개발자 | `terminal-core` |

## Q3 오버라이드

- Q3=a (다크 필수) → `cinematic-dark` 우선 고려
- Q3=b (한글 가독성) → `neon-brutalist`, `terminal-core` 제외 (좁은 자간·거친 리듬이 장시간 읽기에 피로)
- Q3=c (인쇄 PDF) → `glass-futurism`, `indie-cult` 제외 (`backdrop-filter` 가 print 에서 일관되지 않음)
- Q3=d (정해진 accent) → 가장 영향 적은 3개 중 선택: `warm-editorial`, `editorial-minimalism`, `data-dense-pro`

## Output format

답변 받은 뒤 아래 형식으로 딱 한 번 출력:

```
🎨 추천: <family-name>

이유: <한 문장 — 질문 3개의 답변과 매트릭스 매칭>
차점: <runner-up family + 왜 아쉬운지 한 줄>

브랜드 사이드카 (brand.md 로 저장):
---
family: <family-name>
accent: "<hex>"   # 선택 — Q3=d 였다면 사용자가 준 값, 아니면 삭제
---

다음 단계:
node ~/.claude/skills/design-deck/build.js <input>.md --showcase --mode draft
```

가장 먼저 `--showcase` 모드로 2장만 빌드해 grammar 확인을 제안한다 (50장 다 그리고 방향 틀린 걸 깨닫는 걸 방지).
