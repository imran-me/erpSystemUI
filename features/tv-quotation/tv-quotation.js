/* ════════════════════════════════════════════════════════════════════
   FEATURE (native, additive): Travel Desk — Quotation Builder  ·  New
   New Travel module section. Renders into #tv-quote-root (panel
   erp-panel-tv-quotation in travel.html). Build multi-line quotes
   (flight + visa + hotel + transfer), live profit & VAT calc, save,
   and print a branded PDF. localStorage: epal_tv_quotations.
   Additive only — nothing existing is touched.
   ════════════════════════════════════════════════════════════════════ */
(function(){
"use strict";
var LS='epal_tv_quotations';
var TYPES=['Flight','Visa','Hotel','Transfer','Tour','Insurance','Other'];
var CUR=['৳','$','SAR','AED'];
var STATUS=['Draft','Sent','Accepted','Rejected'];
var SPILL={Draft:'#94a3b8',Sent:'#2563eb',Accepted:'#16a34a',Rejected:'#dc2626'};
/* pull the shared Other Services catalog so quotes can include add-on services */
function svcCatalog(){try{var r=localStorage.getItem('epal_tv_other_services');if(r){return JSON.parse(r).filter(function(s){return s.active;});}}catch(e){}
  return [{name:'Passport Processing',cat:'Passport',price:3000},{name:'Bank Statement / Solvency',cat:'Document',price:2000},{name:'Travel Insurance',cat:'Insurance',price:1500},{name:'Airport Transfer',cat:'Transfer',price:2000},{name:'Visa Attestation',cat:'Document',price:2500}];}
function svcType(cat){return ['Flight','Visa','Hotel','Transfer','Tour','Insurance'].indexOf(cat)>=0?cat:'Other';}

function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];});}
function uid(){return 'QT-'+String(Date.now()).slice(-5)+Math.floor(Math.random()*90+10);}
function load(){try{var r=localStorage.getItem(LS);if(r)return JSON.parse(r);}catch(e){}return seed();}
function save(){try{localStorage.setItem(LS,JSON.stringify(QUOTES));}catch(e){}}
function seed(){return [
  {id:'QT-4001',customer:'Rahim Enterprise',date:'2026-06-26',valid:'2026-07-10',currency:'৳',status:'Sent',discount:4000,tax:0,notes:'Fare valid 48h. Subject to availability.',
   items:[{type:'Flight',desc:'Dhaka → Dubai (DAC-DXB) · Emirates · Return',qty:2,cost:48000,sale:56000},{type:'Visa',desc:'UAE Tourist Visa · 30 days',qty:2,cost:9000,sale:14000}]},
  {id:'QT-4002',customer:'GreenLand Tours',date:'2026-06-27',valid:'2026-07-05',currency:'৳',status:'Draft',discount:0,tax:5,notes:'',
   items:[{type:'Flight',desc:'Dhaka → Kuala Lumpur (DAC-KUL) · Malaysia Airlines',qty:4,cost:39000,sale:46000},{type:'Hotel',desc:'KL 4★ · 3 nights · twin',qty:4,cost:12000,sale:16000}]}
];}
var QUOTES=load();

function money(n,cur){return (cur||'৳')+' '+Number(n||0).toLocaleString('en-IN');}
function lt(it){return (+it.qty||0)*(+it.sale||0);}
function lp(it){return (+it.qty||0)*((+it.sale||0)-(+it.cost||0));}
function calc(q){var sub=(q.items||[]).reduce(function(a,x){return a+lt(x);},0);
  var ip=(q.items||[]).reduce(function(a,x){return a+lp(x);},0);
  var disc=+q.discount||0; var taxable=Math.max(0,sub-disc); var tax=taxable*((+q.tax||0)/100);
  return {sub:sub,disc:disc,tax:tax,grand:taxable+tax,profit:ip-disc};}

var view='list', draft=null, editId=null;
function root(){return document.getElementById('tv-quote-root');}
function render(){ var r=root(); if(!r)return; if(view==='edit')editor(r); else list(r); }

function list(r){
  var tot=QUOTES.reduce(function(a,q){var c=calc(q);a.g+=c.grand;a.p+=c.profit;return a;},{g:0,p:0});
  var rows=QUOTES.map(function(q){var c=calc(q);
    return '<tr style="cursor:pointer" onclick="tvqEdit(\''+q.id+'\')">'
      +'<td class="mono">'+esc(q.id)+'</td><td><strong>'+esc(q.customer||'—')+'</strong></td>'
      +'<td>'+esc(q.date||'')+'</td><td>'+esc(q.valid||'')+'</td><td>'+(q.items||[]).length+'</td>'
      +'<td>'+money(c.grand,q.currency)+'</td><td style="color:#16a34a">'+money(c.profit,q.currency)+'</td>'
      +'<td><span class="tvq-pill" style="background:'+(SPILL[q.status]||'#94a3b8')+'">'+esc(q.status||'Draft')+'</span></td>'
      +'<td style="text-align:right;white-space:nowrap"><button class="tvq-ic" title="Print" onclick="event.stopPropagation();tvqPrint(\''+q.id+'\')">🖨</button>'
      +'<button class="tvq-ic" title="Delete" onclick="event.stopPropagation();tvqDel(\''+q.id+'\')">🗑</button></td></tr>';
  }).join('')||'<tr><td colspan="9" style="text-align:center;color:var(--text3);padding:30px;font-style:italic">No quotations yet. Click “＋ New Quotation”.</td></tr>';
  r.innerHTML=''
    +'<div class="tvq-kpis">'
      +'<div class="tvq-kpi"><div class="l">📄 Quotations</div><div class="v">'+QUOTES.length+'</div></div>'
      +'<div class="tvq-kpi"><div class="l">💰 Pipeline Value</div><div class="v" style="font-size:19px">'+money(tot.g)+'</div></div>'
      +'<div class="tvq-kpi"><div class="l">📈 Potential Profit</div><div class="v" style="font-size:19px;color:#16a34a">'+money(tot.p)+'</div></div>'
    +'</div>'
    +'<div class="tvq-card"><table class="tvq-tbl"><thead><tr><th>Quote #</th><th>Customer</th><th>Date</th><th>Valid Till</th><th>Items</th><th>Grand Total</th><th>Profit</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}

function opt(arr,sel){return arr.map(function(o){return '<option'+(String(o)===String(sel)?' selected':'')+'>'+esc(o)+'</option>';}).join('');}
function editor(r){ var q=draft;
  var rows=(q.items||[]).map(function(it,i){
    return '<tr data-li="'+i+'">'
      +'<td><select data-k="type">'+opt(TYPES,it.type)+'</select></td>'
      +'<td><input data-k="desc" value="'+esc(it.desc||'')+'" placeholder="Description" style="min-width:200px;width:100%"></td>'
      +'<td><input data-k="qty" type="number" min="0" value="'+esc(it.qty)+'" style="width:62px"></td>'
      +'<td><input data-k="cost" type="number" min="0" value="'+esc(it.cost)+'" style="width:92px"></td>'
      +'<td><input data-k="sale" type="number" min="0" value="'+esc(it.sale)+'" style="width:92px"></td>'
      +'<td class="mono tvq-lt">'+money(lt(it),q.currency)+'</td>'
      +'<td class="mono tvq-lp" style="color:#16a34a">'+money(lp(it),q.currency)+'</td>'
      +'<td style="text-align:right"><button class="tvq-ic" onclick="tvqDelItem('+i+')">🗑</button></td></tr>';
  }).join('')||'<tr><td colspan="8" style="text-align:center;color:var(--text3);padding:20px">No line items. Click “＋ Add line item”.</td></tr>';

  r.innerHTML=''
   +'<div id="tvq-editor">'
   +'<div style="display:flex;gap:10px;align-items:center;margin-bottom:14px"><button class="erp-btn btn-ghost" onclick="tvqBack()">← Back to list</button>'
     +'<span class="mono" style="color:var(--text3);font-size:13px">'+esc(q.id)+'</span></div>'
   +'<div class="tvq-card tvq-pad"><div class="tvq-h">🧾 Quotation Info</div><div class="tvq-grid">'
     +'<div class="tvq-f"><label>Customer <span class="req">*</span></label><input data-f="customer" value="'+esc(q.customer||'')+'" placeholder="Customer / company"></div>'
     +'<div class="tvq-f"><label>Status</label><select data-f="status">'+opt(STATUS,q.status)+'</select></div>'
     +'<div class="tvq-f"><label>Quote Date</label><input data-f="date" type="date" value="'+esc(q.date||'')+'"></div>'
     +'<div class="tvq-f"><label>Valid Till</label><input data-f="valid" type="date" value="'+esc(q.valid||'')+'"></div>'
     +'<div class="tvq-f"><label>Currency</label><select data-f="currency">'+opt(CUR,q.currency)+'</select></div>'
   +'</div></div>'
   +'<div class="tvq-card tvq-pad"><div class="tvq-h">📦 Line Items '
     +'<span style="margin-left:auto;display:flex;gap:7px;align-items:center;flex-wrap:wrap">'
       +'<select id="tvq-svc" style="border:1px solid var(--border2,#d0d6e8);background:var(--bg);border-radius:8px;padding:6px 9px;font-size:12px;font-family:inherit;max-width:230px">'+svcCatalog().map(function(s,i){return '<option value="'+i+'">'+esc(s.name)+' — '+money(s.price,q.currency)+'</option>';}).join('')+'</select>'
       +'<button class="erp-btn btn-sm btn-ghost" onclick="tvqAddSvc()">＋ Service</button>'
       +'<button class="erp-btn btn-sm" onclick="tvqAddItem()">＋ Add line item</button></span></div>'
     +'<table class="tvq-tbl"><thead><tr><th>Type</th><th>Description</th><th>Qty</th><th>Unit Cost</th><th>Unit Sale</th><th>Line Total</th><th>Profit</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>'
   +'<div class="tvq-two">'
     +'<div class="tvq-card tvq-pad"><div class="tvq-h">💸 Charges</div><div class="tvq-grid">'
       +'<div class="tvq-f"><label>Discount ('+esc(q.currency)+')</label><input data-f="discount" type="number" min="0" value="'+esc(q.discount||0)+'"></div>'
       +'<div class="tvq-f"><label>VAT / Tax (%)</label><input data-f="tax" type="number" min="0" value="'+esc(q.tax||0)+'"></div>'
       +'</div><div class="tvq-h" style="margin-top:12px">📝 Notes / Terms</div>'
       +'<textarea data-f="notes" rows="3" placeholder="Fare rules, payment terms…">'+esc(q.notes||'')+'</textarea></div>'
     +'<div class="tvq-card tvq-pad"><div class="tvq-h">🧮 Summary</div><div id="tvq-sum">'+summary(q)+'</div>'
       +'<div style="display:flex;flex-direction:column;gap:8px;margin-top:14px">'
         +'<button class="erp-btn btn-primary" onclick="tvqSave()">💾 Save Quotation</button>'
         +'<button class="erp-btn btn-ghost" onclick="tvqPrint()">🖨 Print / PDF</button></div></div>'
   +'</div></div>';

  var ed=document.getElementById('tvq-editor');
  ed.addEventListener('input',sync); ed.addEventListener('change',sync);
}
function summary(q){var c=calc(q);
  return '<div class="tvq-sumrow"><span>Subtotal ('+(q.items||[]).length+' items)</span><span>'+money(c.sub,q.currency)+'</span></div>'
   +'<div class="tvq-sumrow"><span>Discount</span><span style="color:#dc2626">− '+money(c.disc,q.currency)+'</span></div>'
   +'<div class="tvq-sumrow"><span>VAT / Tax ('+(+q.tax||0)+'%)</span><span>'+money(c.tax,q.currency)+'</span></div>'
   +'<div class="tvq-sumrow tot"><span>Grand Total</span><span>'+money(c.grand,q.currency)+'</span></div>'
   +'<div class="tvq-sumrow"><span style="color:#16a34a;font-weight:700">Total Profit</span><span style="color:#16a34a;font-weight:700">'+money(c.profit,q.currency)+'</span></div>';
}
function sync(){ if(!draft)return; var ed=document.getElementById('tvq-editor'); if(!ed)return;
  ed.querySelectorAll('[data-f]').forEach(function(el){var k=el.getAttribute('data-f'); draft[k]=(el.type==='number')?(el.value===''?0:Number(el.value)):el.value;});
  ed.querySelectorAll('tr[data-li]').forEach(function(tr){var i=+tr.getAttribute('data-li'); var it=draft.items[i]; if(!it)return;
    tr.querySelectorAll('[data-k]').forEach(function(el){var k=el.getAttribute('data-k'); it[k]=(el.type==='number')?(el.value===''?0:Number(el.value)):el.value;});
    var a=tr.querySelector('.tvq-lt'),b=tr.querySelector('.tvq-lp'); if(a)a.textContent=money(lt(it),draft.currency); if(b)b.textContent=money(lp(it),draft.currency);});
  var s=document.getElementById('tvq-sum'); if(s)s.innerHTML=summary(draft);
}

window.tvqNew=function(){draft={id:uid(),customer:'',date:new Date().toISOString().slice(0,10),valid:'',currency:'৳',status:'Draft',items:[],discount:0,tax:0,notes:''};editId=null;view='edit';render();};
window.tvqEdit=function(id){var q=QUOTES.find(function(x){return x.id===id;});if(!q)return;draft=JSON.parse(JSON.stringify(q));editId=id;view='edit';render();};
window.tvqDel=function(id){if(!confirm('Delete this quotation?'))return;QUOTES=QUOTES.filter(function(x){return x.id!==id;});save();render();};
window.tvqBack=function(){view='list';draft=null;editId=null;render();};
window.tvqAddItem=function(){sync();draft.items.push({type:'Flight',desc:'',qty:1,cost:0,sale:0});render();};
window.tvqAddSvc=function(){sync();var sel=document.getElementById('tvq-svc');if(!sel)return;var cat=svcCatalog();var s=cat[+sel.value];if(!s)return;draft.items.push({type:svcType(s.cat),desc:s.name,qty:1,cost:0,sale:+s.price||0});render();};
window.tvqDelItem=function(i){sync();draft.items.splice(i,1);render();};
window.tvqSave=function(){sync();if(!draft.customer||!draft.customer.trim()){alert('Customer is required.');return;}
  var i=QUOTES.findIndex(function(x){return x.id===draft.id;}); if(i>=0)QUOTES[i]=JSON.parse(JSON.stringify(draft)); else QUOTES.unshift(JSON.parse(JSON.stringify(draft)));
  save();view='list';draft=null;editId=null;render();};
window.tvqPrint=function(id){ var q=id&&typeof id==='string'?QUOTES.find(function(x){return x.id===id;}):(sync(),draft); if(!q)return;
  var c=calc(q); var rows=(q.items||[]).map(function(it){return '<tr><td>'+esc(it.type)+'</td><td>'+esc(it.desc||'')+'</td><td style="text-align:center">'+esc(it.qty)+'</td><td style="text-align:right">'+money(lt(it),q.currency)+'</td></tr>';}).join('');
  var w=window.open('','_blank'); if(!w){alert('Allow pop-ups to print.');return;}
  w.document.write('<!doctype html><html><head><title>'+esc(q.id)+'</title><style>body{font-family:Arial,sans-serif;color:#1a2035;padding:34px;max-width:760px;margin:auto}h1{font-size:22px;margin:0}.m{color:#5a6480;font-size:13px}table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}th,td{padding:9px;border-bottom:1px solid #e4e8f0;text-align:left}th{background:#f0f2f8;font-size:11px;text-transform:uppercase}.tot{width:280px;margin-left:auto;margin-top:14px;font-size:13px}.tot div{display:flex;justify-content:space-between;padding:5px 0}.tot .g{font-weight:700;font-size:16px;border-top:2px solid #1a2035;padding-top:8px}.hd{display:flex;justify-content:space-between;border-bottom:3px solid #2563eb;padding-bottom:12px}.lg{font-weight:800;font-size:20px;color:#2563eb;font-style:italic}</style></head><body>'
   +'<div class="hd"><div><div class="lg">Epal Travels</div><div class="m">Air Ticketing · Visa · Holidays</div></div><div style="text-align:right"><h1>QUOTATION</h1><div class="m">'+esc(q.id)+'<br>Date: '+esc(q.date||'')+'<br>Valid: '+esc(q.valid||'—')+'</div></div></div>'
   +'<p><b>To:</b> '+esc(q.customer||'—')+' &nbsp; <b>Status:</b> '+esc(q.status||'Draft')+'</p>'
   +'<table><thead><tr><th>Type</th><th>Description</th><th style="text-align:center">Qty</th><th style="text-align:right">Amount</th></tr></thead><tbody>'+(rows||'<tr><td colspan=4>No items</td></tr>')+'</tbody></table>'
   +'<div class="tot"><div><span>Subtotal</span><span>'+money(c.sub,q.currency)+'</span></div><div><span>Discount</span><span>− '+money(c.disc,q.currency)+'</span></div><div><span>VAT/Tax ('+(+q.tax||0)+'%)</span><span>'+money(c.tax,q.currency)+'</span></div><div class="g"><span>Grand Total</span><span>'+money(c.grand,q.currency)+'</span></div></div>'
   +(q.notes?'<p class="m" style="margin-top:18px"><b>Notes:</b><br>'+esc(q.notes)+'</p>':'')
   +'<p class="m" style="margin-top:26px">Thank you for choosing Epal Travels.</p>'
   +'<scr'+'ipt>window.onload=function(){window.print();}</scr'+'ipt></body></html>');
  w.document.close();
};

function injectCss(){ if(document.getElementById('tvq-css'))return; var s=document.createElement('style'); s.id='tvq-css'; var P='#erp-panel-tv-quotation ';
  s.textContent=''
  +P+'.tvq-kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-bottom:16px}'
  +P+'.tvq-kpi{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:13px 15px;box-shadow:var(--shadow)}'
  +P+'.tvq-kpi .l{font-size:11.5px;color:var(--text2)} '+P+'.tvq-kpi .v{font-size:23px;font-weight:700;margin-top:4px;font-family:"DM Mono",monospace}'
  +P+'.tvq-card{background:var(--bg2);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow);overflow:hidden;margin-bottom:16px}'
  +P+'.tvq-pad{padding:15px 17px}'
  +P+'.tvq-h{font-size:13.5px;font-weight:700;margin-bottom:11px;display:flex;align-items:center;gap:8px}'
  +P+'.tvq-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px}'
  +P+'.tvq-two{display:grid;grid-template-columns:1.3fr 1fr;gap:16px;align-items:start}'
  +'@media(max-width:900px){'+P+'.tvq-two{grid-template-columns:1fr}}'
  +P+'.tvq-f label{display:block;font-size:12px;color:var(--text2);margin-bottom:5px;font-weight:600}'
  +P+'.tvq-f input,'+P+'.tvq-f select,'+P+'textarea,'+P+'.tvq-tbl input,'+P+'.tvq-tbl select{width:100%;box-sizing:border-box;border:1px solid var(--border2,#d0d6e8);background:var(--bg);border-radius:9px;padding:9px 11px;font-size:13px;font-family:inherit;color:var(--text);outline:none}'
  +P+'textarea{width:100%;box-sizing:border-box}'
  +P+'.tvq-tbl{width:100%;border-collapse:collapse;font-size:13px}'
  +P+'.tvq-tbl th{text-align:left;color:var(--text2);font-weight:600;font-size:10.5px;text-transform:uppercase;letter-spacing:.4px;padding:10px 12px;border-bottom:1px solid var(--border);background:var(--bg3);white-space:nowrap}'
  +P+'.tvq-tbl td{padding:9px 12px;border-bottom:1px solid var(--border);vertical-align:middle}'
  +P+'.tvq-tbl tr:hover td{background:#fafbff} '+P+'.mono{font-family:"DM Mono",monospace;font-size:12px}'
  +P+'.tvq-pill{display:inline-block;font-size:10.5px;font-weight:700;color:#fff;padding:2px 9px;border-radius:20px}'
  +P+'.tvq-ic{border:0;background:none;cursor:pointer;font-size:14px;padding:4px 6px;border-radius:6px} '+P+'.tvq-ic:hover{background:var(--bg3)}'
  +P+'.tvq-sumrow{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px dashed var(--border);font-size:13px}'
  +P+'.tvq-sumrow.tot{font-weight:700;font-size:15px;border-bottom:none;border-top:2px solid var(--border);margin-top:6px;padding-top:10px}';
  document.head.appendChild(s);
}
function boot(){ injectCss(); var r=root(); if(r){render();} else {document.addEventListener('DOMContentLoaded',render);} }
boot();
})();
