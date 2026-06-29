/* FEATURE (native, additive): Document-Expiry Revenue Radar · New
   Scans customer passports/visas for upcoming expiry and turns them into a
   timed renewal-outreach pipeline (auto WhatsApp drip). #tv-docradar-root.
   localStorage epal_tv_docradar. */
(function(){"use strict";
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];});}
function money(n){return '৳ '+Math.round(Number(n||0)).toLocaleString('en-IN');}
function rd(k){try{var r=localStorage.getItem(k);return r?JSON.parse(r):null;}catch(e){}return null;}
var LS='epal_tv_docradar';
function plus(d){var x=new Date();x.setDate(x.getDate()+d);return x.toISOString().slice(0,10);}
function load(){var r=rd(LS);if(r)return r;return [
 {id:'D1',name:'Abdul Karim',type:'Passport',no:'BX0451234',phone:'+8801711000001',expiry:plus(48),status:'Not started'},
 {id:'D2',name:'Sharmin Akter',type:'Passport',no:'BX0987654',phone:'+8801711000002',expiry:plus(-12),status:'Not started'},
 {id:'D3',name:'Tanvir Ahmed',type:'Visa (UAE)',no:'UAE-22931',phone:'+8801711000003',expiry:plus(22),status:'Reminded'},
 {id:'D4',name:'Rumana Begum',type:'Passport',no:'BX0555666',phone:'+8801711000004',expiry:plus(83),status:'Not started'},
 {id:'D5',name:'Jamal Uddin',type:'Visa (KSA)',no:'KSA-77881',phone:'+8801711000005',expiry:plus(15),status:'Not started'}];}
function save(){try{localStorage.setItem(LS,JSON.stringify(ROWS));}catch(e){}}
var ROWS=load();
function days(d){var x=new Date(d);x.setHours(0,0,0,0);var n=new Date();n.setHours(0,0,0,0);return Math.round((x-n)/86400000);}
function root(){return document.getElementById('tv-docradar-root');}
function render(){var r=root();if(!r)return;injectCss();
  ROWS.sort(function(a,b){return days(a.expiry)-days(b.expiry);});
  var exp=ROWS.filter(function(x){return days(x.expiry)<0;}).length,d30=ROWS.filter(function(x){var n=days(x.expiry);return n>=0&&n<=30;}).length,d90=ROWS.filter(function(x){var n=days(x.expiry);return n>30&&n<=90;}).length;
  var rows=ROWS.map(function(x){var n=days(x.expiry);var cls=n<0?'#dc2626':n<=30?'#dc2626':n<=60?'#d97706':n<=90?'#2563eb':'#16a34a';var txt=n<0?'Expired '+(-n)+'d':n+'d left';
    return '<tr><td><strong>'+esc(x.name)+'</strong><div style="font-size:11px;color:var(--text3)">'+esc(x.phone)+'</div></td><td>'+esc(x.type)+'</td><td class="mono">'+esc(x.no)+'</td><td class="mono">'+esc(x.expiry)+'</td>'
     +'<td><span class="dr-pill" style="background:'+cls+'">'+txt+'</span></td>'
     +'<td><span class="dr-st">'+esc(x.status)+'</span></td>'
     +'<td style="text-align:right;white-space:nowrap"><button class="dr-op" title="Send WhatsApp reminder" onclick="tvDrRemind(\''+x.id+'\')">📲</button><button class="dr-op" title="Book renewal" onclick="tvDrBook(\''+x.id+'\')">✓</button></td></tr>';}).join('');
  r.innerHTML='<div class="dr-kpis"><div class="dr-kpi"><div class="l">🔴 Expired</div><div class="v" style="color:#dc2626">'+exp+'</div></div>'
    +'<div class="dr-kpi"><div class="l">🟠 ≤30 days</div><div class="v" style="color:#d97706">'+d30+'</div></div>'
    +'<div class="dr-kpi"><div class="l">🔵 31–90 days</div><div class="v" style="color:#2563eb">'+d90+'</div></div>'
    +'<div class="dr-kpi" style="display:flex;align-items:center;justify-content:center"><button class="erp-btn btn-primary" onclick="tvDrBlast()">📡 Auto-drip all due</button></div></div>'
    +'<div class="dr-card"><table class="dr-tbl"><thead><tr><th>Customer</th><th>Document</th><th>No</th><th>Expiry</th><th>Countdown</th><th>Outreach</th><th style="text-align:right">Action</th></tr></thead><tbody>'+rows+'</tbody></table></div>'
    +'<div style="font-size:11.5px;color:var(--text3);margin-top:8px">Each expiry is a renewal sale. Auto-drip sends a timed WhatsApp sequence at 90/60/30 days.</div>';
}
window.tvDrRemind=function(id){var x=ROWS.find(function(z){return z.id===id;});if(x){x.status='Reminded';save();render();alert('📲 WhatsApp reminder sent to '+x.name+' ('+x.phone+') about '+x.type+' expiry on '+x.expiry+'.');}};
window.tvDrBook=function(id){var x=ROWS.find(function(z){return z.id===id;});if(x){x.status='Renewal booked';save();render();}};
window.tvDrBlast=function(){var n=0;ROWS.forEach(function(x){if(days(x.expiry)<=90&&x.status==='Not started'){x.status='Reminded';n++;}});save();render();alert('📡 Auto-drip queued for '+n+' customer(s) with documents expiring ≤90 days.');};
function injectCss(){if(document.getElementById('dr-css'))return;var s=document.createElement('style');s.id='dr-css';var P='#erp-panel-tv-docradar ';
  s.textContent=P+'.dr-kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:16px}'+P+'.dr-kpi{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:13px 15px;box-shadow:var(--shadow)}'+P+'.dr-kpi .l{font-size:11.5px;color:var(--text2)}'+P+'.dr-kpi .v{font-size:23px;font-weight:700;margin-top:4px;font-family:"DM Mono",monospace}'
  +P+'.dr-card{background:var(--bg2);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow);overflow:hidden}'+P+'.dr-tbl{width:100%;border-collapse:collapse;font-size:12.5px}'+P+'.dr-tbl th{text-align:left;color:var(--text2);font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:.3px;padding:9px 12px;border-bottom:1px solid var(--border);background:var(--bg3);white-space:nowrap}'+P+'.dr-tbl td{padding:9px 12px;border-bottom:1px solid var(--border);vertical-align:middle}'+P+'.mono{font-family:"DM Mono",monospace;font-size:12px}'
  +P+'.dr-pill{display:inline-block;font-size:10.5px;font-weight:700;color:#fff;padding:2px 9px;border-radius:20px}'+P+'.dr-st{font-size:11.5px;color:var(--text2)}'+P+'.dr-op{border:0;background:none;cursor:pointer;font-size:14px;padding:3px 6px;border-radius:6px}'+P+'.dr-op:hover{background:var(--bg3)}';
  document.head.appendChild(s);}
function boot(){var r=root();if(r){render();}else{document.addEventListener('DOMContentLoaded',render);}}boot();
})();
