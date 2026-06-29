/* FEATURE (native, additive): Dynamic Markup Engine · New
   Smart pricing — suggests markup per booking from lead time, season, demand
   & segment instead of a flat %. Calculator + editable rule band.
   #tv-markup-root. localStorage epal_tv_markup. */
(function(){"use strict";
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];});}
function money(n){return '৳ '+Math.round(Number(n||0)).toLocaleString('en-IN');}
function rd(k){try{var r=localStorage.getItem(k);return r?JSON.parse(r):null;}catch(e){}return null;}
var LS='epal_tv_markup';
function load(){return rd(LS)||{base:8,calc:{cost:48000,lead:21,season:'Normal',demand:'Medium',seg:'Leisure'}};}
function save(){try{localStorage.setItem(LS,JSON.stringify(M));}catch(e){}}
var M=load();
function suggest(c){var m=+M.base||8;
  m+= (c.lead<7?4:c.lead<21?2:c.lead>60?-1:0);                 // urgency
  m+= ({Peak:4,Normal:0,Low:-2})[c.season]||0;
  m+= ({High:3,Medium:0,Low:-2})[c.demand]||0;
  m+= ({Corporate:-2,Leisure:0,VIP:3,'Last-minute':5})[c.seg]||0;
  return Math.max(2,Math.round(m*10)/10);
}
function root(){return document.getElementById('tv-markup-root');}
function opt(arr,sel){return arr.map(function(o){return '<option'+(o===sel?' selected':'')+'>'+o+'</option>';}).join('');}
function render(){var r=root();if(!r)return;injectCss();var c=M.calc;var mk=suggest(c);var sale=Math.round((+c.cost||0)*(1+mk/100));var profit=sale-(+c.cost||0);
  r.innerHTML='<div class="mk-two">'
    +'<div class="mk-card mk-pad"><div class="mk-h">🎚 Smart Markup Calculator</div><div class="mk-grid">'
      +'<div class="mk-f"><label>Net cost (৳)</label><input id="mk-cost" type="number" value="'+esc(c.cost)+'" oninput="tvMkSet()"></div>'
      +'<div class="mk-f"><label>Lead time (days)</label><input id="mk-lead" type="number" value="'+esc(c.lead)+'" oninput="tvMkSet()"></div>'
      +'<div class="mk-f"><label>Season</label><select id="mk-season" onchange="tvMkSet()">'+opt(['Peak','Normal','Low'],c.season)+'</select></div>'
      +'<div class="mk-f"><label>Demand</label><select id="mk-demand" onchange="tvMkSet()">'+opt(['High','Medium','Low'],c.demand)+'</select></div>'
      +'<div class="mk-f"><label>Segment</label><select id="mk-seg" onchange="tvMkSet()">'+opt(['Leisure','Corporate','VIP','Last-minute'],c.seg)+'</select></div>'
      +'<div class="mk-f"><label>Base markup (%)</label><input id="mk-base" type="number" value="'+esc(M.base)+'" oninput="tvMkSet()"></div>'
    +'</div></div>'
    +'<div class="mk-card mk-pad"><div class="mk-h">💡 Recommendation</div>'
      +'<div class="mk-big">'+mk+'%</div><div class="mk-sub">suggested markup</div>'
      +'<div class="mk-row"><span>Net cost</span><span>'+money(c.cost)+'</span></div>'
      +'<div class="mk-row"><span>Suggested sale price</span><span><b>'+money(sale)+'</b></span></div>'
      +'<div class="mk-row"><span style="color:#16a34a">Profit / booking</span><span style="color:#16a34a"><b>'+money(profit)+'</b></span></div>'
      +'<div style="font-size:11px;color:var(--text3);margin-top:8px">Adjusts for urgency, season, demand &amp; segment vs your flat base.</div></div>'
    +'</div>'
    +'<div class="mk-card mk-pad"><div class="mk-h">📋 Rule reference</div><table class="mk-tbl"><thead><tr><th>Factor</th><th>Condition</th><th>Markup adj.</th></tr></thead><tbody>'
      +'<tr><td>Urgency</td><td>&lt;7d / &lt;21d / &gt;60d</td><td>+4 / +2 / −1</td></tr>'
      +'<tr><td>Season</td><td>Peak / Low</td><td>+4 / −2</td></tr>'
      +'<tr><td>Demand</td><td>High / Low</td><td>+3 / −2</td></tr>'
      +'<tr><td>Segment</td><td>VIP / Last-minute / Corporate</td><td>+3 / +5 / −2</td></tr>'
    +'</tbody></table></div>';
}
window.tvMkSet=function(){var g=function(id){var e=document.getElementById(id);return e?e.value:'';};M.base=+g('mk-base')||8;M.calc={cost:+g('mk-cost')||0,lead:+g('mk-lead')||0,season:g('mk-season'),demand:g('mk-demand'),seg:g('mk-seg')};save();render();};
function injectCss(){if(document.getElementById('mk-css'))return;var s=document.createElement('style');s.id='mk-css';var P='#erp-panel-tv-markup ';
  s.textContent=P+'.mk-two{display:grid;grid-template-columns:1.3fr 1fr;gap:14px;margin-bottom:14px}'+'@media(max-width:900px){'+P+'.mk-two{grid-template-columns:1fr}}'
  +P+'.mk-card{background:var(--bg2);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow);overflow:hidden;margin-bottom:14px}'+P+'.mk-pad{padding:15px 17px}'+P+'.mk-h{font-size:13.5px;font-weight:700;margin-bottom:12px}'
  +P+'.mk-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}'+P+'.mk-f label{display:block;font-size:11.5px;color:var(--text2);margin-bottom:5px;font-weight:600}'+P+'.mk-f input,'+P+'.mk-f select{width:100%;box-sizing:border-box;border:1px solid var(--border2,#d0d6e8);background:var(--bg);border-radius:9px;padding:9px 11px;font-size:13px;font-family:inherit;color:var(--text);outline:none}'
  +P+'.mk-big{font-size:40px;font-weight:800;color:var(--accent);font-family:"DM Mono",monospace}'+P+'.mk-sub{font-size:12px;color:var(--text3);margin-bottom:12px}'
  +P+'.mk-row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px dashed var(--border);font-size:13px}'
  +P+'.mk-tbl{width:100%;border-collapse:collapse;font-size:13px}'+P+'.mk-tbl th{text-align:left;color:var(--text2);font-weight:600;font-size:10.5px;text-transform:uppercase;padding:9px 11px;border-bottom:1px solid var(--border);background:var(--bg3)}'+P+'.mk-tbl td{padding:8px 11px;border-bottom:1px solid var(--border)}';
  document.head.appendChild(s);}
function boot(){var r=root();if(r){render();}else{document.addEventListener('DOMContentLoaded',render);}}boot();
})();
