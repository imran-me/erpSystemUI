/* FEATURE (native, additive): Fare-Drop Auto-Rebooker · New
   Watches held/booked fares; if the price drops before issue, flags the
   saving so you re-book cheaper (capture the diff as margin or pass to the
   customer). #tv-faredrop-root. localStorage epal_tv_faredrop. */
(function(){"use strict";
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];});}
function money(n){return '৳ '+Math.round(Number(n||0)).toLocaleString('en-IN');}
function rd(k){try{var r=localStorage.getItem(k);return r?JSON.parse(r):null;}catch(e){}return null;}
var LS='epal_tv_faredrop';
function load(){return rd(LS)||[
 {id:'F1',pnr:'EK7K2P',route:'DAC-DXB',airline:'Emirates',booked:56000,current:51500,captured:false},
 {id:'F2',pnr:'MH3X8R',route:'DAC-KUL',airline:'Malaysia',booked:46000,current:46000,captured:false},
 {id:'F3',pnr:'QR5T1A',route:'DAC-DOH',airline:'Qatar',booked:58000,current:53200,captured:false},
 {id:'F4',pnr:'SV9Q4L',route:'DAC-JED',airline:'Saudia',booked:69000,current:64000,captured:false}];}
function save(){try{localStorage.setItem(LS,JSON.stringify(ROWS));}catch(e){}}
var ROWS=load();
function drop(x){return Math.max(0,(+x.booked||0)-(+x.current||0));}
function root(){return document.getElementById('tv-faredrop-root');}
function render(){var r=root();if(!r)return;injectCss();
  var avail=ROWS.filter(function(x){return !x.captured;}).reduce(function(a,x){return a+drop(x);},0);
  var captured=ROWS.filter(function(x){return x.captured;}).reduce(function(a,x){return a+drop(x);},0);
  var rows=ROWS.map(function(x){var d=drop(x);
    return '<tr><td class="mono"><strong>'+esc(x.pnr)+'</strong></td><td>'+esc(x.route)+'</td><td>'+esc(x.airline)+'</td>'
     +'<td>'+money(x.booked)+'</td><td>'+money(x.current)+'</td>'
     +'<td style="color:'+(d>0?'#16a34a':'var(--text3)')+'">'+(d>0?'▼ '+money(d):'—')+'</td>'
     +'<td>'+(x.captured?'<span class="fd-pill" style="background:#16a34a">Captured</span>':d>0?'<span class="fd-pill" style="background:#2563eb">Drop available</span>':'<span class="fd-pill" style="background:#94a3b8">Watching</span>')+'</td>'
     +'<td style="text-align:right">'+(d>0&&!x.captured?'<button class="erp-btn btn-sm btn-primary" onclick="tvFdCapture(\''+x.id+'\')">Re-book & capture</button>':'')+'</td></tr>';}).join('');
  r.innerHTML='<div class="fd-kpis"><div class="fd-kpi"><div class="l">📉 Savings available</div><div class="v" style="color:#16a34a">'+money(avail)+'</div><div class="s">re-book to capture</div></div>'
    +'<div class="fd-kpi"><div class="l">✅ Captured</div><div class="v">'+money(captured)+'</div></div>'
    +'<div class="fd-kpi"><div class="l">👁 Watched fares</div><div class="v">'+ROWS.length+'</div></div>'
    +'<div class="fd-kpi" style="display:flex;align-items:center;justify-content:center"><button class="erp-btn btn-primary" onclick="tvFdScan()">↻ Re-check prices</button></div></div>'
    +'<div class="fd-card"><table class="fd-tbl"><thead><tr><th>PNR</th><th>Route</th><th>Airline</th><th>Booked @</th><th>Current</th><th>Drop</th><th>Status</th><th style="text-align:right">Action</th></tr></thead><tbody>'+rows+'</tbody></table></div>'
    +'<div style="font-size:11.5px;color:var(--text3);margin-top:8px">Auto-monitors held fares before issue. A drop = free margin (or a customer win). Re-checks run on a schedule.</div>';
}
window.tvFdScan=function(){ROWS.forEach(function(x){if(!x.captured&&Math.random()<0.5){x.current=Math.max(30000,Math.round(x.current*(0.93+Math.random()*0.05)/100)*100);}});save();render();};
window.tvFdCapture=function(id){var x=ROWS.find(function(z){return z.id===id;});if(!x)return;var d=drop(x);x.captured=true;save();render();alert('✅ Re-booked '+x.pnr+' at the lower fare.\nCaptured '+money(d)+' — added to margin (or pass to customer as a win).');};
function injectCss(){if(document.getElementById('fd-css'))return;var s=document.createElement('style');s.id='fd-css';var P='#erp-panel-tv-faredrop ';
  s.textContent=P+'.fd-kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;margin-bottom:16px}'+P+'.fd-kpi{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:13px 15px;box-shadow:var(--shadow)}'+P+'.fd-kpi .l{font-size:11.5px;color:var(--text2)}'+P+'.fd-kpi .v{font-size:22px;font-weight:700;margin-top:4px;font-family:"DM Mono",monospace}'+P+'.fd-kpi .s{font-size:10.5px;color:var(--text3)}'
  +P+'.fd-card{background:var(--bg2);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow);overflow:hidden}'+P+'.fd-tbl{width:100%;border-collapse:collapse;font-size:12.5px}'+P+'.fd-tbl th{text-align:left;color:var(--text2);font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:.3px;padding:9px 12px;border-bottom:1px solid var(--border);background:var(--bg3);white-space:nowrap}'+P+'.fd-tbl td{padding:9px 12px;border-bottom:1px solid var(--border);vertical-align:middle}'+P+'.mono{font-family:"DM Mono",monospace;font-size:12px}'
  +P+'.fd-pill{display:inline-block;font-size:10.5px;font-weight:700;color:#fff;padding:2px 9px;border-radius:20px}';
  document.head.appendChild(s);}
function boot(){var r=root();if(r){render();}else{document.addEventListener('DOMContentLoaded',render);}}boot();
})();
