/* FEATURE (native, additive): OCR Document Vault & Auto-Fill · New
   "Scan" a passport → auto-extract fields → reuse across ticketing & visa
   forms (kills typos that cause ADMs / visa rejections). #tv-ocr-root.
   localStorage epal_tv_ocr. (OCR is simulated for the prototype.) */
(function(){"use strict";
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];});}
function rd(k){try{var r=localStorage.getItem(k);return r?JSON.parse(r):null;}catch(e){}return null;}
var LS='epal_tv_ocr';
function load(){return rd(LS)||[
 {id:'P1',name:'ABDUL KARIM',no:'BX0451234',dob:'1985-03-12',expiry:'2027-01-09',nat:'Bangladesh',file:'karim-pp.jpg'},
 {id:'P2',name:'SHARMIN AKTER',no:'BX0987654',dob:'1992-08-22',expiry:'2026-05-31',nat:'Bangladesh',file:'sharmin-pp.jpg'}];}
function save(){try{localStorage.setItem(LS,JSON.stringify(V));}catch(e){}}
var V=load(),last=null;
var FN=['ABDUL KARIM','SHARMIN AKTER','TANVIR AHMED','RUMANA BEGUM','JAMAL UDDIN','NASRIN SULTANA'];
function root(){return document.getElementById('tv-ocr-root');}
function render(){var r=root();if(!r)return;injectCss();
  var rows=V.map(function(d){return '<tr><td><strong>'+esc(d.name)+'</strong></td><td class="mono">'+esc(d.no)+'</td><td>'+esc(d.dob)+'</td><td class="mono">'+esc(d.expiry)+'</td><td>'+esc(d.nat)+'</td><td>📎 '+esc(d.file)+'</td>'
    +'<td style="text-align:right;white-space:nowrap"><button class="oc-op" title="Auto-fill a new booking/visa" onclick="tvOcrFill(\''+d.id+'\')">⚡ Autofill</button><button class="oc-op" title="Delete" onclick="tvOcrDel(\''+d.id+'\')">🗑</button></td></tr>';}).join('')||'<tr><td colspan="7" style="text-align:center;color:var(--text3);padding:22px">Vault empty — scan a passport above.</td></tr>';
  var res=last?'<div class="oc-result"><div class="oc-rh">✅ Extracted fields <span style="font-size:11px;color:var(--text3)">(confidence 98%)</span></div>'
    +'<div class="oc-grid"><div><label>Name</label><div>'+esc(last.name)+'</div></div><div><label>Passport No</label><div class="mono">'+esc(last.no)+'</div></div>'
    +'<div><label>Date of Birth</label><div>'+esc(last.dob)+'</div></div><div><label>Expiry</label><div class="mono">'+esc(last.expiry)+'</div></div>'
    +'<div><label>Nationality</label><div>'+esc(last.nat)+'</div></div></div>'
    +'<button class="erp-btn btn-primary btn-sm" style="margin-top:10px" onclick="tvOcrSave()">＋ Save to vault</button></div>':'';
  r.innerHTML='<div class="oc-card oc-pad"><div class="oc-h">📷 Scan a Passport / Document</div>'
    +'<div class="oc-drop"><input type="file" id="oc-file" accept="image/*"><button class="erp-btn btn-primary" onclick="tvOcrScan()">🔍 Scan &amp; Extract</button></div>'+res+'</div>'
    +'<div class="oc-card"><div class="oc-h oc-pad" style="padding-bottom:0">🗄 Document Vault ('+V.length+')</div><table class="oc-tbl"><thead><tr><th>Name</th><th>Passport No</th><th>DOB</th><th>Expiry</th><th>Nationality</th><th>File</th><th style="text-align:right">Action</th></tr></thead><tbody>'+rows+'</tbody></table></div>'
    +'<div style="font-size:11.5px;color:var(--text3);margin-top:8px">Extracted data auto-fills ticketing &amp; visa forms — no re-typing, no name mismatches.</div>';
}
function rndName(){return FN[Math.floor(Math.random()*FN.length)];}
window.tvOcrScan=function(){var f=document.getElementById('oc-file');var fn=(f&&f.files&&f.files[0])?f.files[0].name:('passport-'+Math.floor(Math.random()*900+100)+'.jpg');
  var y=1980+Math.floor(Math.random()*20);last={name:rndName(),no:'B'+['X','W'][Math.floor(Math.random()*2)]+(Math.floor(Math.random()*9000000)+1000000),dob:y+'-0'+(1+Math.floor(Math.random()*8))+'-1'+Math.floor(Math.random()*9),expiry:(2027+Math.floor(Math.random()*3))+'-0'+(1+Math.floor(Math.random()*8))+'-2'+Math.floor(Math.random()*9),nat:'Bangladesh',file:fn};render();};
window.tvOcrSave=function(){if(!last)return;V.unshift(Object.assign({id:'P'+Date.now().toString().slice(-5)},last));last=null;save();render();};
window.tvOcrFill=function(id){var d=V.find(function(x){return x.id===id;});alert('⚡ Auto-fill ready\n\n'+d.name+' / '+d.no+'\n(Mock) These fields would populate a new Flight Booking passenger or Visa application — zero typing.');};
window.tvOcrDel=function(id){if(!confirm('Delete from vault?'))return;V=V.filter(function(x){return x.id!==id;});save();render();};
function injectCss(){if(document.getElementById('oc-css'))return;var s=document.createElement('style');s.id='oc-css';var P='#erp-panel-tv-ocr ';
  s.textContent=P+'.oc-card{background:var(--bg2);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow);overflow:hidden;margin-bottom:16px}'+P+'.oc-pad{padding:15px 17px}'+P+'.oc-h{font-size:13.5px;font-weight:700;margin-bottom:12px}'
  +P+'.oc-drop{display:flex;gap:10px;align-items:center;flex-wrap:wrap;border:1px dashed var(--border2,#d0d6e8);border-radius:10px;padding:14px;background:var(--bg)}'
  +P+'.oc-result{margin-top:14px;border-top:1px solid var(--border);padding-top:13px}'+P+'.oc-rh{font-size:13px;font-weight:700;margin-bottom:10px}'
  +P+'.oc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}'+P+'.oc-grid label{display:block;font-size:11px;color:var(--text2);font-weight:600;margin-bottom:3px}'+P+'.oc-grid>div>div{font-size:13.5px;font-weight:600}'
  +P+'.oc-tbl{width:100%;border-collapse:collapse;font-size:12.5px}'+P+'.oc-tbl th{text-align:left;color:var(--text2);font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:.3px;padding:9px 12px;border-bottom:1px solid var(--border);background:var(--bg3)}'+P+'.oc-tbl td{padding:9px 12px;border-bottom:1px solid var(--border)}'+P+'.mono{font-family:"DM Mono",monospace;font-size:12px}'
  +P+'.oc-op{border:0;background:none;cursor:pointer;font-size:12px;padding:3px 7px;border-radius:6px;font-family:inherit}'+P+'.oc-op:hover{background:var(--bg3)}';
  document.head.appendChild(s);}
function boot(){var r=root();if(r){render();}else{document.addEventListener('DOMContentLoaded',render);}}boot();
})();
