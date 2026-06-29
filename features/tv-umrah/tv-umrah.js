/* FEATURE (native, additive): Umrah / Hajj Group Orchestrator · New
   Sequences each pilgrim's milestones (passport → visa → ticket → hotel →
   transport), shows a live group-readiness gauge, and flags the slowest
   pilgrim blocking the group's departure. #tv-umrah-root. localStorage epal_tv_umrah. */
(function(){"use strict";
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];});}
function rd(k){try{var r=localStorage.getItem(k);return r?JSON.parse(r):null;}catch(e){}return null;}
var LS='epal_tv_umrah';
var STEPS=['passport','visa','ticket','hotel','transport'];
var ICON={passport:'📓',visa:'🛂',ticket:'🎫',hotel:'🏨',transport:'🚌'};
function load(){return rd(LS)||[
 {id:'G1',name:'Ramadan Umrah — Batch A',depart:'2026-07-20',pax:[
   {n:'Abdul Karim',s:{passport:1,visa:1,ticket:1,hotel:1,transport:0}},
   {n:'Halima Karim',s:{passport:1,visa:1,ticket:1,hotel:1,transport:0}},
   {n:'Yusuf Ali',s:{passport:1,visa:0,ticket:0,hotel:1,transport:0}},
   {n:'Mariam Begum',s:{passport:1,visa:1,ticket:1,hotel:1,transport:1}}]},
 {id:'G2',name:'Family Umrah — Rahman',depart:'2026-08-05',pax:[
   {n:'Mizanur Rahman',s:{passport:1,visa:1,ticket:0,hotel:0,transport:0}},
   {n:'Ayesha Rahman',s:{passport:1,visa:0,ticket:0,hotel:0,transport:0}}]}];}
function save(){try{localStorage.setItem(LS,JSON.stringify(G));}catch(e){}}
var G=load(),cur=G[0]&&G[0].id;
function done(p){return STEPS.reduce(function(a,k){return a+(p.s[k]?1:0);},0);}
function readiness(g){var t=g.pax.length*STEPS.length;var d=g.pax.reduce(function(a,p){return a+done(p);},0);return t?Math.round(d/t*100):0;}
function slowest(g){return g.pax.slice().sort(function(a,b){return done(a)-done(b);})[0];}
function root(){return document.getElementById('tv-umrah-root');}
function render(){var r=root();if(!r)return;injectCss();var g=G.find(function(x){return x.id===cur;})||G[0];
  var list=G.map(function(x){var rd=readiness(x);return '<div class="um-row'+(x.id===cur?' on':'')+'" onclick="tvUmOpen(\''+x.id+'\')"><div><div class="um-gn">'+esc(x.name)+'</div><div class="um-gd">'+x.pax.length+' pilgrims · depart '+esc(x.depart)+'</div></div><div class="um-rd" style="color:'+(rd===100?'#16a34a':rd>=60?'#d97706':'#dc2626')+'">'+rd+'%</div></div>';}).join('');
  var sw=slowest(g);
  var head=['Pilgrim'].concat(STEPS.map(function(k){return ICON[k]+'';})).map(function(h){return '<th>'+h+'</th>';}).join('');
  var rows=g.pax.map(function(p,i){var cells=STEPS.map(function(k){return '<td style="text-align:center;cursor:pointer" onclick="tvUmTog('+i+',\''+k+'\')">'+(p.s[k]?'<span class="um-ok">✓</span>':'<span class="um-no">○</span>')+'</td>';}).join('');
    var d=done(p);return '<tr><td><strong>'+esc(p.n)+'</strong>'+(p===sw&&d<STEPS.length?' <span class="um-flag">⚠ blocking</span>':'')+'</td>'+cells+'<td style="text-align:center"><b>'+d+'/'+STEPS.length+'</b></td></tr>';}).join('');
  var rdn=readiness(g);
  r.innerHTML='<div class="um-two"><div class="um-card um-pad"><div class="um-h">🕋 Groups</div>'+list+'<button class="erp-btn btn-sm btn-ghost" style="margin-top:10px;width:100%" onclick="tvUmNew()">＋ New group</button></div>'
    +'<div class="um-card um-pad"><div class="um-h">'+esc(g.name)+' <span style="margin-left:auto;font-size:12px;color:var(--text3);font-weight:400">depart '+esc(g.depart)+'</span></div>'
    +'<div class="um-gauge"><div class="um-gbar"><div class="um-gfill" style="width:'+rdn+'%;background:'+(rdn===100?'#16a34a':rdn>=60?'#d97706':'#dc2626')+'"></div></div><div class="um-gt">'+rdn+'% group-ready</div></div>'
    +(rdn<100&&sw?'<div class="um-block">⚠️ Blocking departure: <b>'+esc(sw.n)+'</b> ('+done(sw)+'/'+STEPS.length+' done) — chase '+STEPS.filter(function(k){return !sw.s[k];}).join(', ')+'</div>':'<div class="um-block ok">✅ All pilgrims ready for departure</div>')
    +'<div style="overflow:auto"><table class="um-tbl"><thead><tr>'+head+'<th>Done</th></tr></thead><tbody>'+rows+'</tbody></table></div>'
    +'<div style="font-size:11px;color:var(--text3);margin-top:8px">Tap a cell to mark a milestone done. Steps: '+STEPS.map(function(k){return ICON[k]+' '+k;}).join(' → ')+'</div></div></div>';
}
window.tvUmOpen=function(id){cur=id;render();};
window.tvUmTog=function(i,k){var g=G.find(function(x){return x.id===cur;});if(g&&g.pax[i]){g.pax[i].s[k]=g.pax[i].s[k]?0:1;save();render();}};
window.tvUmNew=function(){var nm=prompt('Group name:','Umrah Group');if(!nm)return;var dep=prompt('Departure date (YYYY-MM-DD):','2026-09-01')||'';G.unshift({id:'G'+Date.now().toString().slice(-4),name:nm,depart:dep,pax:[{n:'Pilgrim 1',s:{passport:0,visa:0,ticket:0,hotel:0,transport:0}}]});cur=G[0].id;save();render();};
function injectCss(){if(document.getElementById('um-css'))return;var s=document.createElement('style');s.id='um-css';var P='#erp-panel-tv-umrah ';
  s.textContent=P+'.um-two{display:grid;grid-template-columns:.85fr 1.5fr;gap:14px}'+'@media(max-width:900px){'+P+'.um-two{grid-template-columns:1fr}}'
  +P+'.um-card{background:var(--bg2);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow)}'+P+'.um-pad{padding:15px 17px}'+P+'.um-h{font-size:13.5px;font-weight:700;margin-bottom:12px;display:flex;align-items:center}'
  +P+'.um-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px;border:1px solid var(--border);border-radius:10px;margin-bottom:8px;cursor:pointer}'+P+'.um-row.on{border-color:var(--accent);background:var(--accent-light,#eff6ff)}'
  +P+'.um-gn{font-size:13px;font-weight:700}'+P+'.um-gd{font-size:11px;color:var(--text3)}'+P+'.um-rd{font-size:18px;font-weight:800;font-family:"DM Mono",monospace}'
  +P+'.um-gauge{margin-bottom:12px}'+P+'.um-gbar{height:14px;background:var(--bg3);border-radius:8px;overflow:hidden}'+P+'.um-gfill{height:100%;border-radius:8px;transition:width .3s}'+P+'.um-gt{font-size:12px;color:var(--text2);margin-top:5px;font-weight:600}'
  +P+'.um-block{font-size:12.5px;background:#fef2f2;color:#991b1b;border:1px solid #fecaca;border-radius:9px;padding:9px 12px;margin-bottom:12px}'+P+'.um-block.ok{background:#f0fdf4;color:#15803d;border-color:#bbf7d0}'
  +'[data-theme="dark"] '+P+'.um-block{background:rgba(220,38,38,.12);border-color:rgba(220,38,38,.35);color:#fca5a5}'
  +P+'.um-tbl{width:100%;border-collapse:collapse;font-size:13px}'+P+'.um-tbl th{text-align:left;color:var(--text2);font-weight:600;font-size:12px;padding:8px 10px;border-bottom:1px solid var(--border);background:var(--bg3)}'+P+'.um-tbl td{padding:8px 10px;border-bottom:1px solid var(--border)}'
  +P+'.um-ok{color:#16a34a;font-weight:800}'+P+'.um-no{color:var(--text3)}'+P+'.um-flag{font-size:10px;color:#dc2626;font-weight:700;margin-left:5px}';
  document.head.appendChild(s);}
function boot(){var r=root();if(r){render();}else{document.addEventListener('DOMContentLoaded',render);}}boot();
})();
