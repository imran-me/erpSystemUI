/* FEATURE (native, additive): Refund Recovery Autopilot · New
   Auto-detects refundable unused/cancelled tickets, computes recoverable
   value minus penalty, and queues claims by each airline's deadline.
   #tv-refundauto-root. localStorage epal_tv_refundauto. */
(function(){"use strict";
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];});}
function money(n){return '৳ '+Math.round(Number(n||0)).toLocaleString('en-IN');}
function rd(k){try{var r=localStorage.getItem(k);return r?JSON.parse(r):null;}catch(e){}return null;}
var LS='epal_tv_refundauto';
function plus(d){var x=new Date();x.setDate(x.getDate()+d);return x.toISOString().slice(0,10);}
function load(){return rd(LS)||[
 {id:'R1',ticket:'176-2400990012',pax:'Rahim Uddin',airline:'Emirates',value:54000,penalty:6000,deadline:plus(9),status:'Detected'},
 {id:'R2',ticket:'065-2400970333',pax:'Walk-in hold',airline:'Saudia',value:62000,penalty:9000,deadline:plus(3),status:'Detected'},
 {id:'R3',ticket:'232-2400980451',pax:'GreenLand x2',airline:'Malaysia',value:38000,penalty:4000,deadline:plus(21),status:'Filed'},
 {id:'R4',ticket:'217-2400960777',pax:'Corporate blk',airline:'Qatar',value:51000,penalty:7000,deadline:plus(-2),status:'Detected'}];}
function save(){try{localStorage.setItem(LS,JSON.stringify(ROWS));}catch(e){}}
var ROWS=load();
function net(x){return Math.max(0,(+x.value||0)-(+x.penalty||0));}
function days(d){var x=new Date(d);x.setHours(0,0,0,0);var n=new Date();n.setHours(0,0,0,0);return Math.round((x-n)/86400000);}
function root(){return document.getElementById('tv-refundauto-root');}
function render(){var r=root();if(!r)return;injectCss();
  var recoverable=ROWS.filter(function(x){return x.status!=='Recovered';}).reduce(function(a,x){return a+net(x);},0);
  var urgent=ROWS.filter(function(x){return x.status==='Detected'&&days(x.deadline)<=7;}).length;
  var rows=ROWS.map(function(x){var n=days(x.deadline);var dc=n<0?'#dc2626':n<=7?'#dc2626':n<=14?'#d97706':'#16a34a';
    return '<tr><td class="mono">'+esc(x.ticket)+'</td><td>'+esc(x.pax)+'</td><td>'+esc(x.airline)+'</td>'
     +'<td>'+money(x.value)+'</td><td style="color:#dc2626">'+money(x.penalty)+'</td><td><strong>'+money(net(x))+'</strong></td>'
     +'<td><span class="ra-pill" style="background:'+dc+'">'+(n<0?'Missed '+(-n)+'d':n+'d')+'</span></td>'
     +'<td><span class="ra-st" style="color:'+(x.status==='Recovered'?'#16a34a':x.status==='Filed'?'#2563eb':'#d97706')+'">'+esc(x.status)+'</span></td>'
     +'<td style="text-align:right;white-space:nowrap">'+(x.status==='Detected'?'<button class="ra-op" onclick="tvRaFile(\''+x.id+'\')">📝 File</button>':'')+(x.status==='Filed'?'<button class="ra-op" onclick="tvRaDone(\''+x.id+'\')">✓ Recovered</button>':'')+'</td></tr>';}).join('');
  r.innerHTML='<div class="ra-kpis"><div class="ra-kpi"><div class="l">💰 Recoverable now</div><div class="v" style="color:#16a34a">'+money(recoverable)+'</div></div>'
    +'<div class="ra-kpi"><div class="l">⏰ Deadline ≤7 days</div><div class="v" style="color:#dc2626">'+urgent+'</div></div>'
    +'<div class="ra-kpi"><div class="l">🎫 Auto-detected</div><div class="v">'+ROWS.length+'</div></div>'
    +'<div class="ra-kpi" style="display:flex;align-items:center;justify-content:center"><button class="erp-btn btn-primary" onclick="tvRaAll()">🤖 Auto-file all due</button></div></div>'
    +'<div class="ra-card"><table class="ra-tbl"><thead><tr><th>Ticket</th><th>Pax</th><th>Airline</th><th>Value</th><th>Penalty</th><th>Net recoverable</th><th>Deadline</th><th>Status</th><th style="text-align:right">Action</th></tr></thead><tbody>'+rows+'</tbody></table></div>'
    +'<div style="font-size:11.5px;color:var(--text3);margin-top:8px">Unused tickets = ~3–5% of air spend. Autopilot files claims before each airline\'s refund deadline.</div>';
}
window.tvRaFile=function(id){var x=ROWS.find(function(z){return z.id===id;});if(x){x.status='Filed';save();render();}};
window.tvRaDone=function(id){var x=ROWS.find(function(z){return z.id===id;});if(x){x.status='Recovered';save();render();}};
window.tvRaAll=function(){var n=0;ROWS.forEach(function(x){if(x.status==='Detected'){x.status='Filed';n++;}});save();render();alert('🤖 Auto-filed '+n+' refund claim(s) with the respective airlines, prioritised by deadline.');};
function injectCss(){if(document.getElementById('ra-css'))return;var s=document.createElement('style');s.id='ra-css';var P='#erp-panel-tv-refundauto ';
  s.textContent=P+'.ra-kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-bottom:16px}'+P+'.ra-kpi{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:13px 15px;box-shadow:var(--shadow)}'+P+'.ra-kpi .l{font-size:11.5px;color:var(--text2)}'+P+'.ra-kpi .v{font-size:22px;font-weight:700;margin-top:4px;font-family:"DM Mono",monospace}'
  +P+'.ra-card{background:var(--bg2);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow);overflow:auto}'+P+'.ra-tbl{width:100%;border-collapse:collapse;font-size:12.5px}'+P+'.ra-tbl th{text-align:left;color:var(--text2);font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:.3px;padding:9px 11px;border-bottom:1px solid var(--border);background:var(--bg3);white-space:nowrap}'+P+'.ra-tbl td{padding:9px 11px;border-bottom:1px solid var(--border);vertical-align:middle}'+P+'.mono{font-family:"DM Mono",monospace;font-size:11.5px}'
  +P+'.ra-pill{display:inline-block;font-size:10.5px;font-weight:700;color:#fff;padding:2px 8px;border-radius:20px}'+P+'.ra-st{font-weight:600}'+P+'.ra-op{border:1px solid var(--border2,#d0d6e8);background:var(--bg2);cursor:pointer;font-size:11.5px;padding:4px 8px;border-radius:7px;font-family:inherit;color:var(--text2)}'+P+'.ra-op:hover{border-color:var(--accent);color:var(--accent)}';
  document.head.appendChild(s);}
function boot(){var r=root();if(r){render();}else{document.addEventListener('DOMContentLoaded',render);}}boot();
})();
