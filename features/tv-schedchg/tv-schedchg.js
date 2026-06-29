/* FEATURE (native, additive): Schedule-Change Auto-Handler · New
   When an airline reschedules/cancels a segment, auto-computes the options
   (rebook / refund / reissue + cost diff) and drafts the customer message —
   one click instead of a manual fire-drill. #tv-schedchg-root. localStorage epal_tv_schedchg. */
(function(){"use strict";
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];});}
function money(n){return '৳ '+Math.round(Number(n||0)).toLocaleString('en-IN');}
function rd(k){try{var r=localStorage.getItem(k);return r?JSON.parse(r):null;}catch(e){}return null;}
var LS='epal_tv_schedchg';
function load(){return rd(LS)||[
 {id:'S1',pnr:'EK7K2P',customer:'Rahim Enterprise',flight:'EK585 DAC-DXB',change:'Departure moved 06:10 → 09:40 (same day)',sev:'Minor',options:[['Accept new time','No cost — confirm with pax',0],['Rebook earlier flight','Fare diff',3500],['Refund','Full refund (airline fault)',-56000]],status:'Open'},
 {id:'S2',pnr:'TK4420',customer:'GreenLand Tours',flight:'TK713 DAC-IST',change:'Flight CANCELLED by airline',sev:'Major',options:[['Reissue next day','No fare diff (involuntary)',0],['Reroute via DOH','Fare diff',7200],['Full refund','Involuntary — 100%',-184000]],status:'Open'},
 {id:'S3',pnr:'SQ8810',customer:'Blue Sky Corp',flight:'SQ447 DAC-SIN',change:'Aircraft change — seats reassigned',sev:'Minor',options:[['Re-select seats','Free',0],['Accept','No action',0]],status:'Open'}];}
function save(){try{localStorage.setItem(LS,JSON.stringify(ROWS));}catch(e){}}
var ROWS=load();
function root(){return document.getElementById('tv-schedchg-root');}
function render(){var r=root();if(!r)return;injectCss();var open=ROWS.filter(function(x){return x.status==='Open';});
  var cards=ROWS.map(function(x){var sevC=x.sev==='Major'?'#dc2626':'#d97706';
    return '<div class="sc-card"><div class="sc-top"><span class="sc-pill" style="background:'+sevC+'">'+x.sev+'</span><span class="mono"><b>'+esc(x.pnr)+'</b></span><span style="color:var(--text2)">'+esc(x.customer)+'</span>'+(x.status!=='Open'?'<span class="sc-done">✓ '+esc(x.status)+'</span>':'')+'</div>'
      +'<div class="sc-flight">✈️ '+esc(x.flight)+'</div><div class="sc-chg">⚠️ '+esc(x.change)+'</div>'
      +'<div class="sc-opts">'+x.options.map(function(o){return '<div class="sc-opt"><span>'+esc(o[0])+'<span class="sc-od">'+esc(o[1])+'</span></span><span class="mono" style="color:'+(o[2]>0?'#dc2626':o[2]<0?'#16a34a':'var(--text3)')+'">'+(o[2]===0?'—':(o[2]>0?'+':'')+money(o[2]))+'</span></div>';}).join('')+'</div>'
      +(x.status==='Open'?'<div class="sc-act"><button class="erp-btn btn-sm btn-primary" onclick="tvScDraft(\''+x.id+'\')">📲 Draft customer message</button><button class="erp-btn btn-sm btn-ghost" onclick="tvScResolve(\''+x.id+'\')">✓ Mark handled</button></div>':'')
      +'</div>';}).join('')||'<div style="text-align:center;color:var(--text3);padding:26px">No schedule changes pending ✓</div>';
  r.innerHTML='<div class="sc-kpis"><div class="sc-kpi"><div class="l">🔀 Open changes</div><div class="v">'+open.length+'</div></div>'
    +'<div class="sc-kpi"><div class="l">🔴 Major (cancel/reroute)</div><div class="v" style="color:#dc2626">'+open.filter(function(x){return x.sev==='Major';}).length+'</div></div>'
    +'<div class="sc-kpi" style="display:flex;align-items:center;justify-content:center"><button class="erp-btn btn-ghost" onclick="tvScSim()">＋ Simulate queue event</button></div></div>'+cards;
}
window.tvScDraft=function(id){var x=ROWS.find(function(z){return z.id===id;});if(!x)return;var best=x.options[0];
  alert('📲 Draft message to '+x.customer+' (PNR '+x.pnr+'):\n\n"Dear customer, your flight '+x.flight+' has a change: '+x.change+'. Recommended option: '+best[0]+' ('+best[1]+'). Reply YES to proceed or call us." \n\n(Mock) Sends via WhatsApp on confirm.');};
window.tvScResolve=function(id){var x=ROWS.find(function(z){return z.id===id;});if(x){x.status='Handled';save();render();}};
window.tvScSim=function(){var n=Math.floor(Math.random()*900+100);ROWS.unshift({id:'S'+Date.now().toString().slice(-4),pnr:'BG'+n,customer:'Walk-in customer',flight:'BG'+n+' DAC-CGP',change:'Time change +2h',sev:'Minor',options:[['Accept','No cost',0],['Refund','Involuntary',-9000]],status:'Open'});save();render();};
function injectCss(){if(document.getElementById('sc-css'))return;var s=document.createElement('style');s.id='sc-css';var P='#erp-panel-tv-schedchg ';
  s.textContent=P+'.sc-kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-bottom:16px}'+P+'.sc-kpi{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:13px 15px;box-shadow:var(--shadow)}'+P+'.sc-kpi .l{font-size:11.5px;color:var(--text2)}'+P+'.sc-kpi .v{font-size:22px;font-weight:700;margin-top:4px;font-family:"DM Mono",monospace}'
  +P+'.sc-card{background:var(--bg2);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow);padding:15px 17px;margin-bottom:13px}'
  +P+'.sc-top{display:flex;align-items:center;gap:10px;margin-bottom:9px;font-size:13px}'+P+'.sc-pill{font-size:10.5px;font-weight:700;color:#fff;padding:2px 9px;border-radius:20px}'+P+'.sc-done{margin-left:auto;color:#16a34a;font-weight:600;font-size:12px}'
  +P+'.sc-flight{font-size:14px;font-weight:600}'+P+'.sc-chg{font-size:12.5px;color:#d97706;margin:4px 0 11px}'
  +P+'.sc-opts{border-top:1px solid var(--border);padding-top:9px}'+P+'.sc-opt{display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-size:13px}'+P+'.sc-od{display:block;font-size:11px;color:var(--text3)}'
  +P+'.sc-act{display:flex;gap:8px;margin-top:11px}'+P+'.mono{font-family:"DM Mono",monospace}';
  document.head.appendChild(s);}
function boot(){var r=root();if(r){render();}else{document.addEventListener('DOMContentLoaded',render);}}boot();
})();
