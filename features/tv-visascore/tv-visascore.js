/* FEATURE (native, additive): Visa Approval Probability Predictor · New
   Scores a visa application's approval odds BEFORE submission (country,
   profile, financials, docs, travel history) and lists the weak points to
   fix. #tv-visascore-root. localStorage epal_tv_visascore. */
(function(){"use strict";
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];});}
function rd(k){try{var r=localStorage.getItem(k);return r?JSON.parse(r):null;}catch(e){}return null;}
var LS='epal_tv_visascore';
var COUNTRY={Malaysia:78,UAE:74,'Saudi Arabia':80,Qatar:72,Singapore:60,Schengen:48,UK:42,Canada:40,India:70,Thailand:82};
function load(){return rd(LS)||{country:'Schengen',type:'Tourist',funds:'Adequate',history:'First-time',docs:80,job:'Salaried',age:32};}
function save(){try{localStorage.setItem(LS,JSON.stringify(F));}catch(e){}}
var F=load();
function score(f){var s=COUNTRY[f.country]||60;
  s+= ({Adequate:8,Strong:16,Weak:-18})[f.funds]||0;
  s+= ({'First-time':-6,'Some travel':6,'Frequent traveller':16})[f.history]||0;
  s+= Math.round(((+f.docs||0)-80)/2);
  s+= ({Salaried:6,'Business owner':8,Student:-4,Unemployed:-20})[f.job]||0;
  s+= (f.type==='Tourist'?0:f.type==='Business'?5:f.type==='Work'?3:f.type==='Student'?2:0);
  return Math.max(3,Math.min(97,Math.round(s)));
}
function risks(f){var r=[];if((COUNTRY[f.country]||60)<55)r.push('High-rejection destination ('+f.country+') — strengthen every other factor');
  if(f.funds==='Weak')r.push('Weak financials — add 6-month bank statement / sponsor letter');
  if(f.history==='First-time')r.push('No travel history — consider an easier visa first to build profile');
  if((+f.docs||0)<85)r.push('Document completeness '+f.docs+'% — close gaps before submitting');
  if(f.job==='Unemployed')r.push('No income proof — add sponsor / asset documents');
  if(!r.length)r.push('Strong profile — submit with confidence ✅');return r;}
function root(){return document.getElementById('tv-visascore-root');}
function opt(a,sel){return a.map(function(o){return '<option'+(o===sel?' selected':'')+'>'+o+'</option>';}).join('');}
function render(){var r=root();if(!r)return;injectCss();var sc=score(F);var band=sc>=70?'#16a34a':sc>=50?'#d97706':'#dc2626';var lbl=sc>=70?'Likely Approved':sc>=50?'Borderline':'High Risk';
  r.innerHTML='<div class="vs-two"><div class="vs-card vs-pad"><div class="vs-h">🎯 Application Inputs</div><div class="vs-grid">'
    +'<div class="vs-f"><label>Country</label><select id="vs-country" onchange="tvVsSet()">'+opt(Object.keys(COUNTRY),F.country)+'</select></div>'
    +'<div class="vs-f"><label>Visa Type</label><select id="vs-type" onchange="tvVsSet()">'+opt(['Tourist','Business','Work','Student','Family'],F.type)+'</select></div>'
    +'<div class="vs-f"><label>Financials</label><select id="vs-funds" onchange="tvVsSet()">'+opt(['Weak','Adequate','Strong'],F.funds)+'</select></div>'
    +'<div class="vs-f"><label>Travel history</label><select id="vs-history" onchange="tvVsSet()">'+opt(['First-time','Some travel','Frequent traveller'],F.history)+'</select></div>'
    +'<div class="vs-f"><label>Employment</label><select id="vs-job" onchange="tvVsSet()">'+opt(['Salaried','Business owner','Student','Unemployed'],F.job)+'</select></div>'
    +'<div class="vs-f"><label>Document completeness (%)</label><input id="vs-docs" type="number" min="0" max="100" value="'+esc(F.docs)+'" oninput="tvVsSet()"></div>'
    +'</div></div>'
    +'<div class="vs-card vs-pad" style="text-align:center"><div class="vs-h">Approval Probability</div>'
    +'<div class="vs-gauge" style="background:conic-gradient('+band+' '+(sc*3.6)+'deg,var(--bg3) 0)"><div class="vs-gin"><div class="vs-pct" style="color:'+band+'">'+sc+'%</div><div class="vs-lbl">'+lbl+'</div></div></div>'
    +'<button class="erp-btn btn-sm btn-ghost" style="margin-top:12px" onclick="tvVsSave()">💾 Attach to application</button></div></div>'
    +'<div class="vs-card vs-pad"><div class="vs-h">🔧 Weak points to fix before submitting</div>'+risks(F).map(function(x){return '<div class="vs-risk">'+(x.indexOf('Strong profile')>=0?'✅':'⚠️')+' '+esc(x)+'</div>';}).join('')+'</div>';
}
window.tvVsSet=function(){var g=function(id){var e=document.getElementById(id);return e?e.value:'';};F={country:g('vs-country'),type:g('vs-type'),funds:g('vs-funds'),history:g('vs-history'),job:g('vs-job'),docs:+g('vs-docs')||0};save();render();};
window.tvVsSave=function(){alert('💾 Probability '+score(F)+'% attached to the visa application.\n(Mock) Officers see the score + fix-list on the Visa board.');};
function injectCss(){if(document.getElementById('vs-css'))return;var s=document.createElement('style');s.id='vs-css';var P='#erp-panel-tv-visascore ';
  s.textContent=P+'.vs-two{display:grid;grid-template-columns:1.4fr 1fr;gap:14px;margin-bottom:14px}'+'@media(max-width:900px){'+P+'.vs-two{grid-template-columns:1fr}}'
  +P+'.vs-card{background:var(--bg2);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow);overflow:hidden;margin-bottom:14px}'+P+'.vs-pad{padding:15px 17px}'+P+'.vs-h{font-size:13.5px;font-weight:700;margin-bottom:12px}'
  +P+'.vs-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}'+P+'.vs-f label{display:block;font-size:11.5px;color:var(--text2);margin-bottom:5px;font-weight:600}'+P+'.vs-f input,'+P+'.vs-f select{width:100%;box-sizing:border-box;border:1px solid var(--border2,#d0d6e8);background:var(--bg);border-radius:9px;padding:9px 11px;font-size:13px;font-family:inherit;color:var(--text);outline:none}'
  +P+'.vs-gauge{width:150px;height:150px;border-radius:50%;margin:6px auto;display:flex;align-items:center;justify-content:center}'+P+'.vs-gin{width:116px;height:116px;border-radius:50%;background:var(--bg2);display:flex;flex-direction:column;align-items:center;justify-content:center}'
  +P+'.vs-pct{font-size:32px;font-weight:800;font-family:"DM Mono",monospace}'+P+'.vs-lbl{font-size:11.5px;color:var(--text2);font-weight:600}'
  +P+'.vs-risk{font-size:13px;padding:7px 0;border-bottom:1px dashed var(--border)}';
  document.head.appendChild(s);}
function boot(){var r=root();if(r){render();}else{document.addEventListener('DOMContentLoaded',render);}}boot();
})();
