/* ════════════════════════════════════════════════════════════════════
   FEATURE (native, additive): Refund Lifecycle Tracker  ·  New
   Track every refund end-to-end: Requested → Filed with airline → Received
   from airline → Paid to customer (or Rejected). Computes airline refund −
   penalty − service fee = customer payout, and agency retention.
   Renders into #tv-ref-root. localStorage epal_tv_refunds. Additive.
   ════════════════════════════════════════════════════════════════════ */
(function(){
"use strict";
var LS='epal_tv_refunds';
var STAGES=['Requested','Filed','Received','Paid','Rejected'];
var SC={Requested:'#94a3b8',Filed:'#2563eb',Received:'#d97706',Paid:'#16a34a',Rejected:'#dc2626'};
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];});}
function money(n){return '৳ '+Number(n||0).toLocaleString('en-IN');}
function uid(){return 'RF-'+String(Date.now()).slice(-5)+Math.floor(Math.random()*90+10);}
function stamp(){return new Date().toISOString().slice(0,10);}
function load(){try{var r=localStorage.getItem(LS);if(r)return JSON.parse(r);}catch(e){}return seed();}
function save(){try{localStorage.setItem(LS,JSON.stringify(ROWS));}catch(e){}}
function seed(){return [
  {id:'RF-5001',pnr:'EK7K2P',customer:'Rahim Enterprise',airline:'Emirates',ticket:'176-2401110011',gross:56000,airlineRefund:48000,penalty:6000,fee:2000,status:'Filed',date:'2026-06-25'},
  {id:'RF-5002',pnr:'SV9Q4L',customer:'Nadia Sultana',airline:'Saudia',ticket:'065-2401110024',gross:69000,airlineRefund:60000,penalty:7000,fee:2000,status:'Received',date:'2026-06-22'},
  {id:'RF-5003',pnr:'MH3X8R',customer:'GreenLand Tours',airline:'Malaysia Airlines',ticket:'232-2401110088',gross:46000,airlineRefund:0,penalty:0,fee:0,status:'Requested',date:'2026-06-28'},
  {id:'RF-5004',pnr:'BG2M6C',customer:'Kamal Hossain',airline:'Biman',ticket:'997-2401110102',gross:9000,airlineRefund:8000,penalty:1000,fee:500,status:'Paid',date:'2026-06-18'}
];}
var ROWS=load();
var flt='';
function payout(r){return Math.max(0,(+r.airlineRefund||0)-(+r.penalty||0)-(+r.fee||0));}  // to customer
function retain(r){return (+r.fee||0);}  // agency keeps service fee
function root(){return document.getElementById('tv-ref-root');}
function render(){var r=root();if(!r)return;injectCss();
  var pending=ROWS.filter(function(x){return ['Requested','Filed'].indexOf(x.status)>=0;}).length;
  var awaiting=ROWS.filter(function(x){return x.status==='Filed';}).reduce(function(a,x){return a+(+x.airlineRefund||0);},0);
  var toPay=ROWS.filter(function(x){return x.status==='Received';}).reduce(function(a,x){return a+payout(x);},0);
  var retained=ROWS.filter(function(x){return ['Received','Paid'].indexOf(x.status)>=0;}).reduce(function(a,x){return a+retain(x);},0);
  var rows=ROWS.filter(function(x){return !flt||x.status===flt;}).map(function(x){
    return '<tr><td class="mono">'+esc(x.id)+'</td><td class="mono">'+esc(x.pnr||'—')+'</td><td><strong>'+esc(x.customer)+'</strong></td><td>'+esc(x.airline)+'</td>'
      +'<td>'+money(x.gross)+'</td><td>'+money(x.airlineRefund)+'</td><td style="color:#dc2626">'+money(x.penalty)+'</td><td>'+money(x.fee)+'</td>'
      +'<td><strong>'+money(payout(x))+'</strong></td>'
      +'<td><span class="ref-pill" style="background:'+(SC[x.status]||'#94a3b8')+'">'+esc(x.status)+'</span></td>'
      +'<td style="text-align:right;white-space:nowrap">'+nextBtn(x)+'<button class="ref-op" title="Reject" onclick="refSet(\''+x.id+'\',\'Rejected\')">✕</button><button class="ref-op" title="Delete" onclick="refDel(\''+x.id+'\')">🗑</button></td></tr>';
  }).join('')||'<tr><td colspan="11" style="text-align:center;color:var(--text3);padding:24px">No refunds.</td></tr>';
  var chip=function(v,l){return '<button class="ref-chip'+(flt===v?' on':'')+'" onclick="refFilter(\''+v+'\')">'+l+'</button>';};
  r.innerHTML=''
   +'<div class="ref-kpis">'
     +'<div class="ref-kpi"><div class="l">⏳ In Progress</div><div class="v">'+pending+'</div></div>'
     +'<div class="ref-kpi"><div class="l">🏦 Awaiting from Airline</div><div class="v" style="font-size:19px;color:#d97706">'+money(awaiting)+'</div></div>'
     +'<div class="ref-kpi"><div class="l">💸 To Pay Customer</div><div class="v" style="font-size:19px;color:#dc2626">'+money(toPay)+'</div></div>'
     +'<div class="ref-kpi"><div class="l">💰 Service Fee Retained</div><div class="v" style="font-size:19px;color:#16a34a">'+money(retained)+'</div></div>'
   +'</div>'
   +'<div class="ref-card ref-pad"><div class="ref-h">➕ New Refund Request</div><div class="ref-add">'
     +'<input id="ref-pnr" placeholder="PNR" style="width:100px"><input id="ref-cust" placeholder="Customer *" style="flex:1;min-width:140px">'
     +'<input id="ref-air" placeholder="Airline" style="width:130px"><input id="ref-gross" type="number" placeholder="Ticket ৳ *" style="width:110px">'
     +'<input id="ref-fee" type="number" placeholder="Service fee ৳" style="width:120px"><button class="erp-btn btn-primary" onclick="refAdd()">Create</button></div>'
     +'<div style="font-size:11.5px;color:var(--text3);margin-top:9px">Pipeline: Requested → Filed with airline → Received → Paid to customer. Use ▶ to advance.</div></div>'
   +'<div class="ref-card ref-pad"><div class="ref-h">↩️ Refunds <span class="ref-chips">'+chip('','All')+STAGES.map(function(s){return chip(s,s);}).join('')+'</span></div>'
     +'<table class="ref-tbl"><thead><tr><th>Ref</th><th>PNR</th><th>Customer</th><th>Airline</th><th>Ticket ৳</th><th>Airline Refund</th><th>Penalty</th><th>Svc Fee</th><th>Payout</th><th>Status</th><th style="text-align:right">Action</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}
function nextBtn(x){var i=STAGES.indexOf(x.status);if(x.status==='Rejected'||x.status==='Paid')return '';var nx=STAGES[i+1];if(!nx||nx==='Rejected')return '';
  return '<button class="ref-op" title="Advance to '+nx+'" onclick="refAdvance(\''+x.id+'\')">▶</button>';}

window.refFilter=function(v){flt=v;render();};
window.refAdd=function(){var g=function(id){var e=document.getElementById(id);return e?e.value:'';};var gross=+g('ref-gross')||0;if(!g('ref-cust').trim()||!gross){alert('Customer and ticket amount required.');return;}
  ROWS.unshift({id:uid(),pnr:g('ref-pnr').trim(),customer:g('ref-cust').trim(),airline:g('ref-air').trim()||'—',ticket:'',gross:gross,airlineRefund:0,penalty:0,fee:+g('ref-fee')||0,status:'Requested',date:stamp()});save();render();};
window.refAdvance=function(id){var x=ROWS.find(function(z){return z.id===id;});if(!x)return;var i=STAGES.indexOf(x.status);var nx=STAGES[i+1];
  if(nx==='Received'){var ar=prompt('Refund amount received from airline (৳):',String(x.gross-x.penalty));if(ar===null)return;x.airlineRefund=+ar||0;
    var pen=prompt('Airline penalty / cancellation fee (৳):',String(x.penalty||0));if(pen!==null)x.penalty=+pen||0;}
  x.status=nx;save();render();};
window.refSet=function(id,s){var x=ROWS.find(function(z){return z.id===id;});if(x){x.status=s;save();render();}};
window.refDel=function(id){if(!confirm('Delete this refund?'))return;ROWS=ROWS.filter(function(z){return z.id!==id;});save();render();};

function injectCss(){if(document.getElementById('ref-css'))return;var s=document.createElement('style');s.id='ref-css';var P='#erp-panel-tv-refunds ';
  s.textContent=''
  +P+'.ref-kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-bottom:16px}'
  +P+'.ref-kpi{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:13px 15px;box-shadow:var(--shadow)}'
  +P+'.ref-kpi .l{font-size:11.5px;color:var(--text2)}'+P+'.ref-kpi .v{font-size:22px;font-weight:700;margin-top:4px;font-family:"DM Mono",monospace}'
  +P+'.ref-card{background:var(--bg2);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow);overflow:hidden;margin-bottom:16px}'
  +P+'.ref-pad{padding:15px 17px}'+P+'.ref-h{font-size:13.5px;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}'
  +P+'.ref-chips{display:inline-flex;gap:6px;flex-wrap:wrap;margin-left:auto}'
  +P+'.ref-chip{border:1px solid var(--border2,#d0d6e8);background:var(--bg2);border-radius:20px;padding:4px 11px;font-size:11px;cursor:pointer;font-family:inherit;color:var(--text2)}'
  +P+'.ref-chip.on{background:var(--accent);border-color:var(--accent);color:#fff;font-weight:600}'
  +P+'.ref-add{display:flex;gap:9px;flex-wrap:wrap}'
  +P+'.ref-add input{border:1px solid var(--border2,#d0d6e8);background:var(--bg);border-radius:9px;padding:9px 11px;font-size:13px;font-family:inherit;color:var(--text);outline:none}'
  +P+'.ref-tbl{width:100%;border-collapse:collapse;font-size:12.5px}'
  +P+'.ref-tbl th{text-align:left;color:var(--text2);font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:.3px;padding:9px 10px;border-bottom:1px solid var(--border);background:var(--bg3);white-space:nowrap}'
  +P+'.ref-tbl td{padding:8px 10px;border-bottom:1px solid var(--border);vertical-align:middle}'+P+'.mono{font-family:"DM Mono",monospace;font-size:11.5px}'
  +P+'.ref-pill{display:inline-block;font-size:10px;font-weight:700;color:#fff;padding:2px 8px;border-radius:20px}'
  +P+'.ref-op{border:0;background:none;cursor:pointer;font-size:13px;padding:3px 5px;border-radius:6px}'+P+'.ref-op:hover{background:var(--bg3)}';
  document.head.appendChild(s);
}
function boot(){var r=root();if(r){render();}else{document.addEventListener('DOMContentLoaded',render);}}
boot();
})();
