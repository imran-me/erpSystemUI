/* ════════════════════════════════════════════════════════════════════
   FEATURE (native, additive): Ticketing Deadlines — TTL & PNR Queue  ·  New
   Prevents the #1 ADM cause: track each held PNR's Ticketing Time Limit
   (TTL) with a live countdown, alert before it expires, monitor PNR queue
   health (inactive segments to release), and import holds from Flight
   Booking. Renders into #tv-ttl-root. localStorage epal_tv_ttl. Additive.
   ════════════════════════════════════════════════════════════════════ */
(function(){
"use strict";
var LS='epal_tv_ttl';
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];});}
function money(n){return '৳ '+Number(n||0).toLocaleString('en-IN');}
function uid(p){return p+'-'+String(Date.now()).slice(-5)+Math.floor(Math.random()*90+10);}
function load(){try{var r=localStorage.getItem(LS);if(r)return JSON.parse(r);}catch(e){}return seed();}
function save(){try{localStorage.setItem(LS,JSON.stringify(DB));}catch(e){}}
function plus(days,hrs){var d=new Date();d.setDate(d.getDate()+(days||0));d.setHours(d.getHours()+(hrs||0));return d.toISOString().slice(0,16);}
function seed(){return {pnrs:[
  {id:uid('H'),pnr:'EK7K2P',pax:'Rahim Uddin +1',airline:'Emirates',route:'DAC-DXB',ttl:plus(0,5),status:'Hold',amount:112000},
  {id:uid('H'),pnr:'SV9Q4L',pax:'Nadia Sultana',airline:'Saudia',route:'DAC-JED',ttl:plus(-0,-3),status:'Hold',amount:69000},
  {id:uid('H'),pnr:'MH3X8R',pax:'GreenLand x4',airline:'Malaysia Airlines',route:'DAC-KUL',ttl:plus(1,2),status:'Hold',amount:184000},
  {id:uid('H'),pnr:'QR5T1A',pax:'Tanvir Ahmed',airline:'Qatar Airways',route:'DAC-DOH',ttl:plus(2,0),status:'Hold',amount:58000},
  {id:uid('H'),pnr:'BG2M6C',pax:'Kamal Hossain',airline:'Biman',route:'DAC-CGP',ttl:plus(-1,0),status:'Ticketed',amount:9000}
],queue:[
  {id:uid('Q'),pnr:'EK7K2P',seg:'EK585 DAC-DXB',code:'HX',note:'Schedule change — confirm or release'},
  {id:uid('Q'),pnr:'TK4420',seg:'TK713 DAC-IST',code:'UN',note:'Airline cancelled segment'},
  {id:uid('Q'),pnr:'SQ8810',seg:'SQ447 DAC-SIN',code:'TK',note:'Time change — re-confirm'}
]};}
var DB=load();

function ttlState(s){ if(s.status==='Ticketed')return {cls:'ok',txt:'Ticketed'};
  var diff=(new Date(s.ttl)-new Date())/3600000; // hours
  if(diff<0)return {cls:'bad',txt:'EXPIRED '+Math.abs(Math.round(diff))+'h ago'};
  if(diff<6)return {cls:'bad',txt:Math.round(diff)+'h left'};
  if(diff<24)return {cls:'warn',txt:Math.round(diff)+'h left'};
  return {cls:'info',txt:Math.round(diff/24)+'d left'};
}
function root(){return document.getElementById('tv-ttl-root');}
function render(){var r=root();if(!r)return;injectCss();
  var holds=DB.pnrs.filter(function(p){return p.status==='Hold';});
  var expSoon=holds.filter(function(p){return (new Date(p.ttl)-new Date())/3600000<24 && (new Date(p.ttl)-new Date())>=0;}).length;
  var expired=holds.filter(function(p){return new Date(p.ttl)<new Date();}).length;
  var atRisk=holds.filter(function(p){return new Date(p.ttl)<new Date();}).reduce(function(a,p){return a+(+p.amount||0);},0);

  var rows=DB.pnrs.map(function(p){var st=ttlState(p);
    return '<tr><td class="mono"><strong>'+esc(p.pnr)+'</strong></td><td>'+esc(p.pax)+'</td><td>'+esc(p.airline)+'</td><td>'+esc(p.route)+'</td>'
      +'<td class="mono">'+esc((p.ttl||'').replace('T',' '))+'</td>'
      +'<td><span class="ttl-pill" style="background:'+({ok:'#16a34a',info:'#2563eb',warn:'#d97706',bad:'#dc2626'})[st.cls]+'">'+st.txt+'</span></td>'
      +'<td>'+money(p.amount)+'</td>'
      +'<td style="text-align:right;white-space:nowrap">'
        +(p.status==='Hold'?'<button class="ttl-op" title="Issue ticket" onclick="ttlIssue(\''+p.id+'\')">🎫</button>':'')
        +(p.status==='Hold'?'<button class="ttl-op" title="Extend TTL +1 day" onclick="ttlExtend(\''+p.id+'\')">⏱</button>':'')
        +'<button class="ttl-op" title="Delete" onclick="ttlDel(\''+p.id+'\')">🗑</button></td></tr>';
  }).join('')||'<tr><td colspan="8" style="text-align:center;color:var(--text3);padding:24px">No PNRs. Import from Flight Booking.</td></tr>';

  var qrows=DB.queue.map(function(q){
    return '<tr><td class="mono">'+esc(q.pnr)+'</td><td>'+esc(q.seg)+'</td><td><span class="ttl-code">'+esc(q.code)+'</span></td><td>'+esc(q.note)+'</td>'
      +'<td style="text-align:right"><button class="erp-btn btn-sm btn-ghost" onclick="ttlRelease(\''+q.id+'\')">Release segment</button></td></tr>';
  }).join('')||'<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:18px">Queue clean ✓</td></tr>';

  r.innerHTML=''
   +'<div class="ttl-kpis">'
     +'<div class="ttl-kpi"><div class="l">⏳ Holds</div><div class="v">'+holds.length+'</div></div>'
     +'<div class="ttl-kpi"><div class="l">🟠 Expiring &lt;24h</div><div class="v" style="color:#d97706">'+expSoon+'</div></div>'
     +'<div class="ttl-kpi"><div class="l">🔴 Expired (penalty risk)</div><div class="v" style="color:#dc2626">'+expired+'</div></div>'
     +'<div class="ttl-kpi"><div class="l">💸 Value at Risk</div><div class="v" style="font-size:19px">'+money(atRisk)+'</div></div>'
   +'</div>'
   +'<div class="ttl-card ttl-pad"><div class="ttl-h">⏱ Ticketing Time Limits (TTL) <button class="erp-btn btn-sm btn-ghost" style="margin-left:auto" onclick="ttlImport()">⤓ Import holds from Flight Booking</button></div>'
     +'<table class="ttl-tbl"><thead><tr><th>PNR</th><th>Passenger</th><th>Airline</th><th>Route</th><th>TTL (deadline)</th><th>Countdown</th><th>Amount</th><th style="text-align:right">Action</th></tr></thead><tbody>'+rows+'</tbody></table>'
     +'<div style="font-size:11.5px;color:var(--text3);margin-top:8px">⚠️ Un-ticketed segments past TTL incur airline penalties (≈ €50 econ / €125 business) and ADM risk. Issue or release before the deadline.</div></div>'
   +'<div class="ttl-card ttl-pad"><div class="ttl-h">📡 PNR Queue Health — inactive segments to action</div>'
     +'<table class="ttl-tbl"><thead><tr><th>PNR</th><th>Segment</th><th>Status</th><th>Note</th><th style="text-align:right">Action</th></tr></thead><tbody>'+qrows+'</tbody></table></div>';
}

window.ttlImport=function(){var n=0;try{var bk=JSON.parse(localStorage.getItem('epal_tv_fbk')||'[]');
  bk.forEach(function(b){ if(b.ticketStatus==='Unissued' && !DB.pnrs.some(function(p){return p.pnr===b.pnr;})){
    DB.pnrs.unshift({id:uid('H'),pnr:b.pnr,pax:(b.pax&&b.pax[0]?b.pax[0].name:'')+(b.pax&&b.pax.length>1?' +'+(b.pax.length-1):''),airline:b.airline,route:b.from+'-'+b.to,ttl:plus(2,0),status:'Hold',amount:(b.fare*b.pax.length)+(b.taxes*b.pax.length)}); n++; }});
  }catch(e){}
  save();render();alert(n?('Imported '+n+' held PNR(s) from Flight Booking with a default 48h TTL.'):'No new un-issued holds found in Flight Booking.');};
window.ttlIssue=function(id){var p=DB.pnrs.find(function(x){return x.id===id;});if(p){p.status='Ticketed';save();render();}};
window.ttlExtend=function(id){var p=DB.pnrs.find(function(x){return x.id===id;});if(p){var d=new Date(p.ttl);d.setDate(d.getDate()+1);p.ttl=d.toISOString().slice(0,16);save();render();}};
window.ttlDel=function(id){if(!confirm('Remove this PNR from the tracker?'))return;DB.pnrs=DB.pnrs.filter(function(x){return x.id!==id;});save();render();};
window.ttlRelease=function(id){DB.queue=DB.queue.filter(function(x){return x.id!==id;});save();render();};

function injectCss(){if(document.getElementById('ttl-css'))return;var s=document.createElement('style');s.id='ttl-css';var P='#erp-panel-tv-ttl ';
  s.textContent=''
  +P+'.ttl-kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;margin-bottom:16px}'
  +P+'.ttl-kpi{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:13px 15px;box-shadow:var(--shadow)}'
  +P+'.ttl-kpi .l{font-size:11.5px;color:var(--text2)}'+P+'.ttl-kpi .v{font-size:22px;font-weight:700;margin-top:4px;font-family:"DM Mono",monospace}'
  +P+'.ttl-card{background:var(--bg2);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow);overflow:hidden;margin-bottom:16px}'
  +P+'.ttl-pad{padding:15px 17px}'+P+'.ttl-h{font-size:13.5px;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}'
  +P+'.ttl-tbl{width:100%;border-collapse:collapse;font-size:13px}'
  +P+'.ttl-tbl th{text-align:left;color:var(--text2);font-weight:600;font-size:10.5px;text-transform:uppercase;letter-spacing:.4px;padding:10px 12px;border-bottom:1px solid var(--border);background:var(--bg3);white-space:nowrap}'
  +P+'.ttl-tbl td{padding:9px 12px;border-bottom:1px solid var(--border);vertical-align:middle}'+P+'.mono{font-family:"DM Mono",monospace;font-size:12px}'
  +P+'.ttl-pill{display:inline-block;font-size:10.5px;font-weight:700;color:#fff;padding:2px 9px;border-radius:20px}'
  +P+'.ttl-code{font-size:11px;font-weight:800;background:#fef2f2;color:#dc2626;padding:1px 7px;border-radius:5px}'
  +P+'.ttl-op{border:0;background:none;cursor:pointer;font-size:14px;padding:3px 6px;border-radius:6px}'+P+'.ttl-op:hover{background:var(--bg3)}';
  document.head.appendChild(s);
}
function boot(){var r=root();if(r){render();}else{document.addEventListener('DOMContentLoaded',render);}}
boot();
})();
