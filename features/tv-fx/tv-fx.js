/* ════════════════════════════════════════════════════════════════════
   FEATURE (native, additive): Currency / FX Rates  ·  New
   Vendor costs come in USD/AED/SAR; this is the single source of FX rates
   (base BDT) used across quotes & settlements, plus a quick converter.
   Renders into #tv-fx-root. localStorage epal_tv_fx. Additive.
   ════════════════════════════════════════════════════════════════════ */
(function(){
"use strict";
var LS='epal_tv_fx';
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];});}
function load(){try{var r=localStorage.getItem(LS);if(r)return JSON.parse(r);}catch(e){}return seed();}
function save(){try{localStorage.setItem(LS,JSON.stringify(DB));}catch(e){}}
function seed(){return {base:'BDT',updated:'2026-06-29 09:00',rates:[
  {code:'USD',name:'US Dollar',rate:118.50},{code:'AED',name:'UAE Dirham',rate:32.27},{code:'SAR',name:'Saudi Riyal',rate:31.60},
  {code:'EUR',name:'Euro',rate:127.80},{code:'GBP',name:'British Pound',rate:150.20},{code:'MYR',name:'Malaysian Ringgit',rate:25.10},
  {code:'INR',name:'Indian Rupee',rate:1.42},{code:'QAR',name:'Qatari Riyal',rate:32.55},{code:'SGD',name:'Singapore Dollar',rate:87.90}
]};}
var DB=load();
var conv={amt:100,from:'USD',to:'BDT'};
function rateOf(code){if(code==='BDT')return 1;var r=DB.rates.find(function(x){return x.code===code;});return r?+r.rate:1;}
function convert(amt,from,to){var bdt=(+amt||0)*rateOf(from);return bdt/rateOf(to);}
function root(){return document.getElementById('tv-fx-root');}
function render(){var r=root();if(!r)return;injectCss();
  var allCodes=['BDT'].concat(DB.rates.map(function(x){return x.code;}));
  var rows=DB.rates.map(function(x){
    return '<tr><td class="mono"><strong>'+esc(x.code)+'</strong></td><td>'+esc(x.name)+'</td>'
      +'<td>1 '+esc(x.code)+' = <strong>'+(+x.rate).toFixed(2)+'</strong> '+esc(DB.base)+'</td>'
      +'<td>1 '+esc(DB.base)+' = '+(1/(+x.rate)).toFixed(4)+' '+esc(x.code)+'</td>'
      +'<td style="text-align:right"><button class="fx-op" title="Edit rate" onclick="fxEdit(\''+x.code+'\')">✏️</button></td></tr>';
  }).join('');
  var res=convert(conv.amt,conv.from,conv.to);
  r.innerHTML=''
   +'<div class="fx-two">'
     +'<div class="fx-card fx-pad"><div class="fx-h">💱 Quick Converter</div>'
       +'<div class="fx-conv"><input id="fx-amt" type="number" value="'+esc(conv.amt)+'" oninput="fxSet(\'amt\',this.value)">'
       +'<select id="fx-from" onchange="fxSet(\'from\',this.value)">'+allCodes.map(function(c){return '<option'+(c===conv.from?' selected':'')+'>'+c+'</option>';}).join('')+'</select>'
       +'<span class="fx-eq">→</span>'
       +'<select id="fx-to" onchange="fxSet(\'to\',this.value)">'+allCodes.map(function(c){return '<option'+(c===conv.to?' selected':'')+'>'+c+'</option>';}).join('')+'</select></div>'
       +'<div class="fx-result">'+(+conv.amt||0).toLocaleString('en-IN')+' '+esc(conv.from)+' = <strong>'+res.toLocaleString('en-IN',{maximumFractionDigits:2})+'</strong> '+esc(conv.to)+'</div></div>'
     +'<div class="fx-card fx-pad"><div class="fx-h">ℹ️ Base &amp; Update</div>'
       +'<div style="font-size:13px;color:var(--text2);line-height:1.9">Base currency: <strong>'+esc(DB.base)+'</strong><br>Last updated: '+esc(DB.updated)+'<br>Tracked currencies: '+DB.rates.length+'</div>'
       +'<button class="erp-btn btn-sm btn-ghost" style="margin-top:10px" onclick="fxSync()">⟳ Refresh rates (mock feed)</button>'
       +'<button class="erp-btn btn-sm btn-ghost" style="margin-top:10px" onclick="fxAdd()">＋ Add currency</button></div>'
   +'</div>'
   +'<div class="fx-card"><table class="fx-tbl"><thead><tr><th>Code</th><th>Currency</th><th>Buy (to '+esc(DB.base)+')</th><th>Inverse</th><th style="text-align:right">Edit</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}
window.fxSet=function(k,v){conv[k]=(k==='amt')?v:v;var res=document.querySelector('#erp-panel-tv-fx .fx-result');if(k==='amt'&&res){res.innerHTML=(+v||0).toLocaleString('en-IN')+' '+esc(conv.from)+' = <strong>'+convert(v,conv.from,conv.to).toLocaleString('en-IN',{maximumFractionDigits:2})+'</strong> '+esc(conv.to);}else if(k!=='amt'){render();}};
window.fxEdit=function(code){var x=DB.rates.find(function(z){return z.code===code;});if(!x)return;var v=prompt('1 '+code+' = ? '+DB.base,x.rate);if(v===null)return;x.rate=+v||x.rate;DB.updated=new Date().toISOString().slice(0,16).replace('T',' ');save();render();};
window.fxAdd=function(){var c=prompt('Currency code (e.g. THB):');if(!c)return;var n=prompt('Currency name:','')||c;var rt=prompt('1 '+c.toUpperCase()+' = ? '+DB.base,'1');DB.rates.push({code:c.toUpperCase().slice(0,3),name:n,rate:+rt||1});save();render();};
window.fxSync=function(){DB.rates.forEach(function(x){x.rate=+(x.rate*(0.99+Math.random()*0.02)).toFixed(2);});DB.updated=new Date().toISOString().slice(0,16).replace('T',' ');save();render();};

function injectCss(){if(document.getElementById('fx-css'))return;var s=document.createElement('style');s.id='fx-css';var P='#erp-panel-tv-fx ';
  s.textContent=''
  +P+'.fx-two{display:grid;grid-template-columns:1.3fr 1fr;gap:14px;margin-bottom:14px}'
  +'@media(max-width:900px){'+P+'.fx-two{grid-template-columns:1fr}}'
  +P+'.fx-card{background:var(--bg2);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow);overflow:hidden;margin-bottom:14px}'
  +P+'.fx-pad{padding:15px 17px}'+P+'.fx-h{font-size:13.5px;font-weight:700;margin-bottom:12px}'
  +P+'.fx-conv{display:flex;gap:9px;align-items:center;flex-wrap:wrap}'
  +P+'.fx-conv input,'+P+'.fx-conv select{border:1px solid var(--border2,#d0d6e8);background:var(--bg);border-radius:9px;padding:10px 12px;font-size:14px;font-family:inherit;color:var(--text);outline:none}'
  +P+'.fx-conv input{width:130px}'+P+'.fx-eq{font-size:18px;color:var(--text3)}'
  +P+'.fx-result{margin-top:14px;padding:13px 15px;background:var(--accent-light,#eff6ff);border-radius:10px;font-size:15px;color:var(--text)}'
  +P+'.fx-tbl{width:100%;border-collapse:collapse;font-size:13px}'
  +P+'.fx-tbl th{text-align:left;color:var(--text2);font-weight:600;font-size:10.5px;text-transform:uppercase;letter-spacing:.4px;padding:10px 12px;border-bottom:1px solid var(--border);background:var(--bg3)}'
  +P+'.fx-tbl td{padding:9px 12px;border-bottom:1px solid var(--border)}'+P+'.mono{font-family:"DM Mono",monospace}'
  +P+'.fx-op{border:0;background:none;cursor:pointer;font-size:13px;padding:3px 6px;border-radius:6px}'+P+'.fx-op:hover{background:var(--bg3)}';
  document.head.appendChild(s);
}
function boot(){var r=root();if(r){render();}else{document.addEventListener('DOMContentLoaded',render);}}
boot();
})();
