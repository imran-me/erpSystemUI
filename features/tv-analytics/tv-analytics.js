/* ════════════════════════════════════════════════════════════════════
   FEATURE (native, additive): Travel Analytics / MIS  ·  New
   Rolls up the live data from every Travel module (flight bookings, quotes,
   commission, accounts, hotels, refunds) into the metrics famous agencies
   track: GMV, Average Booking Value, Gross Margin %, Net Take Rate,
   commission realisation, payables, and top airlines / routes / products.
   Renders into #tv-mis-root. Read-only (computed). Additive.
   ════════════════════════════════════════════════════════════════════ */
(function(){
"use strict";
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];});}
function money(n){return '৳ '+Math.round(Number(n||0)).toLocaleString('en-IN');}
function rd(k){try{var r=localStorage.getItem(k);return r?JSON.parse(r):null;}catch(e){return null;}}
function root(){return document.getElementById('tv-mis-root');}

function compute(){
  var fbk=rd('epal_tv_fbk')||[];
  var quotes=rd('epal_tv_quotations')||[];
  var comm=rd('epal_tv_commission')||[];
  var acc=rd('epal_tv_accounts')||[];
  var htl=rd('epal_tv_hotels')||[];
  var refs=rd('epal_tv_refunds')||[];

  var flightSales=fbk.reduce(function(a,b){var ad=(b.addons||[]).reduce(function(s,x){return s+(+x.price||0)*(+x.qty||1);},0);return a+(b.fare*b.pax.length)+(b.taxes*b.pax.length)+ad;},0);
  var hotelSales=htl.reduce(function(a,b){return a+(+b.amount||0);},0);
  var gmv=flightSales+hotelSales;
  var bookings=fbk.length+htl.length;
  var abv=bookings?gmv/bookings:0;

  // gross margin from quotations (they carry cost & sale)
  var qRev=0,qProfit=0;
  quotes.forEach(function(q){(q.items||[]).forEach(function(it){qRev+=(+it.qty||0)*(+it.sale||0);qProfit+=(+it.qty||0)*((+it.sale||0)-(+it.cost||0));});qProfit-=(+q.discount||0);});
  var gm=qRev?(qProfit/qRev*100):0;

  var commExp=comm.reduce(function(a,x){return a+Math.round((+x.sales||0)*((+x.rate||0)/100));},0);
  var commRec=comm.reduce(function(a,x){return a+(+x.received||0);},0);
  var takeRate=gmv?(commRec/gmv*100):0;

  var payable=acc.reduce(function(a,p){var c=(+p.opening||0)+(p.txns||[]).reduce(function(s,t){var d=['Invoice / Purchase','ADM (Debit Memo)','Service Charge'].indexOf(t.kind)>=0;return s+(d?(+t.amount||0):-(+t.amount||0));},0);return a+(c>0?c:0);},0);
  var refundsOpen=refs.filter(function(r){return ['Requested','Filed','Received'].indexOf(r.status)>=0;}).length;

  // top airlines / routes (flight bookings)
  var air={},rt={};
  fbk.forEach(function(b){air[b.airline]=(air[b.airline]||0)+1;var r=b.from+' → '+b.to;rt[r]=(rt[r]||0)+1;});
  var prod=[['Flights',flightSales],['Hotels & Packages',hotelSales],['Quotations (pipeline)',quotes.reduce(function(a,q){var s=(q.items||[]).reduce(function(z,it){return z+(+it.qty||0)*(+it.sale||0);},0);return a+s;},0)]];

  return {gmv:gmv,bookings:bookings,abv:abv,gm:gm,commExp:commExp,commRec:commRec,takeRate:takeRate,payable:payable,refundsOpen:refundsOpen,
    topAir:topList(air),topRoute:topList(rt),prod:prod,flightCount:fbk.length};
}
function topList(o){return Object.keys(o).map(function(k){return [k,o[k]];}).sort(function(a,b){return b[1]-a[1];}).slice(0,6);}
function bars(list,unit){if(!list.length)return '<div style="color:var(--text3);font-size:12.5px">No data yet.</div>';var max=Math.max.apply(null,list.map(function(x){return x[1];}))||1;
  return list.map(function(x){var pct=Math.round(x[1]/max*100);return '<div class="mis-bar"><span class="mis-bl">'+esc(x[0])+'</span><span class="mis-bt"><span class="mis-bf" style="width:'+pct+'%"></span></span><span class="mis-bv">'+(unit==='money'?money(x[1]):x[1])+'</span></div>';}).join('');}

function render(){var r=root();if(!r)return;injectCss();var m=compute();
  r.innerHTML=''
   +'<div class="mis-kpis">'
     +kpi('🛒 GMV (sales value)',money(m.gmv),'flights + hotels')
     +kpi('🎫 Bookings',m.bookings,m.flightCount+' flights')
     +kpi('💵 Avg Booking Value',money(m.abv),'GMV / bookings')
     +kpi('📊 Gross Margin %',m.gm.toFixed(1)+'%','from quotations')
     +kpi('💼 Commission Realised',money(m.commRec),'of '+money(m.commExp)+' expected')
     +kpi('🪙 Net Take Rate',m.takeRate.toFixed(1)+'%','commission / GMV')
     +kpi('🔴 Total Payable',money(m.payable),'to vendors/agents')
     +kpi('↩️ Open Refunds',m.refundsOpen,'in pipeline')
   +'</div>'
   +'<div class="mis-two">'
     +'<div class="mis-card"><div class="mis-h">✈️ Top Airlines (by bookings)</div>'+bars(m.topAir,'count')+'</div>'
     +'<div class="mis-card"><div class="mis-h">🗺 Top Routes (by bookings)</div>'+bars(m.topRoute,'count')+'</div>'
   +'</div>'
   +'<div class="mis-card"><div class="mis-h">💰 Sales by Product</div>'+bars(m.prod,'money')+'</div>'
   +'<div style="font-size:11.5px;color:var(--text3);margin-top:6px">Live — computed from Flight Booking, Quotation, Commission, Accounts, Hotels &amp; Refunds data. <button class="erp-btn btn-sm btn-ghost" onclick="misRefresh()">↻ Refresh</button></div>';
}
function kpi(l,v,s){return '<div class="mis-kpi"><div class="l">'+l+'</div><div class="v">'+v+'</div><div class="s">'+esc(s)+'</div></div>';}
window.misRefresh=function(){render();};

function injectCss(){if(document.getElementById('mis-css'))return;var s=document.createElement('style');s.id='mis-css';var P='#erp-panel-tv-analytics ';
  s.textContent=''
  +P+'.mis-kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px;margin-bottom:16px}'
  +P+'.mis-kpi{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px 16px;box-shadow:var(--shadow)}'
  +P+'.mis-kpi .l{font-size:11.5px;color:var(--text2)}'+P+'.mis-kpi .v{font-size:23px;font-weight:700;margin-top:4px;font-family:"DM Mono",monospace}'+P+'.mis-kpi .s{font-size:10.5px;color:var(--text3);margin-top:2px}'
  +P+'.mis-two{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}'
  +'@media(max-width:900px){'+P+'.mis-two{grid-template-columns:1fr}}'
  +P+'.mis-card{background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:15px 17px;box-shadow:var(--shadow);margin-bottom:14px}'
  +P+'.mis-h{font-size:13.5px;font-weight:700;margin-bottom:13px}'
  +P+'.mis-bar{display:flex;align-items:center;gap:10px;margin-bottom:9px;font-size:12.5px}'
  +P+'.mis-bl{width:150px;flex-shrink:0;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
  +P+'.mis-bt{flex:1;height:12px;background:var(--bg3);border-radius:8px;overflow:hidden}'
  +P+'.mis-bf{display:block;height:100%;background:linear-gradient(90deg,#2563eb,#7c3aed);border-radius:8px}'
  +P+'.mis-bv{width:110px;text-align:right;font-family:"DM Mono",monospace;font-size:12px;flex-shrink:0}';
  document.head.appendChild(s);
}
function boot(){var r=root();if(r){render();}else{document.addEventListener('DOMContentLoaded',render);}}
boot();
})();
