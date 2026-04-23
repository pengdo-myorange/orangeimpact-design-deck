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
.deck.is-critique .dd-critique-panel { display: block; }

.deck.is-review .sl.is-active.dd-approved { box-shadow: 0 0 0 4px #22c55e, 0 0 0 1px rgba(255,255,255,0.04); }
.deck.is-review .sl.is-active.dd-fix { box-shadow: 0 0 0 4px #FF6F1F, 0 0 0 1px rgba(255,255,255,0.04); }

@media print {
  .dd-review-toggle, .dd-review-actions, .dd-critique-panel { display: none !important; }
}
`;

export const REVIEW_HTML = `
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
</aside>
`;

export const REVIEW_JS = `
(function(){
  var deck = document.querySelector('.deck');
  if (!deck) return;
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
  function loadCritique(idx){
    var k = 'slide-'+(idx+1);
    var c = (state[k] && state[k].critique) || {};
    document.getElementById('dd-critique-idx').textContent = String(idx + 1);
    ['philosophy','hierarchy','craft','function','originality'].forEach(function(axis){
      var input = critiquePanel.querySelector('input[data-axis="'+axis+'"]');
      var label = critiquePanel.querySelector('span[data-val="'+axis+'"]');
      var v = c[axis] != null ? c[axis] : 5;
      input.value = v; label.textContent = v;
    });
    critiquePanel.querySelector('textarea[data-field="comment"]').value = c.comment || '';
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
