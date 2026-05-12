// Review overlay (approve / fix / regen / critique). Print-hidden via @media print.

export const REVIEW_CSS = `
.dd-review-toggle {
  position: fixed; bottom: 16px; left: 24px; z-index: 200;
  font: 600 13px/1 -apple-system, BlinkMacSystemFont, "Pretendard Variable", sans-serif;
  background: rgba(255,255,255,0.92); color: #171717; border: 1px solid rgba(0,0,0,0.1);
  padding: 8px 14px; border-radius: 999px; cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.dd-review-toggle:hover { background: #fff; }
.dd-review-actions {
  display: none;
  position: fixed; bottom: 64px; left: 50%; transform: translateX(-50%);
  z-index: 200;
  background: rgba(255,255,255,0.96);
  border-radius: 999px;
  padding: 8px;
  gap: 4px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.18);
  border: 1px solid rgba(0,0,0,0.08);
}
.dd-review-actions button {
  font: 600 13px/1 -apple-system, BlinkMacSystemFont, "Pretendard Variable", sans-serif;
  background: transparent; color: #171717; border: 0; padding: 8px 14px; border-radius: 999px; cursor: pointer;
}
.dd-review-actions button:hover { background: rgba(0,0,0,0.05); }
.deck.is-review .dd-review-actions { display: flex; }

.dd-critique-panel {
  display: none;
  position: fixed; right: 16px; top: 16px; z-index: 200;
  width: 320px; padding: 20px;
  background: rgba(255,255,255,0.97);
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.2);
  font: 13px/1.5 -apple-system, BlinkMacSystemFont, "Pretendard Variable", sans-serif;
  color: #171717;
}
.dd-critique-panel h4 { margin: 0 0 12px; font-size: 14px; font-weight: 700; }
.dd-critique-panel label { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; font-size: 12px; color: #525252; }
.dd-critique-panel label span.val { color: #FF6F1F; font-weight: 700; font-feature-settings: "tnum" 1; }
.dd-critique-panel input[type=range] { width: 100%; accent-color: #FF6F1F; }
.dd-critique-panel textarea { width: 100%; min-height: 60px; margin-top: 8px; padding: 8px; border: 1px solid rgba(0,0,0,0.12); border-radius: 6px; font: inherit; resize: vertical; }
.dd-critique-personas { margin-top: 16px; padding-top: 16px; border-top: 1px dashed rgba(0,0,0,0.12); }
.dd-critique-personas h5 { margin: 0 0 10px; font-size: 12px; font-weight: 700; color: #525252; text-transform: uppercase; letter-spacing: 0.5px; }
.dd-critique-personas label { gap: 4px; }
.dd-critique-personas .dd-persona-tag { color: #FF6F1F; font-weight: 700; font-size: 11px; }
.dd-critique-personas textarea { min-height: 44px; }
.deck.is-critique .dd-critique-panel { display: block; }

.deck.is-review .sl.is-active.dd-approved { box-shadow: 0 0 0 4px #22c55e, 0 0 0 1px rgba(255,255,255,0.04); }
.deck.is-review .sl.is-active.dd-fix { box-shadow: 0 0 0 4px #FF6F1F, 0 0 0 1px rgba(255,255,255,0.04); }

/* Storyboard grid — full-deck thumbnail overview for Step 0 approval.
   Triggered before image generation so authors can validate flow cheaply. */
.dd-storyboard-toggle {
  position: fixed; bottom: 16px; left: 160px; z-index: 200;
  font: 600 13px/1 -apple-system, BlinkMacSystemFont, "Pretendard Variable", sans-serif;
  background: rgba(255,255,255,0.92); color: #171717; border: 1px solid rgba(0,0,0,0.1);
  padding: 8px 14px; border-radius: 999px; cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.dd-storyboard-toggle:hover { background: #fff; }
.dd-storyboard {
  display: none;
  position: fixed; inset: 0; z-index: 300;
  background: rgba(245, 245, 245, 0.98);
  overflow-y: auto;
  padding: 48px;
}
.deck.is-storyboard .dd-storyboard { display: block; }
.dd-storyboard-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 24px;
  font: 700 16px/1.4 -apple-system, BlinkMacSystemFont, "Pretendard Variable", sans-serif;
  color: #171717;
}
.dd-storyboard-header button {
  font: 600 13px/1 inherit; background: #171717; color: #fff;
  border: 0; padding: 10px 16px; border-radius: 999px; cursor: pointer;
}
.dd-storyboard-header button.secondary { background: transparent; color: #171717; border: 1px solid rgba(0,0,0,0.2); }
.dd-storyboard-header button + button { margin-left: 8px; }
.dd-part-group { margin-bottom: 40px; }
.dd-part-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; margin-bottom: 16px;
  background: #fff; border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.08);
  font: 700 14px/1.4 inherit;
}
.dd-part-header .dd-part-title { color: #171717; }
.dd-part-header button {
  font: 600 12px/1 inherit; background: #22c55e; color: #fff;
  border: 0; padding: 8px 12px; border-radius: 999px; cursor: pointer;
}
.dd-part-header.is-approved button { background: #16a34a; }
.dd-part-header.is-approved::after { content: " ✓ approved"; color: #22c55e; font-weight: 700; }
.dd-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
@media (max-width: 1100px) { .dd-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 800px) { .dd-grid { grid-template-columns: repeat(2, 1fr); } }
.dd-tile {
  position: relative;
  background: #fff;
  border: 2px solid rgba(0,0,0,0.06);
  border-radius: 12px;
  padding: 12px;
  cursor: grab;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  font: 13px/1.4 -apple-system, BlinkMacSystemFont, "Pretendard Variable", sans-serif;
  color: #171717;
}
.dd-tile:hover { box-shadow: 0 6px 18px rgba(0,0,0,0.1); transform: translateY(-2px); }
.dd-tile.dragging { opacity: 0.4; }
.dd-tile.drop-target { border-color: #FF6F1F; }
.dd-tile.is-approved { border-color: #22c55e; }
.dd-tile.has-comment { border-color: #FF6F1F; }
.dd-tile-index {
  position: absolute; top: -10px; left: 12px;
  background: #171717; color: #fff;
  font: 700 11px/1 monospace;
  padding: 4px 8px; border-radius: 6px;
}
.dd-tile-thumb {
  width: 100%; aspect-ratio: 16/9;
  background: #fafafa; border-radius: 6px;
  margin-bottom: 8px; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  color: #a3a3a3; font-size: 11px;
}
.dd-tile-thumb iframe { width: 1920px; height: 1080px; border: 0; transform: scale(0.18); transform-origin: top left; }
.dd-tile-thumb-wrap { width: 100%; aspect-ratio: 16/9; overflow: hidden; border-radius: 6px; background: #fafafa; margin-bottom: 8px; }
.dd-tile-label { font-weight: 600; margin-bottom: 4px; min-height: 1.4em; }
.dd-tile-layout { font-size: 11px; color: #737373; text-transform: uppercase; letter-spacing: 0.5px; }
.dd-tile-comment {
  margin-top: 8px; width: 100%; min-height: 44px;
  padding: 6px 8px; border: 1px solid rgba(0,0,0,0.1);
  border-radius: 6px; font: 12px/1.4 inherit; color: #171717;
  resize: vertical;
}

@media print {
  .dd-review-toggle, .dd-review-actions, .dd-critique-panel,
  .dd-storyboard-toggle, .dd-storyboard { display: none !important; }
}
`;

export const REVIEW_HTML = `
<button class="dd-storyboard-toggle" id="dd-storyboard-toggle" type="button">[스토리보드]</button>
<div class="dd-storyboard" id="dd-storyboard" aria-label="Storyboard grid">
  <div class="dd-storyboard-header">
    <span>스토리보드 — 전체 흐름 확인 후 'approve all' 로 진행</span>
    <span>
      <button type="button" class="secondary" id="dd-storyboard-export">⤓ storyboard.yaml</button>
      <button type="button" id="dd-storyboard-approve-all">✓ approve all</button>
      <button type="button" class="secondary" id="dd-storyboard-close">닫기</button>
    </span>
  </div>
  <div id="dd-storyboard-content"></div>
</div>
<button class="dd-review-toggle" id="dd-review-toggle" type="button">[리뷰 모드]</button>
<div class="dd-review-actions" id="dd-review-actions" role="toolbar" aria-label="Review actions">
  <button type="button" data-action="approve">✓ 승인</button>
  <button type="button" data-action="fix">✎ 수정 요청</button>
  <button type="button" data-action="regen">↻ 이미지 재생성</button>
  <button type="button" data-action="critique">★ 비평</button>
  <button type="button" data-action="export">⤓ 내보내기</button>
</div>
<aside class="dd-critique-panel" id="dd-critique-panel" aria-label="5-axis critique">
  <h4>5축 비평 — 슬라이드 <span id="dd-critique-idx">1</span></h4>
  <label>철학 일관성 <span class="val" data-val="philosophy">5</span><input type="range" min="0" max="10" value="5" data-axis="philosophy"></label>
  <label>시각 계층 <span class="val" data-val="hierarchy">5</span><input type="range" min="0" max="10" value="5" data-axis="hierarchy"></label>
  <label>디테일 <span class="val" data-val="craft">5</span><input type="range" min="0" max="10" value="5" data-axis="craft"></label>
  <label>기능성 <span class="val" data-val="function">5</span><input type="range" min="0" max="10" value="5" data-axis="function"></label>
  <label>창의성 <span class="val" data-val="originality">5</span><input type="range" min="0" max="10" value="5" data-axis="originality"></label>
  <textarea data-field="comment" placeholder="Keep / Fix / Quick Wins"></textarea>
  <div class="dd-critique-personas">
    <h5>3-designer debate</h5>
    <label><span class="dd-persona-tag">Editorial Minimalist (Linear / Stripe)</span><textarea data-persona="minimalist" placeholder="Whitespace, hierarchy, restraint..."></textarea></label>
    <label><span class="dd-persona-tag">Data-Dense Pro (PostHog / ClickHouse)</span><textarea data-persona="data_dense" placeholder="Information density, chart legibility..."></textarea></label>
    <label><span class="dd-persona-tag">Warm Editorial (Notion / Resend)</span><textarea data-persona="warm_editorial" placeholder="Tone, emotional resonance, CTA warmth..."></textarea></label>
  </div>
</aside>
`;

export const REVIEW_JS = `
(function(){
  var deck = document.querySelector('.deck');
  if (!deck) return;

  // -------- Storyboard grid (Step 0 approval) --------
  // Builds a draggable tile grid from the live slides. Persists comments,
  // approvals, and re-orderings to localStorage. On 'approve all' it writes
  // a storyboard.yaml that the next build pass consumes to re-emit slides
  // in the chosen order and skip approved-but-unchanged parts.
  var sbToggle = document.getElementById('dd-storyboard-toggle');
  var sbPanel = document.getElementById('dd-storyboard');
  var sbContent = document.getElementById('dd-storyboard-content');
  var sbExportBtn = document.getElementById('dd-storyboard-export');
  var sbApproveAllBtn = document.getElementById('dd-storyboard-approve-all');
  var sbCloseBtn = document.getElementById('dd-storyboard-close');
  var deckTitle = document.title || 'deck';
  var sbKey = 'design-deck:storyboard:' + deckTitle;
  var sbState = {};
  try { sbState = JSON.parse(localStorage.getItem(sbKey) || '{}'); } catch(e){ sbState = {}; }
  if (!sbState.order) sbState.order = null;
  if (!sbState.tiles) sbState.tiles = {};
  if (!sbState.parts) sbState.parts = {};
  function saveSb(){ try { localStorage.setItem(sbKey, JSON.stringify(sbState)); } catch(e){} }

  function buildStoryboard(){
    var slides = [].slice.call(document.querySelectorAll('.sl'));
    var current = sbState.order && sbState.order.length === slides.length
      ? sbState.order.map(function(i){ return slides[i]; }).filter(Boolean)
      : slides;
    // Group by data-part attribute if present, else single group.
    var groups = []; var byKey = {};
    current.forEach(function(el, displayIdx){
      var pt = el.getAttribute('data-part') || '0';
      if (!byKey[pt]) { byKey[pt] = { part: pt, tiles: [] }; groups.push(byKey[pt]); }
      byKey[pt].tiles.push({ el: el, idx: slides.indexOf(el) });
    });
    sbContent.innerHTML = '';
    groups.forEach(function(g){
      var groupEl = document.createElement('section');
      groupEl.className = 'dd-part-group';
      groupEl.dataset.part = g.part;
      var partApproved = !!(sbState.parts && sbState.parts[g.part]);
      var header = document.createElement('div');
      header.className = 'dd-part-header' + (partApproved ? ' is-approved' : '');
      var title = document.createElement('span');
      title.className = 'dd-part-title';
      title.textContent = g.part === '0' ? '본문' : 'Part ' + g.part;
      var partBtn = document.createElement('button');
      partBtn.type = 'button';
      partBtn.textContent = partApproved ? '✓ approved' : '✓ approve part';
      partBtn.addEventListener('click', function(){
        sbState.parts[g.part] = !sbState.parts[g.part];
        saveSb();
        buildStoryboard();
      });
      header.appendChild(title); header.appendChild(partBtn);
      groupEl.appendChild(header);
      var grid = document.createElement('div');
      grid.className = 'dd-grid';
      g.tiles.forEach(function(tt){
        var slide = tt.el;
        var origIdx = tt.idx;
        var label = slide.getAttribute('data-screen-label') || '';
        var layout = (slide.className.match(/sl-([a-z-]+)/) || ['',''])[1];
        var tile = document.createElement('div');
        tile.className = 'dd-tile';
        tile.draggable = true;
        tile.dataset.slideIndex = origIdx;
        var tileState = sbState.tiles['s'+origIdx] || {};
        if (tileState.approved) tile.classList.add('is-approved');
        if (tileState.comment) tile.classList.add('has-comment');
        var num = document.createElement('div');
        num.className = 'dd-tile-index';
        num.textContent = (origIdx + 1);
        var thumb = document.createElement('div');
        thumb.className = 'dd-tile-thumb';
        thumb.textContent = layout || '(layout?)';
        var labelEl = document.createElement('div');
        labelEl.className = 'dd-tile-label';
        labelEl.textContent = label;
        var layoutEl = document.createElement('div');
        layoutEl.className = 'dd-tile-layout';
        layoutEl.textContent = layout || '';
        var commentEl = document.createElement('textarea');
        commentEl.className = 'dd-tile-comment';
        commentEl.placeholder = '인라인 코멘트 (자연어 수정 지시)';
        commentEl.value = tileState.comment || '';
        commentEl.addEventListener('input', function(){
          sbState.tiles['s'+origIdx] = sbState.tiles['s'+origIdx] || {};
          sbState.tiles['s'+origIdx].comment = commentEl.value;
          if (commentEl.value) tile.classList.add('has-comment');
          else tile.classList.remove('has-comment');
          saveSb();
        });
        tile.appendChild(num);
        tile.appendChild(thumb);
        tile.appendChild(labelEl);
        tile.appendChild(layoutEl);
        tile.appendChild(commentEl);
        // Drag-and-drop reorder
        tile.addEventListener('dragstart', function(e){
          tile.classList.add('dragging');
          e.dataTransfer.setData('text/plain', String(origIdx));
        });
        tile.addEventListener('dragend', function(){ tile.classList.remove('dragging'); });
        tile.addEventListener('dragover', function(e){ e.preventDefault(); tile.classList.add('drop-target'); });
        tile.addEventListener('dragleave', function(){ tile.classList.remove('drop-target'); });
        tile.addEventListener('drop', function(e){
          e.preventDefault();
          tile.classList.remove('drop-target');
          var srcIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
          var dstIdx = origIdx;
          if (Number.isNaN(srcIdx) || srcIdx === dstIdx) return;
          var allSlides = [].slice.call(document.querySelectorAll('.sl'));
          var order = sbState.order && sbState.order.length === allSlides.length
            ? sbState.order.slice()
            : allSlides.map(function(_, i){ return i; });
          var from = order.indexOf(srcIdx);
          var to = order.indexOf(dstIdx);
          if (from < 0 || to < 0) return;
          order.splice(to, 0, order.splice(from, 1)[0]);
          sbState.order = order;
          saveSb();
          buildStoryboard();
        });
        grid.appendChild(tile);
      });
      groupEl.appendChild(grid);
      sbContent.appendChild(groupEl);
    });
  }

  if (sbToggle) {
    sbToggle.addEventListener('click', function(){
      deck.classList.toggle('is-storyboard');
      if (deck.classList.contains('is-storyboard')) buildStoryboard();
    });
  }
  if (sbCloseBtn) sbCloseBtn.addEventListener('click', function(){ deck.classList.remove('is-storyboard'); });
  if (sbApproveAllBtn) sbApproveAllBtn.addEventListener('click', function(){
    var allSlides = [].slice.call(document.querySelectorAll('.sl'));
    allSlides.forEach(function(_, i){
      sbState.tiles['s'+i] = sbState.tiles['s'+i] || {};
      sbState.tiles['s'+i].approved = true;
    });
    saveSb();
    buildStoryboard();
  });
  if (sbExportBtn) sbExportBtn.addEventListener('click', function(){
    var allSlides = [].slice.call(document.querySelectorAll('.sl'));
    var order = sbState.order && sbState.order.length === allSlides.length
      ? sbState.order
      : allSlides.map(function(_, i){ return i; });
    var lines = ['# storyboard.yaml', '# saved by design-deck storyboard overlay', ''];
    lines.push('order:');
    order.forEach(function(i){ lines.push('  - ' + (i + 1)); });
    lines.push('');
    lines.push('parts:');
    Object.keys(sbState.parts || {}).forEach(function(p){
      lines.push('  "' + p + '": ' + (sbState.parts[p] ? 'approved' : 'pending'));
    });
    lines.push('');
    lines.push('tiles:');
    Object.keys(sbState.tiles || {}).sort().forEach(function(k){
      var t = sbState.tiles[k];
      lines.push('  ' + k + ':');
      if (t.approved) lines.push('    approved: true');
      if (t.comment) lines.push('    comment: ' + JSON.stringify(t.comment));
    });
    var blob = new Blob([lines.join('\\n')], { type: 'text/yaml' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'storyboard.yaml'; document.body.appendChild(a); a.click();
    setTimeout(function(){ URL.revokeObjectURL(url); a.remove(); }, 100);
  });

  // -------- Original per-slide review overlay --------
  var toggle = document.getElementById('dd-review-toggle');
  var actions = document.getElementById('dd-review-actions');
  var critiquePanel = document.getElementById('dd-critique-panel');
  var slides = [].slice.call(document.querySelectorAll('.sl'));
  var key = 'design-deck:review:' + (document.title || 'deck');
  var state = {};
  try { state = JSON.parse(localStorage.getItem(key) || '{}'); } catch(e){ state = {}; }

  function activeIndex(){ for (var i=0;i<slides.length;i++) if (slides[i].classList.contains('is-active')) return i; return 0; }
  function applyMarks(){
    slides.forEach(function(el, i){
      el.classList.remove('dd-approved', 'dd-fix');
      var s = state['slide-'+(i+1)];
      if (s && s.status === 'approve') el.classList.add('dd-approved');
      if (s && s.status === 'fix') el.classList.add('dd-fix');
    });
  }
  function save(){ try { localStorage.setItem(key, JSON.stringify(state)); } catch(e){} }
  function setStatus(idx, status, note){
    var k = 'slide-'+(idx+1);
    state[k] = state[k] || {};
    state[k].status = status;
    if (note != null) state[k].note = note;
    save(); applyMarks();
  }
  var PERSONAS = ['minimalist','data_dense','warm_editorial'];
  function loadCritique(idx){
    var k = 'slide-'+(idx+1);
    var c = (state[k] && state[k].critique) || {};
    var p = (state[k] && state[k].personas) || {};
    document.getElementById('dd-critique-idx').textContent = String(idx + 1);
    ['philosophy','hierarchy','craft','function','originality'].forEach(function(axis){
      var input = critiquePanel.querySelector('input[data-axis="'+axis+'"]');
      var label = critiquePanel.querySelector('span[data-val="'+axis+'"]');
      var v = c[axis] != null ? c[axis] : 5;
      input.value = v; label.textContent = v;
    });
    critiquePanel.querySelector('textarea[data-field="comment"]').value = c.comment || '';
    PERSONAS.forEach(function(name){
      var ta = critiquePanel.querySelector('textarea[data-persona="'+name+'"]');
      if (ta) ta.value = p[name] || '';
    });
  }
  function saveCritique(idx){
    var k = 'slide-'+(idx+1);
    state[k] = state[k] || {};
    var c = {};
    ['philosophy','hierarchy','craft','function','originality'].forEach(function(axis){
      var input = critiquePanel.querySelector('input[data-axis="'+axis+'"]');
      c[axis] = parseInt(input.value, 10);
    });
    c.comment = critiquePanel.querySelector('textarea[data-field="comment"]').value;
    state[k].critique = c;
    var p = {};
    PERSONAS.forEach(function(name){
      var ta = critiquePanel.querySelector('textarea[data-persona="'+name+'"]');
      if (ta && ta.value.trim()) p[name] = ta.value;
    });
    if (Object.keys(p).length) state[k].personas = p;
    else delete state[k].personas;
    save();
  }
  toggle.addEventListener('click', function(){
    deck.classList.toggle('is-review');
    if (!deck.classList.contains('is-review')) deck.classList.remove('is-critique');
  });
  actions.addEventListener('click', function(e){
    var btn = e.target.closest('button[data-action]');
    if (!btn) return;
    var idx = activeIndex();
    var act = btn.dataset.action;
    if (act === 'approve') setStatus(idx, 'approve');
    else if (act === 'fix') {
      var note = window.prompt('수정 요청 내용 (자연어):', (state['slide-'+(idx+1)] && state['slide-'+(idx+1)].note) || '');
      if (note != null) setStatus(idx, 'fix', note);
    } else if (act === 'regen') setStatus(idx, 'regen');
    else if (act === 'critique') {
      deck.classList.toggle('is-critique');
      if (deck.classList.contains('is-critique')) loadCritique(idx);
    } else if (act === 'export') {
      var lines = ['# revisions.yaml', '# saved by design-deck review overlay', ''];
      Object.keys(state).sort().forEach(function(k){
        var s = state[k];
        lines.push(k + ':');
        if (s.status) lines.push('  status: ' + s.status);
        if (s.note) lines.push('  note: ' + JSON.stringify(s.note));
        if (s.critique) {
          lines.push('  critique:');
          Object.keys(s.critique).forEach(function(ax){
            var v = s.critique[ax];
            if (typeof v === 'string') lines.push('    ' + ax + ': ' + JSON.stringify(v));
            else lines.push('    ' + ax + ': ' + v);
          });
        }
        if (s.personas) {
          lines.push('  personas:');
          Object.keys(s.personas).forEach(function(name){
            lines.push('    ' + name + ': ' + JSON.stringify(s.personas[name]));
          });
        }
      });
      var blob = new Blob([lines.join('\\n')], { type: 'text/yaml' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'revisions.yaml'; document.body.appendChild(a); a.click();
      setTimeout(function(){ URL.revokeObjectURL(url); a.remove(); }, 100);
    }
  });
  critiquePanel.addEventListener('input', function(e){
    var input = e.target;
    if (input.type === 'range') {
      var span = critiquePanel.querySelector('span[data-val="'+input.dataset.axis+'"]');
      if (span) span.textContent = input.value;
    }
    saveCritique(activeIndex());
  });
  // Listen to slide changes from stage.js
  window.addEventListener('message', function(e){
    if (e.data && typeof e.data.slideIndexChanged === 'number') {
      if (deck.classList.contains('is-critique')) loadCritique(e.data.slideIndexChanged);
    }
  });
  applyMarks();
})();
`;
