/* ════════════════════════════════════════════════════════════════════
   FEATURE LOADER: Travels — Smart Suite  ·  New
   Mounts the full Epal Travels Smart Suite (travel.html — Quotation,
   Task Management, Visa (Pro), Air Ticketing (Pro), Compliance, Expense,
   States, + EON AI) as an isolated panel INSIDE erp-combined.html, under
   the Travels company menu. Appears when the role is switched to
   "Travels Agent" (RBAC: id 'tv-suite' is in tvSvc).

   Why an embedded panel: the suite reuses component classes (.modal,
   .card, .kpi, .tbl, .btn…) that erp-combined defines differently, so an
   iframe keeps both UIs fully styled with ZERO conflict. As new modular
   features are added to /features they appear here automatically.
   Self-contained: delete this <script> tag and the Smart Suite is gone.
   ════════════════════════════════════════════════════════════════════ */
(function(){
"use strict";
function init(){
  var content=document.querySelector('#erp-screen .erp-content');
  if(!content) return;
  var sub=document.getElementById('sub-travels');   // Travels company submenu

  // 1) register with the core navigator so showErpPanel() clears it like any panel
  try{ if(typeof erpPanels!=='undefined' && erpPanels.indexOf('tv-suite')<0) erpPanels.push('tv-suite'); }catch(e){}
  try{ if(typeof erpTitles!=='undefined') erpTitles['tv-suite']='Travels — Smart Suite'; }catch(e){}

  // 2) the panel (lazy iframe — only loads travel.html when first opened)
  if(!document.getElementById('erp-panel-tv-suite')){
    var p=document.createElement('div'); p.className='erp-panel'; p.id='erp-panel-tv-suite';
    p.innerHTML='<div style="display:flex;align-items:center;gap:9px;margin-bottom:12px">'
      +'<h2 style="font-size:19px;font-weight:700;margin:0">Epal Travels — Smart Suite</h2>'
      +'<span style="font-size:9px;font-weight:800;letter-spacing:.4px;text-transform:uppercase;background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;padding:2px 7px;border-radius:6px">New</span>'
      +'<a href="travel.html" target="_blank" style="margin-left:auto;font-size:12px;color:var(--accent);text-decoration:none">Open full screen ↗</a></div>'
      +'<div style="height:calc(100vh - 165px);min-height:520px;border:1px solid var(--border);border-radius:14px;overflow:hidden;box-shadow:var(--shadow);background:#f4f6fb">'
      +'<iframe id="tv-suite-frame" title="Epal Travels Smart Suite" style="width:100%;height:100%;border:0;display:block"></iframe></div>';
    content.appendChild(p);
  }

  // 3) sidebar nav item at the top of the Travels submenu
  if(sub && !sub.querySelector('[data-tvsuite]')){
    var nav=document.createElement('div'); nav.className='erp-nav'; nav.setAttribute('data-tvsuite','1');
    nav.setAttribute('onclick',"showErpPanel('tv-suite',event.currentTarget)");
    nav.innerHTML='<span class="erp-nav-icon">✨</span> Smart Suite '
      +'<span style="margin-left:6px;font-size:8px;font-weight:800;letter-spacing:.4px;text-transform:uppercase;background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;padding:1px 5px;border-radius:6px;vertical-align:middle">New</span>';
    sub.insertBefore(nav, sub.firstChild);
  }

  // 4) lazy-load the iframe only the first time the panel is opened
  if(window.showErpPanel && !window.showErpPanel.__tvsuite){
    var _show=window.showErpPanel;
    var wrapped=function(id){ if(id==='tv-suite'){ var f=document.getElementById('tv-suite-frame'); if(f && !f.getAttribute('src')) f.setAttribute('src','travel.html'); } return _show.apply(this,arguments); };
    wrapped.__tvsuite=true; window.showErpPanel=wrapped;
  }
}
// run during parse — the sidebar & content already exist above this script,
// so the nav item is present before RBAC filters the sidebar (on DOMContentLoaded).
init();
})();
