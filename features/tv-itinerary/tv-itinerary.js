/* FEATURE (native, additive): Living Itinerary Concierge · New
   One shareable link per trip that self-updates: flight status, check-in
   window, weather, visa reminders, and (for Umrah) prayer times + ziyarah.
   Cuts "where/when" support calls. #tv-itin-root. localStorage epal_tv_itinerary. */
(function(){"use strict";
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];});}
function rd(k){try{var r=localStorage.getItem(k);return r?JSON.parse(r):null;}catch(e){}return null;}
var LS='epal_tv_itinerary';
function load(){return rd(LS)||[
 {id:'IT-1',customer:'Abdul Karim (Umrah grp)',trip:'Dhaka → Jeddah · Umrah 10N',umrah:true,flight:'SV805',status:'On time',gate:'A7',checkin:'2026-07-19 18:30',dest:'Jeddah',temp:'38°C clear'},
 {id:'IT-2',customer:'Rahim Enterprise',trip:'Dhaka → Dubai · 4N',umrah:false,flight:'EK585',status:'Delayed 40m',gate:'B3',checkin:'2026-07-10 06:10',dest:'Dubai',temp:'41°C sunny'}];}
function save(){try{localStorage.setItem(LS,JSON.stringify(ROWS));}catch(e){}}
var ROWS=load(),cur=ROWS[0]&&ROWS[0].id;
function root(){return document.getElementById('tv-itin-root');}
function living(it){
  var rows=[
    ['✈️','Flight '+it.flight,it.status+' · Gate '+it.gate,it.status.indexOf('Delay')>=0?'#d97706':'#16a34a'],
    ['🧳','Online check-in opens',it.checkin,'#2563eb'],
    ['🌤','Weather at '+it.dest,it.temp,'#0d9488'],
    ['🛂','Visa reminder','Carry printed visa + return ticket','#7c3aed']
  ];
  if(it.umrah){rows.push(['🕌','Prayer times (Makkah)','Fajr 4:42 · Dhuhr 12:26 · Asr 15:48 · Maghrib 19:02 · Isha 20:32','#16a34a']);
    rows.push(['🕋','Ziyarah schedule','Day 3: Madinah · Day 6: historical sites','#b45309']);}
  return rows.map(function(r){return '<div class="it-live"><span class="it-ic" style="background:'+r[3]+'">'+r[0]+'</span><div><div class="it-t">'+esc(r[1])+'</div><div class="it-d">'+esc(r[2])+'</div></div></div>';}).join('');
}
function render(){var r=root();if(!r)return;injectCss();var it=ROWS.find(function(x){return x.id===cur;})||ROWS[0];
  var list=ROWS.map(function(x){return '<div class="it-row'+(x.id===cur?' on':'')+'" onclick="tvItOpen(\''+x.id+'\')"><div><div class="it-cust">'+esc(x.customer)+'</div><div class="it-trip">'+esc(x.trip)+'</div></div>'+(x.umrah?'<span class="it-badge">Umrah</span>':'')+'</div>';}).join('');
  r.innerHTML='<div class="it-two"><div class="it-card it-pad"><div class="it-h">🧭 Itineraries</div>'+list
    +'<button class="erp-btn btn-sm btn-ghost" style="margin-top:10px;width:100%" onclick="tvItNew()">＋ New itinerary</button></div>'
    +'<div class="it-card it-pad"><div class="it-h" style="display:flex;align-items:center;gap:8px">📱 Living Itinerary <span style="margin-left:auto"><button class="erp-btn btn-sm btn-ghost" onclick="tvItRefresh()">↻ Refresh</button> <button class="erp-btn btn-sm btn-primary" onclick="tvItShare()">🔗 Copy link</button></span></div>'
      +'<div class="it-trip-h">'+esc(it.customer)+'<div style="font-size:12px;color:var(--text3);font-weight:400">'+esc(it.trip)+'</div></div>'+living(it)
      +'<div style="font-size:11px;color:var(--text3);margin-top:10px">Auto-updates from flight-status, weather &amp; visa feeds — the traveller always sees the latest, so they stop calling.</div></div></div>';
}
window.tvItOpen=function(id){cur=id;render();};
window.tvItRefresh=function(){var it=ROWS.find(function(x){return x.id===cur;});if(it){var opts=['On time','Delayed 25m','Boarding','Gate change → '+['C2','D4','A9'][Math.floor(Math.random()*3)]];it.status=opts[Math.floor(Math.random()*opts.length)];save();render();}};
window.tvItShare=function(){var it=ROWS.find(function(x){return x.id===cur;});alert('🔗 Share link copied (mock)\n\nhttps://epaltravels.live/i/'+it.id+'\n\nThe traveller opens this and sees a self-updating itinerary — no app needed.');};
window.tvItNew=function(){var cu=prompt('Customer / group name:');if(!cu)return;var tr=prompt('Trip (e.g. Dhaka → Dubai · 4N):','Dhaka → Dubai · 4N')||'';ROWS.unshift({id:'IT-'+Date.now().toString().slice(-5),customer:cu,trip:tr,umrah:/umrah|hajj/i.test(cu+tr),flight:'XX000',status:'On time',gate:'TBA',checkin:'TBA',dest:'—',temp:'—'});cur=ROWS[0].id;save();render();};
function injectCss(){if(document.getElementById('it-css'))return;var s=document.createElement('style');s.id='it-css';var P='#erp-panel-tv-itinerary ';
  s.textContent=P+'.it-two{display:grid;grid-template-columns:.9fr 1.4fr;gap:14px}'+'@media(max-width:900px){'+P+'.it-two{grid-template-columns:1fr}}'
  +P+'.it-card{background:var(--bg2);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow)}'+P+'.it-pad{padding:15px 17px}'+P+'.it-h{font-size:13.5px;font-weight:700;margin-bottom:12px}'
  +P+'.it-row{display:flex;align-items:center;gap:8px;padding:10px;border:1px solid var(--border);border-radius:10px;margin-bottom:8px;cursor:pointer}'+P+'.it-row.on{border-color:var(--accent);background:var(--accent-light,#eff6ff)}'
  +P+'.it-cust{font-size:13px;font-weight:700}'+P+'.it-trip{font-size:11.5px;color:var(--text3)}'+P+'.it-badge{margin-left:auto;font-size:10px;font-weight:700;background:#16a34a;color:#fff;padding:2px 8px;border-radius:20px}'
  +P+'.it-trip-h{font-size:15px;font-weight:700;margin-bottom:12px}'
  +P+'.it-live{display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px dashed var(--border)}'+P+'.it-ic{width:34px;height:34px;border-radius:9px;color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}'
  +P+'.it-t{font-size:13px;font-weight:600}'+P+'.it-d{font-size:12px;color:var(--text2);margin-top:2px}';
  document.head.appendChild(s);}
function boot(){var r=root();if(r){render();}else{document.addEventListener('DOMContentLoaded',render);}}boot();
})();
