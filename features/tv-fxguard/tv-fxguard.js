/* FEATURE (native, additive): FX Exposure Guard · New
   Flags bookings bought in foreign currency (USD/SAR/AED) but sold in BDT,
   computes currency exposure using live FX rates, and suggests a buffer so a
   taka swing doesn't erase margin. #tv-fxguard-root. localStorage epal_tv_fxguard. */
(function(){"use strict";
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];});}
function money(n){return '৳ '+Math.round(Number(n||0)).toLocaleString('en-IN');}
function rd(k){try{var r=localStorage.getItem(k);return r?JSON.parse(r):null;}catch(e){}return null;}
var LS='epal_tv_fxguard';
function rate(code){var fx=rd('epal_tv_fx');if(fx&&fx.rates){var r=fx.rates.find(function(x){return x.code===code;});if(r)return +r.rate;}return ({USD:118.5,SAR:31.6,AED:32.27,EUR:127.8})[code]||1;}
function load(){return rd(LS)||[
 {id:'X1',vendor:'Dubai Holidays Ltd',cur:'AED',fcy:8000,rateAt:31.9,soldBDT:280000},
 {id:'X2',vendor:'Al-Haramain Agency',cur:'SAR',fcy:14000,rateAt:31.2,soldBDT:470000},
 {id:'X3',vendor:'Sabre (portal)',cur:'USD',fcy:3200,rateAt:117.0,soldBDT:400000}];}
function save(){try{localStorage.setItem(LS,JSON.stringify(ROWS));}catch(e){}}
var ROWS=load(),buffer=2; // % buffer
function root(){return document.getElementById('tv-fxguard-root');}
function render(){var r=root();if(!r)return;injectCss();
  var totalExp=0;
  var rows=ROWS.map(function(x){var now=rate(x.cur);var costAt=x.fcy*x.rateAt;var costNow=x.fcy*now;var exposure=costNow-costAt;totalExp+=exposure;
    var marginNow=x.soldBDT-costNow;var sugg=Math.ceil(x.fcy*now*(1+buffer/100)/100)*100;
    return '<tr><td><strong>'+esc(x.vendor)+'</strong></td><td><span class="fg-cur">'+esc(x.cur)+'</span> '+x.fcy.toLocaleString()+'</td>'
     +'<td>@'+x.rateAt.toFixed(2)+' → '+money(costAt)+'</td><td>@'+now.toFixed(2)+' → '+money(costNow)+'</td>'
     +'<td style="color:'+(exposure>0?'#dc2626':'#16a34a')+'">'+(exposure>0?'+':'')+money(exposure)+'</td>'
     +'<td style="color:'+(marginNow<0?'#dc2626':'#16a34a')+'">'+money(marginNow)+'</td>'
     +'<td><strong>'+money(sugg)+'</strong></td>'
     +'<td style="text-align:right"><button class="fg-op" title="Lock at current rate" onclick="tvFgLock(\''+x.id+'\')">🔒</button></td></tr>';}).join('');
  r.innerHTML='<div class="fg-kpis"><div class="fg-kpi"><div class="l">🛟 Total FX exposure</div><div class="v" style="color:'+(totalExp>0?'#dc2626':'#16a34a')+'">'+(totalExp>0?'+':'')+money(totalExp)+'</div><div class="s">vs rate at booking</div></div>'
    +'<div class="fg-kpi"><div class="l">📦 Foreign-cost bookings</div><div class="v">'+ROWS.length+'</div></div>'
    +'<div class="fg-kpi"><div class="l">🧮 Safety buffer</div><div class="v"><input id="fg-buf" type="number" value="'+buffer+'" style="width:60px;font-size:18px;border:1px solid var(--border2,#d0d6e8);border-radius:8px;padding:4px 8px" oninput="tvFgBuf(this.value)">%</div></div></div>'
    +'<div class="fg-card"><table class="fg-tbl"><thead><tr><th>Vendor</th><th>Foreign cost</th><th>Cost @ booking</th><th>Cost @ today</th><th>Exposure</th><th>Margin (today)</th><th>Suggested lock ৳</th><th style="text-align:right"></th></tr></thead><tbody>'+rows+'</tbody></table></div>'
    +'<div style="font-size:11.5px;color:var(--text3);margin-top:8px">Positive exposure = the taka weakened and the cost rose since booking. Lock or add the buffer to protect margin. Rates from Currency / FX.</div>';
}
window.tvFgBuf=function(v){buffer=+v||0;var r=root();// light re-render
  render();var i=document.getElementById('fg-buf');if(i){i.focus();i.value=buffer;}};
window.tvFgLock=function(id){var x=ROWS.find(function(z){return z.id===id;});if(!x)return;x.rateAt=rate(x.cur);save();render();alert('🔒 Rate locked for '+x.vendor+' at '+x.rateAt.toFixed(2)+' '+x.cur+'/BDT — exposure reset.');};
function injectCss(){if(document.getElementById('fg-css'))return;var s=document.createElement('style');s.id='fg-css';var P='#erp-panel-tv-fxguard ';
  s.textContent=P+'.fg-kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px;margin-bottom:16px}'+P+'.fg-kpi{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:13px 15px;box-shadow:var(--shadow)}'+P+'.fg-kpi .l{font-size:11.5px;color:var(--text2)}'+P+'.fg-kpi .v{font-size:22px;font-weight:700;margin-top:4px;font-family:"DM Mono",monospace}'+P+'.fg-kpi .s{font-size:10.5px;color:var(--text3)}'
  +P+'.fg-card{background:var(--bg2);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow);overflow:auto}'+P+'.fg-tbl{width:100%;border-collapse:collapse;font-size:12.5px}'+P+'.fg-tbl th{text-align:left;color:var(--text2);font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:.3px;padding:9px 11px;border-bottom:1px solid var(--border);background:var(--bg3);white-space:nowrap}'+P+'.fg-tbl td{padding:9px 11px;border-bottom:1px solid var(--border);vertical-align:middle}'
  +P+'.fg-cur{font-size:10.5px;font-weight:700;background:var(--bg3);padding:1px 6px;border-radius:5px}'+P+'.fg-op{border:0;background:none;cursor:pointer;font-size:14px;padding:3px 6px;border-radius:6px}'+P+'.fg-op:hover{background:var(--bg3)}';
  document.head.appendChild(s);}
function boot(){var r=root();if(r){render();}else{document.addEventListener('DOMContentLoaded',render);}}boot();
})();
