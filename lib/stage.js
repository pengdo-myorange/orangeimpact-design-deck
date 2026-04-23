export const STAGE_JS = `
(function(){
  var slides = [].slice.call(document.querySelectorAll('.sl'));
  var total = slides.length;
  if (!total) return;
  var counter = document.getElementById('deck-counter');
  var key = 'design-deck:' + (document.title || 'deck') + ':idx';
  var active = parseInt(localStorage.getItem(key) || '0', 10) || 0;
  var hashN = parseInt((location.hash || '').replace(/^#/, ''), 10);
  if (!isNaN(hashN) && hashN > 0 && hashN <= total) active = hashN - 1;
  if (active < 0 || active >= total) active = 0;

  function fitScale(){
    var pad = 32;
    var sx = (window.innerWidth - pad) / 1920;
    var sy = (window.innerHeight - pad) / 1080;
    return Math.min(sx, sy, 1);
  }
  function show(i){
    if (i < 0) i = 0;
    if (i >= total) i = total - 1;
    active = i;
    var s = fitScale();
    // Translate by -half-of-SCALED dimensions so the scaled box is centered
    // around the (left:50%, top:50%) anchor. Using -50% percentages here
    // references the unscaled 1920×1080, which clips at non-1:1 zoom.
    var tx = -960 * s;
    var ty = -540 * s;
    slides.forEach(function(el, j){
      if (j === i) {
        el.classList.add('is-active');
        el.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + s + ')';
      } else {
        el.classList.remove('is-active');
        el.style.transform = '';
      }
    });
    if (counter) counter.textContent = (i + 1) + ' / ' + total;
    localStorage.setItem(key, String(i));
    history.replaceState(null, '', '#' + (i + 1));
    try { window.postMessage({ slideIndexChanged: i }, '*'); } catch(e){}
  }
  function next(){ show(active + 1); }
  function prev(){ show(active - 1); }

  document.addEventListener('keydown', function(e){
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
    else if (e.key === 'Home') { e.preventDefault(); show(0); }
    else if (e.key === 'End') { e.preventDefault(); show(total - 1); }
  });

  var tx = 0, ty = 0;
  document.addEventListener('pointerdown', function(e){ tx = e.clientX; ty = e.clientY; });
  document.addEventListener('pointerup', function(e){
    var dx = e.clientX - tx, dy = e.clientY - ty;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) { dx < 0 ? next() : prev(); }
  });

  window.addEventListener('resize', function(){ show(active); });
  window.addEventListener('beforeprint', function(){ document.body.classList.add('is-printing'); });
  window.addEventListener('afterprint', function(){ document.body.classList.remove('is-printing'); show(active); });

  window.__deck = { show: show, next: next, prev: prev, total: total };
  show(active);
})();
`;
