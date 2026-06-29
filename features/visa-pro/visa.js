/* ════════════════════════════════════════════════════════════════════
   FEATURE: Visa Management (Pro)  ·  New
   World-class visa processing — full application lifecycle (board + list),
   per-application detail with tabs: Overview, Documents (checklist),
   Payments (cost/sale/advance/due), Timeline. Filters, SLA aging, officer
   assignment. Modular via window.TravelPortal; localStorage epal_tr_visapro.
   ════════════════════════════════════════════════════════════════════ */
(function(){
"use strict";
const TP=window.TravelPortal;
if(!TP){ console.warn('[VisaPro] TravelPortal not found'); return; }
const {esc,money,uid,pretty}=TP.helpers;
const COUNTRIES=TP.pools.COUNTRIES, OFFICERS=TP.pools.OFFICERS;

const LS='epal_tr_visapro';
const STAGES=[
  {k:'new',t:'New / Enquiry',c:'#94a3b8'},{k:'documents',t:'Doc Collection',c:'#2563eb'},
  {k:'submitted',t:'Submitted',c:'#7c3aed'},{k:'process',t:'In Process',c:'#d97706'},
  {k:'approved',t:'Approved',c:'#16a34a'},{k:'rejected',t:'Rejected',c:'#dc2626'}
];
const STAGE_T=Object.fromEntries(STAGES.map(s=>[s.k,s.t]));
const VTYPES=['Tourist','Work','Student','Business','Family','Umrah / Hajj','Medical'];
const DOC_TPL=['Passport copy','Passport-size photo','Bank statement (6m)','Application form','Hotel / invitation','Travel insurance','Ticket booking'];

let apps=load();
function load(){ try{const r=localStorage.getItem(LS); if(r)return JSON.parse(r);}catch(e){} return SEED(); }
function save(){ try{localStorage.setItem(LS,JSON.stringify(apps));}catch(e){} }
function docs(done){ return DOC_TPL.map((t,i)=>({t,done:i<done})); }
function SEED(){ return [
  {id:'VP-3001',applicant:'Abdul Karim',passportNo:'BX0451234',country:'Saudi Arabia',visaType:'Umrah / Hajj',status:'documents',officer:'Imran Hossain',cost:18000,sale:25000,advance:10000,appliedDate:'2026-06-20',travelDate:'2026-07-20',embassy:'KSA Embassy Dhaka',appointment:'',documents:docs(4),timeline:[{at:'2026-06-20',text:'Application created.'},{at:'2026-06-22',text:'Advance ৳10,000 received.'}],remarks:'Umrah group of 4.'},
  {id:'VP-3002',applicant:'Sharmin Akter',passportNo:'BX0987654',country:'Malaysia',visaType:'Tourist',status:'submitted',officer:'Fatema Akter',cost:9000,sale:14000,advance:14000,appliedDate:'2026-06-18',travelDate:'2026-07-05',embassy:'Malaysia High Comm.',appointment:'2026-06-30',documents:docs(6),timeline:[{at:'2026-06-18',text:'Application created.'},{at:'2026-06-25',text:'Submitted to embassy.'}],remarks:''},
  {id:'VP-3003',applicant:'Tanvir Ahmed',passportNo:'BW1122334',country:'UAE',visaType:'Work',status:'approved',officer:'Imran Hossain',cost:32000,sale:42000,advance:42000,appliedDate:'2026-06-10',travelDate:'2026-07-12',embassy:'—',appointment:'',documents:docs(7),timeline:[{at:'2026-06-10',text:'Application created.'},{at:'2026-06-28',text:'Visa approved ✅'}],remarks:'Employment visa.'},
  {id:'VP-3004',applicant:'Rumana Begum',passportNo:'BX0555666',country:'Schengen',visaType:'Tourist',status:'new',officer:'Mitu Rani',cost:15000,sale:23000,advance:0,appliedDate:'2026-06-27',travelDate:'2026-08-15',embassy:'VFS Global',appointment:'',documents:docs(1),timeline:[{at:'2026-06-27',text:'Enquiry logged.'}],remarks:'Awaiting bank statement.'},
  {id:'VP-3005',applicant:'Jamal Uddin',passportNo:'BW7788990',country:'Qatar',visaType:'Work',status:'process',officer:'Tareq Aziz',cost:28000,sale:36000,advance:20000,appliedDate:'2026-06-15',travelDate:'2026-07-28',embassy:'Qatar Visa Center',appointment:'2026-07-01',documents:docs(5),timeline:[{at:'2026-06-15',text:'Application created.'}],remarks:''},
  {id:'VP-3006',applicant:'Nasrin Sultana',passportNo:'BX0334455',country:'India',visaType:'Tourist',status:'rejected',officer:'Fatema Akter',cost:6000,sale:9000,advance:9000,appliedDate:'2026-06-05',travelDate:'',embassy:'IVAC',appointment:'',documents:docs(7),timeline:[{at:'2026-06-05',text:'Application created.'},{at:'2026-06-26',text:'Rejected — insufficient docs.'}],remarks:'Re-apply with stronger profile.'}
];}

/* ---------- helpers ---------- */
const initials=n=>String(n||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
const due=a=>Math.max(0,(+a.sale||0)-(+a.advance||0));
function payStatus(a){ if((+a.sale||0)>0&&due(a)<=0) return 'Paid'; if((+a.advance||0)>0) return 'Partial'; return 'Pending'; }
const PAY_PILL={Paid:'ok',Partial:'warn',Pending:'bad'};
const docProg=a=>{const d=a.documents||[];return d.length?Math.round(d.filter(x=>x.done).length/d.length*100):0;};
function daysTo(str){ if(!str)return null; const d=new Date(str);d.setHours(0,0,0,0);const n=new Date();n.setHours(0,0,0,0);return Math.round((d-n)/86400000); }
function travelPill(a){ const n=daysTo(a.travelDate); if(n===null)return ''; if(['approved','rejected'].includes(a.status))return '';
  if(n<0)return '<span class="pill bad">travel passed</span>'; if(n<=10)return `<span class="pill bad">✈ ${n}d</span>`; if(n<=21)return `<span class="pill warn">✈ ${n}d</span>`; return `<span class="pill info">✈ ${n}d</span>`; }

/* ---------- view ---------- */
let host=null, view='board', flt={q:'',country:'',visaType:'',officer:''}, draft=null, editId=null, tab='overview';
function render(el){ host=el||host; ensureCss(); ensureModal(); draw(); }
function filtered(){ return apps.filter(a=>{
  if(flt.country&&a.country!==flt.country)return false;
  if(flt.visaType&&a.visaType!==flt.visaType)return false;
  if(flt.officer&&a.officer!==flt.officer)return false;
  if(flt.q){const q=flt.q.toLowerCase(); if(!`${a.applicant} ${a.passportNo} ${a.country} ${a.id}`.toLowerCase().includes(q))return false;}
  return true; }); }

function draw(){
  const data=filtered();
  const active=apps.filter(a=>!['approved','rejected'].includes(a.status)).length;
  const approved=apps.filter(a=>a.status==='approved').length;
  const outstanding=apps.reduce((s,a)=>s+due(a),0);
  const opt=(arr,sel)=>arr.map(o=>`<option${o===sel?' selected':''}>${esc(o)}</option>`).join('');
  host.innerHTML=`
    <div class="ph"><div><h2>Visa Management <span class="badge-new">New</span></h2>
      <div class="sub">Full application lifecycle — documents, payments, embassy & travel timeline</div></div>
      <div class="ph-r"><div class="vz-viewtog"><button class="${view==='board'?'on':''}" onclick="VZ.view('board')">▦ Board</button><button class="${view==='list'?'on':''}" onclick="VZ.view('list')">≣ List</button></div>
      <button class="btn primary" onclick="VZ.new()">＋ New Application</button></div></div>

    <div class="kpis">
      <div class="kpi"><div class="lbl">🛂 Active Applications</div><div class="val">${active}</div><div class="meta">${apps.length} total</div></div>
      <div class="kpi"><div class="lbl">✅ Approved</div><div class="val" style="color:var(--green)">${approved}</div><div class="meta">${apps.filter(a=>a.status==='rejected').length} rejected</div></div>
      <div class="kpi"><div class="lbl">💰 Outstanding Due</div><div class="val" style="font-size:21px;color:var(--red)">${money(outstanding)}</div><div class="meta">across all files</div></div>
      <div class="kpi"><div class="lbl">📄 Avg Docs Complete</div><div class="val">${apps.length?Math.round(apps.reduce((s,a)=>s+docProg(a),0)/apps.length):0}%</div><div class="meta">document readiness</div></div>
    </div>

    <div class="toolbar">
      <div class="search"><input placeholder="Search applicant, passport, country…" value="${esc(flt.q)}" oninput="VZ.f('q',this.value)"></div>
      <select onchange="VZ.f('country',this.value)"><option value="">All countries</option>${opt(COUNTRIES,flt.country)}</select>
      <select onchange="VZ.f('visaType',this.value)"><option value="">All types</option>${opt(VTYPES,flt.visaType)}</select>
      <select onchange="VZ.f('officer',this.value)"><option value="">All officers</option>${opt(OFFICERS,flt.officer)}</select>
      <span class="ct">${data.length} file${data.length===1?'':'s'}</span>
    </div>
    ${view==='board'?board(data):list(data)}`;
}
function card(a){
  return `<div class="kcard" draggable="true" ondragstart="VZ.dstart(event,'${a.id}')" ondragend="VZ.dend(event)" onclick="VZ.open('${a.id}')">
    <div class="foot" style="margin:0 0 5px"><span class="mono" style="font-size:11px;color:var(--text3)">${esc(a.id)}</span>${travelPill(a)?`<span style="margin-left:auto">${travelPill(a)}</span>`:''}</div>
    <div class="t">${esc(a.applicant)}</div>
    <div class="d">${esc(a.country)} · ${esc(a.visaType)}</div>
    <div class="vz-prog"><div class="vz-prog-b" style="width:${docProg(a)}%"></div></div>
    <div class="foot"><span class="vz-av">${initials(a.officer)}</span><span class="money">${money(a.sale)}</span><span class="pill ${PAY_PILL[payStatus(a)]}" style="margin-left:auto">${payStatus(a)}</span></div>
  </div>`;
}
function board(data){ return `<div class="kanban">${STAGES.map(s=>{const items=data.filter(a=>a.status===s.k);
  return `<div class="kcol" ondragover="VZ.dover(event,this)" ondragleave="this.classList.remove('over')" ondrop="VZ.drop(event,'${s.k}',this)">
    <div class="kcol-h"><span class="kdot" style="background:${s.c}"></span>${s.t}<span class="kct">${items.length}</span></div>
    ${items.map(card).join('')||'<div class="kempty">—</div>'}</div>`;}).join('')}</div>`; }
function list(data){ const rows=data.map(a=>`<tr onclick="VZ.open('${a.id}')" style="cursor:pointer">
  <td class="mono">${esc(a.id)}</td><td class="strong">${esc(a.applicant)}</td><td>${esc(a.country)}</td><td>${esc(a.visaType)}</td>
  <td><span class="vz-av">${initials(a.officer)}</span> ${esc(a.officer||'—')}</td>
  <td><span class="pill ${({new:'muted',documents:'info',submitted:'purple',process:'warn',approved:'ok',rejected:'bad'})[a.status]}">${esc(STAGE_T[a.status])}</span></td>
  <td>${money(a.sale)}</td><td><span class="pill ${PAY_PILL[payStatus(a)]}">${payStatus(a)}</span></td><td>${esc(a.travelDate||'—')}</td></tr>`).join('')||`<tr><td class="empty" colspan="9">No applications match.</td></tr>`;
  return `<div class="card"><table class="tbl"><thead><tr><th>File</th><th>Applicant</th><th>Country</th><th>Type</th><th>Officer</th><th>Stage</th><th>Sale</th><th>Payment</th><th>Travel</th></tr></thead><tbody>${rows}</tbody></table></div>`; }

/* ---------- detail modal ---------- */
function ensureModal(){ if(document.getElementById('vz-modal'))return;
  const m=document.createElement('div'); m.id='vz-modal'; m.className='modal'; m.onclick=e=>{if(e.target===m)VZ.close();};
  m.innerHTML=`<div class="modal-box" style="width:720px"><div class="modal-h"><span class="ti" id="vz-mti">Application</span><button class="x" onclick="VZ.close()">✕</button></div>
    <div style="padding:0 22px;border-bottom:1px solid var(--border)"><div class="vz-tabs" id="vz-tabs"></div></div>
    <div class="modal-b" id="vz-mb"></div>
    <div class="modal-f"><button class="btn danger" id="vz-del" style="margin-right:auto;border-color:#f3c0c0;color:#dc2626">🗑 Delete</button><button class="btn" onclick="VZ.close()">Cancel</button><button class="btn primary" onclick="VZ.save()">Save</button></div></div>`;
  document.body.appendChild(m);
}
function openModal(){ draft.documents=draft.documents||docs(0); draft.timeline=draft.timeline||[]; tab='overview';
  document.getElementById('vz-mti').textContent=editId?('File '+draft.id):'New Application';
  const del=document.getElementById('vz-del'); del.style.display=editId?'':'none';
  del.onclick=()=>{ if(editId&&confirm('Delete this application?')){ apps=apps.filter(x=>x.id!==editId); save(); VZ.close(); draw(); } };
  const TABS=[['overview','Overview'],['documents','Documents'],['payments','Payments'],['timeline','Timeline']];
  document.getElementById('vz-tabs').innerHTML=TABS.map(([k,l])=>`<button class="vz-tab ${tab===k?'on':''}" onclick="VZ.tab('${k}')">${l}</button>`).join('');
  modalBody(); document.getElementById('vz-modal').classList.add('open');
}
function setTabs(){ document.querySelectorAll('#vz-tabs .vz-tab').forEach(b=>b.classList.remove('on')); }
function modalBody(){ const a=draft, opt=(arr,s)=>arr.map(o=>`<option${o===s?' selected':''}>${esc(o)}</option>`).join('');
  let h='';
  if(tab==='overview'){ h=`<div class="form">
      <div class="field"><label>Applicant *</label><input id="v-applicant" value="${esc(a.applicant||'')}"></div>
      <div class="field"><label>Passport No</label><input id="v-passportNo" value="${esc(a.passportNo||'')}"></div>
      <div class="field"><label>Country *</label><select id="v-country">${opt(COUNTRIES,a.country)}</select></div>
      <div class="field"><label>Visa Type</label><select id="v-visaType">${opt(VTYPES,a.visaType)}</select></div>
      <div class="field"><label>Stage</label><select id="v-status">${STAGES.map(s=>`<option value="${s.k}"${a.status===s.k?' selected':''}>${s.t}</option>`).join('')}</select></div>
      <div class="field"><label>Officer</label><select id="v-officer"><option value="">—</option>${opt(OFFICERS,a.officer)}</select></div>
      <div class="field"><label>Embassy / Center</label><input id="v-embassy" value="${esc(a.embassy||'')}"></div>
      <div class="field"><label>Appointment</label><input id="v-appointment" type="date" value="${esc(a.appointment||'')}"></div>
      <div class="field"><label>Applied Date</label><input id="v-appliedDate" type="date" value="${esc(a.appliedDate||'')}"></div>
      <div class="field"><label>Travel Date</label><input id="v-travelDate" type="date" value="${esc(a.travelDate||'')}"></div>
      <div class="field full"><label>Remarks</label><textarea id="v-remarks" rows="2">${esc(a.remarks||'')}</textarea></div>
    </div>`;
  } else if(tab==='documents'){ const p=docProg(a);
    h=`<div class="vz-prog" style="margin:2px 0 4px"><div class="vz-prog-b" style="width:${p}%"></div></div><div style="font-size:11.5px;color:var(--text3);margin-bottom:10px">${(a.documents||[]).filter(d=>d.done).length}/${(a.documents||[]).length} documents · ${p}%</div>`+
      (a.documents||[]).map((d,i)=>`<div class="vz-ci"><input type="checkbox" ${d.done?'checked':''} onchange="VZ.doc(${i})"><span class="${d.done?'done':''}">${esc(d.t)}</span><button class="tbtn danger" onclick="VZ.docDel(${i})">✕</button></div>`).join('')+
      `<div class="addbar" style="margin:9px 0 0"><input id="v-doc" placeholder="Add a required document…" onkeydown="if(event.key==='Enter')VZ.docAdd()"><button class="btn" onclick="VZ.docAdd()">＋</button></div>`;
  } else if(tab==='payments'){ const d=due(a);
    h=`<div class="form">
      <div class="field"><label>Cost Price (৳)</label><input id="v-cost" type="number" value="${esc(a.cost||0)}"></div>
      <div class="field"><label>Sale Price (৳)</label><input id="v-sale" type="number" value="${esc(a.sale||0)}"></div>
      <div class="field"><label>Advance Received (৳)</label><input id="v-advance" type="number" value="${esc(a.advance||0)}"></div>
      <div class="field"><label>&nbsp;</label><button class="btn" onclick="VZ.recalc()">↻ Recalculate</button></div>
    </div>
    <div class="box" style="margin-top:8px;box-shadow:none"><div class="pay" style="grid-template-columns:1fr"><div>
      <div class="row"><span>Sale Price</span><span>${money(a.sale)}</span></div>
      <div class="row"><span>Cost</span><span>${money(a.cost)}</span></div>
      <div class="row"><span style="color:var(--green)">Profit</span><span style="color:var(--green)">${money((+a.sale||0)-(+a.cost||0))}</span></div>
      <div class="row"><span>Advance</span><span>${money(a.advance)}</span></div>
      <div class="row tot"><span>Due</span><span style="color:${d>0?'var(--red)':'var(--green)'}">${money(d)}</span></div>
      <div class="row" style="border:none"><span>Payment Status</span><span><span class="pill ${PAY_PILL[payStatus(a)]}">${payStatus(a)}</span></span></div>
    </div></div></div>`;
  } else { h=`<div class="vz-tl">${(a.timeline||[]).map(t=>`<div class="vz-tle"><span class="vz-dot"></span><div><b>${esc(t.at)}</b><div>${esc(t.text)}</div></div></div>`).join('')||'<div style="color:var(--text3);font-size:12.5px">No history.</div>'}</div>
      <div class="addbar" style="margin:10px 0 0"><input id="v-note" placeholder="Add a timeline note…" onkeydown="if(event.key==='Enter')VZ.noteAdd()"><button class="btn" onclick="VZ.noteAdd()">Add</button></div>`; }
  document.getElementById('vz-mb').innerHTML=h;
}
function syncDraft(){ const g=id=>{const e=document.getElementById(id);return e?e.value:undefined;};
  if(tab==='overview'&&g('v-applicant')!==undefined){ ['applicant','passportNo','country','visaType','status','officer','embassy','appointment','appliedDate','travelDate','remarks'].forEach(k=>draft[k]=g('v-'+k)); }
  if(tab==='payments'&&g('v-cost')!==undefined){ draft.cost=+g('v-cost')||0; draft.sale=+g('v-sale')||0; draft.advance=+g('v-advance')||0; }
}

window.VZ={
  view(v){ view=v; draw(); },
  f(k,v){ flt[k]=v; draw(); if(k==='q'){const s=host.querySelector('.search input'); if(s){s.focus();s.setSelectionRange(s.value.length,s.value.length);}} },
  new(){ draft={id:uid('VP'),applicant:'',passportNo:'',country:'Saudi Arabia',visaType:'Tourist',status:'new',officer:'',cost:0,sale:0,advance:0,appliedDate:new Date().toISOString().slice(0,10),travelDate:'',embassy:'',appointment:'',documents:docs(0),timeline:[{at:new Date().toISOString().slice(0,10),text:'Enquiry logged.'}],remarks:''}; editId=null; openModal(); },
  open(id){ const a=apps.find(x=>x.id===id); if(!a)return; draft=JSON.parse(JSON.stringify(a)); editId=id; openModal(); },
  close(){ document.getElementById('vz-modal').classList.remove('open'); draft=null; editId=null; },
  tab(t){ syncDraft(); tab=t; setTabs(); const b=document.querySelector(`#vz-tabs .vz-tab[onclick*="'${t}'"]`); if(b)b.classList.add('on'); modalBody(); },
  save(){ syncDraft(); if(!draft.applicant||!draft.applicant.trim()){ alert('Applicant name is required.'); return; }
    if(editId){ const i=apps.findIndex(x=>x.id===editId); apps[i]=draft; } else apps.unshift(draft);
    save(); VZ.close(); draw(); },
  recalc(){ syncDraft(); modalBody(); },
  doc(i){ syncDraft(); draft.documents[i].done=!draft.documents[i].done; modalBody(); },
  docAdd(){ syncDraft(); const e=document.getElementById('v-doc'); if(e&&e.value.trim()){ draft.documents.push({t:e.value.trim(),done:false}); modalBody(); document.getElementById('v-doc').focus(); } },
  docDel(i){ syncDraft(); draft.documents.splice(i,1); modalBody(); },
  noteAdd(){ syncDraft(); const e=document.getElementById('v-note'); if(e&&e.value.trim()){ draft.timeline.push({at:new Date().toISOString().slice(0,10),text:e.value.trim()}); modalBody(); } },
  dstart(e,id){ VZ._drag=id; e.dataTransfer.effectAllowed='move'; e.currentTarget.classList.add('dragging'); },
  dend(e){ e.currentTarget.classList.remove('dragging'); },
  dover(e,el){ e.preventDefault(); el.classList.add('over'); },
  drop(e,status,el){ e.preventDefault(); el.classList.remove('over'); const a=apps.find(x=>x.id===VZ._drag);
    if(a&&a.status!==status){ a.status=status; (a.timeline=a.timeline||[]).push({at:new Date().toISOString().slice(0,10),text:'Moved to '+STAGE_T[status]+'.'}); save(); draw(); } VZ._drag=null; }
};

function ensureCss(){ if(document.getElementById('vz-css'))return; const s=document.createElement('style'); s.id='vz-css';
  s.textContent=`
  .vz-viewtog{display:inline-flex;border:1px solid var(--border2);border-radius:9px;overflow:hidden}
  .vz-viewtog button{border:0;background:var(--bg2);padding:8px 13px;font-size:12.5px;font-weight:600;cursor:pointer;color:var(--text2);font-family:inherit}
  .vz-viewtog button.on{background:var(--accent);color:#fff}
  .vz-av{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;font-size:9.5px;font-weight:700;vertical-align:middle}
  .vz-prog{height:6px;background:var(--bg3);border-radius:6px;overflow:hidden;margin:7px 0}
  .vz-prog-b{height:100%;background:linear-gradient(90deg,#2563eb,#16a34a)}
  .vz-tabs{display:flex;gap:4px}
  .vz-tab{border:0;background:none;padding:11px 14px;font-size:12.5px;font-weight:600;color:var(--text2);cursor:pointer;border-bottom:2px solid transparent;font-family:inherit}
  .vz-tab.on{color:var(--accent);border-bottom-color:var(--accent)}
  .vz-ci{display:flex;align-items:center;gap:9px;padding:6px 0;font-size:13px;border-bottom:1px solid var(--border)}
  .vz-ci .done{text-decoration:line-through;color:var(--text3)} .vz-ci button{margin-left:auto}
  .vz-tl{position:relative;padding-left:6px}
  .vz-tle{display:flex;gap:11px;padding:6px 0;font-size:12.5px}
  .vz-dot{width:9px;height:9px;border-radius:50%;background:var(--accent);margin-top:5px;flex-shrink:0;box-shadow:0 0 0 3px var(--accent-light)}`;
  document.head.appendChild(s);
}

TP.onReady(()=>{
  TP.addGroup({grp:'visa-pro-grp',label:'Visa (Pro)',ic:'🛂',section:'Operations Pro',nw:true});
  TP.registerPage({ id:'visa-pro', label:'Visa Management', sub:'Application lifecycle, documents, payments & timeline', ic:'🛂', group:'visa-pro-grp', nw:true, render });
});
})();
