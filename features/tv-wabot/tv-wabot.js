/* FEATURE (native, additive): WhatsApp Conversational Booking Bot · New
   Customer texts a route ("DAC-DXB 12 Jul 2 pax"); the bot auto-replies with
   live-style fares and a one-tap quote, dropping a draft booking into the ERP.
   #tv-wabot-root. (Chat is simulated for the prototype.) */
(function(){"use strict";
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];});}
function money(n){return '৳ '+Math.round(Number(n||0)).toLocaleString('en-IN');}
var AIR=[['Emirates','EK'],['Qatar Airways','QR'],['Biman','BG'],['US-Bangla','BS'],['Saudia','SV']];
var msgs=[{by:'bot',t:'👋 Assalamu Alaikum! I\'m Epal Travels assistant. Send a route like "DAC-DXB 12 Jul 2 pax" for instant fares.'},
  {by:'cust',t:'DAC-DXB 12 Jul 2 pax'},{by:'bot',t:'__fares__',q:{from:'DAC',to:'DXB',pax:2}}];
function root(){return document.getElementById('tv-wabot-root');}
function fareCard(q){var base={DXB:48000,JED:62000,KUL:39000,DOH:51000,RUH:57000}[q.to]||45000;
  var opts=AIR.slice(0,3).map(function(a,i){var f=Math.round(base*(0.9+i*0.12)/100)*100;return {airline:a[0],code:a[1],fare:f,total:f*q.pax};});
  return '<div class="wa-fares"><div style="font-size:11.5px;color:var(--text2);margin-bottom:6px">✈️ '+q.from+' → '+q.to+' · '+q.pax+' pax · cheapest first:</div>'
    +opts.map(function(o){return '<div class="wa-fare"><span><b>'+o.code+'</b> '+esc(o.airline)+'</span><span class="mono">'+money(o.total)+'</span><button class="wa-bk" onclick="tvWaBook(\''+o.code+'\','+o.total+')">Book</button></div>';}).join('')+'</div>';}
function render(){var r=root();if(!r)return;injectCss();
  var thread=msgs.map(function(m){if(m.t==='__fares__')return '<div class="wa-msg bot">'+fareCard(m.q)+'</div>';return '<div class="wa-msg '+(m.by==='bot'?'bot':'cust')+'">'+esc(m.t)+'</div>';}).join('');
  r.innerHTML='<div class="wa-kpis"><div class="wa-kpi"><div class="l">💬 Conversations today</div><div class="v">17</div></div>'
    +'<div class="wa-kpi"><div class="l">⚡ Auto-quotes sent</div><div class="v">41</div></div>'
    +'<div class="wa-kpi"><div class="l">🎫 Chat→booking rate</div><div class="v">34%</div></div></div>'
    +'<div class="wa-phone"><div class="wa-top">🟢 Epal Travels Bot · WhatsApp Business</div><div class="wa-body" id="wa-body">'+thread+'</div>'
    +'<div class="wa-input"><input id="wa-in" placeholder=\'Try: DAC-JED 20 Jul 1 pax\' onkeydown="if(event.key===\'Enter\')tvWaSend()"><button class="erp-btn btn-primary btn-sm" onclick="tvWaSend()">Send</button></div></div>'
    +'<div style="font-size:11.5px;color:var(--text3);margin-top:8px">Bot parses the route &amp; replies with fares instantly. "Book" drops a draft booking into Flight Booking.</div>';
  var b=document.getElementById('wa-body');if(b)b.scrollTop=b.scrollHeight;
}
window.tvWaSend=function(){var i=document.getElementById('wa-in');if(!i||!i.value.trim())return;var txt=i.value.trim();msgs.push({by:'cust',t:txt});
  var m=txt.toUpperCase().match(/([A-Z]{3})\s*[-> ]+\s*([A-Z]{3})/);var pax=(txt.match(/(\d+)\s*pax/i)||[])[1]||1;
  if(m){msgs.push({by:'bot',t:'Here are live fares 👇'});msgs.push({t:'__fares__',q:{from:m[1],to:m[2],pax:+pax}});}
  else {msgs.push({by:'bot',t:'Please send a route like "DAC-DXB 12 Jul 2 pax" and I\'ll fetch fares. 🙂'});}
  render();};
window.tvWaBook=function(code,total){msgs.push({by:'bot',t:'✅ Draft booking created on '+code+' for '+money(total)+'. An agent will confirm & issue. (PNR pending)'});render();
  alert('🎫 Draft booking pushed to Flight Booking\nAirline '+code+' · '+money(total)+'\n(Mock) Appears as an un-issued hold for an agent to confirm.');};
function injectCss(){if(document.getElementById('wa-css'))return;var s=document.createElement('style');s.id='wa-css';var P='#erp-panel-tv-wabot ';
  s.textContent=P+'.wa-kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-bottom:16px}'+P+'.wa-kpi{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:13px 15px;box-shadow:var(--shadow)}'+P+'.wa-kpi .l{font-size:11.5px;color:var(--text2)}'+P+'.wa-kpi .v{font-size:23px;font-weight:700;margin-top:4px}'
  +P+'.wa-phone{max-width:460px;border:1px solid var(--border);border-radius:16px;overflow:hidden;box-shadow:var(--shadow2,var(--shadow));background:#e5ddd5}'
  +'[data-theme="dark"] '+P+'.wa-phone{background:#0b141a}'
  +P+'.wa-top{background:#075e54;color:#fff;padding:11px 15px;font-size:13px;font-weight:600}'
  +P+'.wa-body{height:360px;overflow-y:auto;padding:14px}'
  +P+'.wa-msg{max-width:80%;padding:8px 11px;border-radius:10px;font-size:13px;margin-bottom:9px;line-height:1.4;box-shadow:0 1px 1px rgba(0,0,0,.1)}'
  +P+'.wa-msg.bot{background:#fff;color:#111}'+P+'.wa-msg.cust{background:#dcf8c6;color:#111;margin-left:auto}'
  +'[data-theme="dark"] '+P+'.wa-msg.bot{background:#202c33;color:#e9edef}'+'[data-theme="dark"] '+P+'.wa-msg.cust{background:#005c4b;color:#e9edef}'
  +P+'.wa-fares{font-size:12.5px}'+P+'.wa-fare{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px dashed rgba(0,0,0,.12)}'+P+'.wa-fare span:first-child{flex:1}'
  +P+'.wa-bk{border:0;background:#075e54;color:#fff;border-radius:6px;padding:3px 10px;font-size:11px;cursor:pointer}'
  +P+'.wa-input{display:flex;gap:8px;padding:10px;background:var(--bg2);border-top:1px solid var(--border)}'+P+'.wa-input input{flex:1;border:1px solid var(--border2,#d0d6e8);border-radius:20px;padding:9px 14px;font-size:13px;font-family:inherit;outline:none;background:var(--bg)}'
  +P+'.mono{font-family:"DM Mono",monospace}';
  document.head.appendChild(s);}
function boot(){var r=root();if(r){render();}else{document.addEventListener('DOMContentLoaded',render);}}boot();
})();
