# Family Picker — 3 questions → 3 distinct-school recommendations

Ported from [awesome-claude-design/prompts/family-picker.md](https://github.com/rohitg00/awesome-claude-design/tree/main/prompts), upgraded with the [huashu-design](https://github.com/alchaincyf/huashu-design) "different-school guarantee" so the user sees three genuinely different visual philosophies — not three shades of the same style.

## When to use

- User brings a `.md` deck source but doesn't know which `family:` to set
- User says "어떤 톤이 맞을지 모르겠다", "추천해줘", or omits `family:` and asks for suggestions
- Before running `node build.js` for a ≥5 slide deck — avoid rebuilding after a wrong grammar choice

## 5 philosophy schools → 9 families mapping

Each family belongs to one school. The picker must return recommendations from **3 different schools** (never 2 families from the same school).

| School | Intent | Families in this school |
|---|---|---|
| **Information Architecture** | 정보 밀도·위계가 최상위 우선순위. 차트·표·데이터. | `data-dense-pro`, `editorial-minimalism` |
| **Motion Poetry** | 드라마틱한 타이포·깊이·무대감. 키노트·론칭. | `cinematic-dark`, `glass-futurism` |
| **Minimalism** | 극단적 절제, 여백이 메시지. 임원 리뷰·철학적 내러티브. | `warm-editorial` (default), `editorial-minimalism` |
| **Experimental** | 규칙 파괴, 강한 인상, 논쟁적. 브랜드·의견. | `neon-brutalist`, `playful-color` |
| **East Asian** | 여백·서체·따뜻한 톤. 감성·에세이·장기 독서. | `indie-cult`, `warm-editorial` |

> `editorial-minimalism` 과 `warm-editorial` 은 2개 학파에 걸침 — 쿼리 답변 시 한 번만 제시하고, 정확한 학파는 사용자 응답에 따라 판단.

## Instructions for Claude

Ask the three questions below one at a time (not all at once). After the third answer, output **exactly 3 recommendations from 3 different schools**, each with a 2-slide showcase command so the user can compare side by side.

Do not list more than 3. Do not list 2 from the same school. If user answers point to only 2 plausible schools, pad with a deliberately contrarian third to force comparison.

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

## Selection algorithm

**Step 1 — Primary pick** from the Q1×Q2 matrix:

| Q1 → | Q2 → | Primary family | School |
|---|---|---|---|
| a 제품 | a 미니멀 | `editorial-minimalism` | Minimalism |
| a 제품 | c 밀도 | `data-dense-pro` | Information Architecture |
| a 제품 | d 드라마틱 | `cinematic-dark` | Motion Poetry |
| b 내러티브 | b 따뜻 | `warm-editorial` | East Asian |
| b 내러티브 | f 편집증 | `indie-cult` | East Asian |
| c 데이터 | c 밀도 | `data-dense-pro` | Information Architecture |
| c 데이터 | d 드라마틱 | `cinematic-dark` | Motion Poetry |
| d 브랜드 | d 드라마틱 | `glass-futurism` | Motion Poetry |
| d 브랜드 | e 컬러풀 | `playful-color` | Experimental |
| d 브랜드 | f 편집증 | `neon-brutalist` | Experimental |
| 기타 | 터미널/개발자 | `terminal-core` | Information Architecture |

**Step 2 — Pick 2 contrarian comparisons** from two different schools that the primary does NOT belong to. Aim for maximum visual distance so the user's preference becomes obvious.

Contrarian rubric:
- If primary school = Minimalism → pair with Motion Poetry + Experimental
- If primary school = Information Architecture → pair with East Asian + Motion Poetry
- If primary school = Motion Poetry → pair with Minimalism + East Asian
- If primary school = Experimental → pair with Minimalism + Motion Poetry
- If primary school = East Asian → pair with Experimental + Information Architecture

**Step 3 — Apply Q3 overrides**:
- Q3=a (다크 필수) → 후보 중 `cinematic-dark` 가 없으면 하나로 강제 교체
- Q3=b (한글 가독성) → `neon-brutalist`, `terminal-core` 제거 (자간·리듬이 장시간 읽기에 피로)
- Q3=c (인쇄 PDF) → `glass-futurism`, `indie-cult` 제거 (backdrop-filter 는 print 에서 일관성 없음)
- Q3=d (accent 고정) → 사용자가 준 hex 를 brand.md 에 `accent:` 로 넣으라 안내

After filtering, if fewer than 3 remain, backfill from another school following Step 2 rubric.

## Output format

정확히 아래 포맷으로 1회 출력:

```
🎨 3가지 방향 — 다른 학파 3개에서 각 1개

1️⃣ <primary family>  (<school>)
   이유: <한 문장>
   쇼케이스: node ~/.claude/skills/design-deck/build.js <input>.md --showcase --mode draft

2️⃣ <contrarian-1 family>  (<school>)
   이유: <왜 다른 방향인지 한 문장>
   쇼케이스: node ~/.claude/skills/design-deck/build.js <input>.md --showcase --mode draft
   (먼저 brand.md 에 family: <이 family> 로 덮어쓰기)

3️⃣ <contrarian-2 family>  (<school>)
   이유: <왜 또 다른 방향인지 한 문장>
   쇼케이스: (동일)

추천 순서:
1. 쇼케이스 3개 생성 (각 2장씩, 총 6장, AI 이미지는 placeholder)
2. 육안 5초 비교 → 맘에 드는 family 1개 선택
3. 그 family 로 전체 덱 draft 빌드

Q3 에서 가져온 제약 (있을 때): "<요약>"
```

모든 쇼케이스는 `--mode draft` 라 **AI 이미지 호출 0회** — 토큰 비용 없음. 육안 판단이 Claude 가 "이게 맞다" 예측하는 것보다 신뢰할 만하므로 항상 3개를 보여주는 쪽이 ROI 높음.
