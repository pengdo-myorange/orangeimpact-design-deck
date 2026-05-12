# 커버 이미지 프롬프트 빌더

출처: [kimharin-mujae/orange-blog-img](https://github.com/kimharin-mujae/orange-blog-img) STYLE_RULES 차용.

**적용 대상**: `layout: part-cover` 슬라이드 + (옵션) `layout: title` 슬라이드.
**모델**: OpenAI `gpt-image-2` (`lib/image-gen.js`).
**렌더링**: 풀-블리드. 텍스트·도형·로고는 슬라이드 위에 같이 그리지 않는다 (사용자 요구사항).

---

## 프롬프트 합성 공식

```
<CONCEPT> | <STYLE_RULES> | <NEGATIVE>
```

### CONCEPT (사용자 작성)
- 슬라이드 제목·서브타이틀에서 추출한 **개념 1개**
- 60–80자 한국어
- 1 main icon + 1–2 secondary icon 묘사
- 레이아웃 변주 (랜덤 1개):
  - `left-right contrast` · `flow` · `closeup` · `top-bottom` · `diagonal` · `left-skewed`

예: "왼쪽에 큰 자물쇠 아이콘, 오른쪽에 작은 열쇠 두 개. left-right contrast."

### STYLE_RULES (자동 부착)
```
pure black background (#000000),
main icon solid fill in focal color (default #FF6F1F orange; brand.md override wins),
secondary icons white outline only,
decoration: small dots, '+' marks, diamond shapes, short lines at varied scale,
flat 2D vector illustration,
centered composition with generous negative space
```

### NEGATIVE (자동 부착)
```
no text, no letters, no numbers, no labels,
no gradients, no 3D rendering, no realistic photography,
no glow, no neon, no cyberpunk aesthetic,
no human faces, no AI-illustration tropes
```

---

## brand.md 통합

`brand.md` 가 sidecar 로 존재하면 다음 키를 흡수:
- `accent` → focal color (default `#FF6F1F`)
- `cover_bg` → 배경색 오버라이드 (default `#000000`)
- `cover_secondary` → 보조 아이콘 색 (default `white`)

family preset 이 `cinematic-dark` 일 때 자동으로 `cover_bg=#0a0a0a`, focal=brand orange 유지.

---

## 호출 인터페이스

`lib/image-gen.js::ensureCoverImage()` 가 이 패턴을 자동 합성한다. 슬라이드 마크다운에는:

```markdown
<!-- layout: part-cover -->
# Part 02
# 신뢰의 구조
```

만 적으면 `renderPartCover()` 가 제목·서브타이틀을 CONCEPT 로 변환해 gpt-image-2 호출. **결과는 1920×1080 풀-블리드 이미지로만 슬라이드를 채운다 (텍스트·도형 동시 출력 없음).**

수동 오버라이드가 필요하면:
```markdown
<!-- layout: part-cover -->
<!-- cover-prompt: "왼쪽 위 작은 별, 오른쪽 아래 큰 달. diagonal." -->
# (제목은 빈 칸이어도 OK)
```
