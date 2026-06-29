/* ════════════════════════════════════════════════════════════════════
   FEATURE: Air Ticketing (Pro)  ·  New
   World-class ticket booking lifecycle — bookings list + KPIs, multi-
   passenger bookings, PNR, fare breakdown (base + taxes), cost/profit,
   payment (advance/due), and full operations: Issue, Re-issue, Refund,
   Void, EMD — each logged to a history timeline. Modular via
   window.TravelPortal; localStorage epal_tr_ticketing.
   ════════════════════════════════════════════════════════════════════ */
(function(){
"use strict";
const TP=window.TravelPortal;
if(!TP){ console.warn('[Ticketing] TravelPortal not found'); return; }
const {esc,money,uid,pretty}=TP.helpers;
const AIRLINES=TP.pools.AIRLINES, AIRPORTS=TP.pools.AIRPORTS, VENDORS=TP.pools.VENDORS_LIST;

const LS='epal_tr_ticketing';
const CABINS=['Economy','Premium Economy','Business','First'];
const TRIPS=['One-way','Return','Multi-city'];
const PAXTYPE=['Adult','Child','Infant'];
const BST=['Confirmed','Pending','Cancelled','Voided','Refunded','Re-issued'];
const BST_PILL={Confirmed:'ok',Pending:'warn',Cancelled:'bad',Voided:'muted',Refunded:'purple','Re-issued':'info'};
const TST_PILL={Issued:'ok',Unissued:'muted',Refunded:'purple',Void:'bad'};

let books=load();
function load(){ try{const r=localStorage.getItem(LS); if(r)return JSON.parse(r);}catch(e){} return SEED(); }
function save(){ try{localStorage.setItem(LS,JSON.stringify(books));}catch(e){} }
function SEED(){ return [
  {id:'TS-5001',pnr:'EK2X9Q',customer:'Rahim Enterprise',airline:'Emirates',from:'DAC — Dhaka',to:'DXB — Dubai',trip:'Return',cabin:'Economy',travelDate:'2026-07-10',returnDate:'2026-07-20',vendor:'Dubai Holidays Ltd',pax:[{name:'Rahim Uddin',type:'Adult',tkt:'176-2401110011'},{name:'Salma Rahim',type:'Adult',tkt:'176-2401110012'}],baseFare:96000,taxes:16000,cost:96000,advance:112000,bookingStatus:'Confirmed',ticketStatus:'Issued',history:[{at:'2026-06-26',text:'Booking created.'},{at:'2026-06-26',text:'Ticket issued — PNR EK2X9Q.'}],remarks:''},
  {id:'TS-5002',pnr:'SV7P2A',customer:'Nadia Sultana',airline:'Saudia',from:'DAC — Dhaka',to:'JED — Jeddah',trip:'One-way',cabin:'Economy',travelDate:'2026-07-15',returnDate:'',vendor:'Al-Haramain Agency',pax:[{name:'Nadia Sultana',type:'Adult',tkt:''}],baseFare:58000,taxes:11000,cost:62000,advance:35000,bookingStatus:'Pending',ticketStatus:'Unissued',history:[{at:'2026-06-27',text:'Booking created.'}],remarks:'Awaiting balance before issue.'},
  {id:'TS-5003',pnr:'MH4K8L',customer:'GreenLand Tours',airline:'Malaysia Airlines',from:'DAC — Dhaka',to:'KUL — Kuala Lumpur',trip:'Return',cabin:'Economy',travelDate:'2026-08-01',returnDate:'2026-08-08',vendor:'Portal: Sabre',pax:[{name:'A Rahman',type:'Adult',tkt:''},{name:'B Rahman',type:'Adult',tkt:''},{name:'C Rahman',type:'Adult',tkt:''},{name:'D Rahman',type:'Child',tkt:''}],baseFare:156000,taxes:28000,cost:156000,advance:0,bookingStatus:'Pending',ticketStatus:'Unissued',history:[{at:'2026-06-27',text:'Group booking created.'}],remarks:''}
];}

/* ---------- fare/payment helpers ---------- */
const sale=b=>(+b.baseFare||0)+(+b.taxes||0);
const profit=b=>sale(b)-(+b.cost||0);
const due=b=>Math.max(0,sale(b)-(+b.advance||0));
function payStatus(b){ if(sale(b)>0&&due(b)<=0)return 'Paid'; if((+b.advance||0)>0)return 'Partial'; return 'Due'; }
const PAY_PILL={Paid:'ok',Partial:'warn',Due:'bad'};
const stamp=()=>new Date().toISOString().slice(0,10);

/* ---------- view ---------- */
let host=null, flt={q:'',status:'',pay:''}, draft=null, editId=null, tab='overview';
function render(el){ host=el||host; ensureCss(); ensureModal(); draw(); }
function filtered(){ return books.filter(b=>{
  if(flt.status&&b.bookingStatus!==flt.status)return false;
  if(flt.pay&&payStatus(b)!==flt.pay)return false;
  if(flt.q){const q=flt.q.toLowerCase(); if(!`${b.id} ${b.pnr} ${b.customer} ${b.airline} ${b.from} ${b.to}`.toLowerCase().includes(q))return false;}
  return true; }); }

function draw(){
  const data=filtered();
  const issued=books.filter(b=>b.ticketStatus==='Issued').length;
  const dueTot=books.reduce((s,b)=>s+due(b),0);
  const profTot=books.reduce((s,b)=>s+profit(b),0);
  const opt=(arr,sel)=>arr.map(o=>`<option${o===sel?' selected':''}>${esc(o)}</option>`).join('');
  const rows=data.map(b=>`
    <tr onclick="TK.open('${b.id}')" style="cursor:pointer">
      <td class="mono">${esc(b.id)}</td><td class="mono">${esc(b.pnr||'—')}</td><td class="strong">${esc(b.customer)}</td>
      <td>${esc(b.airline)}<div style="font-size:11px;color:var(--text3)">${esc(b.from.split(' ')[0])}→${esc(b.to.split(' ')[0])} · ${esc(b.trip)}</div></td>
      <td>${(b.pax||[]).length}</td><td>${money(sale(b))}</td>
      <td style="color:var(--green)">${money(profit(b))}</td>
      <td><span class="pill ${BST_PILL[b.bookingStatus]||'muted'}">${esc(b.bookingStatus)}</span></td>
      <td><span class="pill ${TST_PILL[b.ticketStatus]||'muted'}">${esc(b.ticketStatus)}</span></td>
      <td><span class="pill ${PAY_PILL[payStatus(b)]}">${payStatus(b)}</span></td>
    </tr>`).join('')||`<tr><td class="empty" colspan="10">No bookings match.</td></tr>`;
  host.innerHTML=`
    <div class="ph"><div><h2>Air Ticketing <span class="badge-new">New</span></h2>
      <div class="sub">Bookings, passengers, fares & operations — issue, re-issue, refund, void, EMD</div></div>
      <div class="ph-r"><button class="btn primary" onclick="TK.new()">＋ New Booking</button></div></div>

    <div class="kpis">
      <div class="kpi"><div class="lbl">🎫 Bookings</div><div class="val">${books.length}</div><div class="meta">${issued} issued</div></div>
      <div class="kpi"><div class="lbl">💰 Sales Value</div><div class="val" style="font-size:21px">${money(books.reduce((s,b)=>s+sale(b),0))}</div><div class="meta">gross</div></div>
      <div class="kpi"><div class="lbl">📈 Profit</div><div class="val" style="font-size:21px;color:var(--green)">${money(profTot)}</div><div class="meta">sale − cost</div></div>
      <div class="kpi"><div class="lbl">💳 Outstanding Due</div><div class="val" style="font-size:21px;color:var(--red)">${money(dueTot)}</div><div class="meta">to collect</div></div>
    </div>

    <div class="toolbar">
      <div class="search"><input placeholder="Search invoice, PNR, customer, route…" value="${esc(flt.q)}" oninput="TK.f('q',this.value)"></div>
      <select onchange="TK.f('status',this.value)"><option value="">All statuses</option>${opt(BST,flt.status)}</select>
      <select onchange="TK.f('pay',this.value)"><option value="">All payments</option>${['Paid','Partial','Due'].map(o=>`<option${flt.pay===o?' selected':''}>${o}</option>`).join('')}</select>
      <span class="ct">${data.length} booking${data.length===1?'':'s'}</span>
    </div>
    <div class="card"><table class="tbl"><thead><tr><th>Invoice</th><th>PNR</th><th>Customer</th><th>Airline / Route</th><th>Pax</th><th>Sale</th><th>Profit</th><th>Booking</th><th>Ticket</th><th>Payment</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

/* ---------- detail modal ---------- */
function ensureModal(){ if(document.getElementById('tk-modal'))return;
  const m=document.createElement('div'); m.id='tk-modal'; m.className='modal'; m.onclick=e=>{if(e.target===m)TK.close();};
  m.innerHTML=`<div class="modal-box" style="width:740px"><div class="modal-h"><span class="ti" id="tk-mti">Booking</span><button class="x" onclick="TK.close()">✕</button></div>
    <div style="padding:0 22px;border-bottom:1px solid var(--border)"><div class="tk-tabs" id="tk-tabs"></div></div>
    <div class="modal-b" id="tk-mb"></div>
    <div class="modal-f"><button class="btn danger" id="tk-del" style="margin-right:auto;border-color:#f3c0c0;color:#dc2626">🗑 Delete</button><button class="btn" onclick="TK.close()">Cancel</button><button class="btn primary" onclick="TK.save()">Save</button></div></div>`;
  document.body.appendChild(m);
}
function openModal(){ draft.pax=draft.pax||[]; draft.history=draft.history||[]; tab='overview';
  document.getElementById('tk-mti').textContent=editId?('Booking '+draft.id):'New Booking';
  const del=document.getElementById('tk-del'); del.style.display=editId?'':'none';
  del.onclick=()=>{ if(editId&&confirm('Delete this booking?')){ books=books.filter(x=>x.id!==editId); save(); TK.close(); draw(); } };
  renderTabs(); modalBody(); document.getElementById('tk-modal').classList.add('open');
}
function renderTabs(){ const TABS=[['overview','Overview'],['pax','Passengers'],['fare','Fare & Payment'],['ops','Operations']];
  document.getElementById('tk-tabs').innerHTML=TABS.map(([k,l])=>`<button class="tk-tab ${tab===k?'on':''}" onclick="TK.tab('${k}')">${l}</button>`).join(''); }
function modalBody(){ const b=draft, opt=(arr,s)=>arr.map(o=>`<option${o===s?' selected':''}>${esc(o)}</option>`).join('');
  let h='';
  if(tab==='overview'){ const custs=(TP.DB['customers']||[]).map(c=>c.name);
    h=`<div class="form">
      <div class="field"><label>Customer *</label><select id="k-customer"><option value="">— select —</option>${opt(custs,b.customer)}</select></div>
      <div class="field"><label>PNR</label><input id="k-pnr" value="${esc(b.pnr||'')}" placeholder="e.g. EK2X9Q"></div>
      <div class="field"><label>Airline</label><select id="k-airline">${opt(AIRLINES,b.airline)}</select></div>
      <div class="field"><label>Vendor / Portal</label><select id="k-vendor"><option value="">—</option>${opt(VENDORS,b.vendor)}</select></div>
      <div class="field"><label>From</label><select id="k-from">${opt(AIRPORTS,b.from)}</select></div>
      <div class="field"><label>To</label><select id="k-to">${opt(AIRPORTS,b.to)}</select></div>
      <div class="field"><label>Trip Type</label><select id="k-trip">${opt(TRIPS,b.trip)}</select></div>
      <div class="field"><label>Cabin</label><select id="k-cabin">${opt(CABINS,b.cabin)}</select></div>
      <div class="field"><label>Travel Date</label><input id="k-travelDate" type="date" value="${esc(b.travelDate||'')}"></div>
      <div class="field"><label>Return Date</label><input id="k-returnDate" type="date" value="${esc(b.returnDate||'')}"></div>
      <div class="field full"><label>Remarks</label><textarea id="k-remarks" rows="2">${esc(b.remarks||'')}</textarea></div>
    </div>`;
  } else if(tab==='pax'){ h=`<div class="card" style="box-shadow:none"><table class="tbl"><thead><tr><th>#</th><th>Passenger Name</th><th>Type</th><th>Ticket No</th><th></th></tr></thead><tbody>`+
      ((b.pax.length?b.pax:[]).map((p,i)=>`<tr data-px="${i}"><td>${i+1}</td>
        <td><input data-pk="name" value="${esc(p.name||'')}" placeholder="Full name" style="width:100%"></td>
        <td><select data-pk="type" style="width:100px">${opt(PAXTYPE,p.type)}</select></td>
        <td><input data-pk="tkt" value="${esc(p.tkt||'')}" placeholder="Ticket #" style="width:100%"></td>
        <td style="text-align:right"><button class="tbtn danger" onclick="TK.paxDel(${i})">🗑</button></td></tr>`).join('')||`<tr><td class="empty" colspan="5">No passengers. Add one below.</td></tr>`)+
      `</tbody></table></div><div style="margin-top:10px"><button class="btn" onclick="TK.paxAdd()">＋ Add passenger</button></div>`;
  } else if(tab==='fare'){ h=`<div class="form">
      <div class="field"><label>Base Fare (৳)</label><input id="k-baseFare" type="number" value="${esc(b.baseFare||0)}"></div>
      <div class="field"><label>Taxes & Surcharge (৳)</label><input id="k-taxes" type="number" value="${esc(b.taxes||0)}"></div>
      <div class="field"><label>Cost / Net (৳)</label><input id="k-cost" type="number" value="${esc(b.cost||0)}"></div>
      <div class="field"><label>Advance Received (৳)</label><input id="k-advance" type="number" value="${esc(b.advance||0)}"></div>
      <div class="field"><label>&nbsp;</label><button class="btn" onclick="TK.recalc()">↻ Recalculate</button></div>
    </div>
    <div class="box" style="margin-top:8px;box-shadow:none"><div class="pay" style="grid-template-columns:1fr"><div>
      <div class="row"><span>Base Fare</span><span>${money(b.baseFare)}</span></div>
      <div class="row"><span>Taxes & Surcharge</span><span>${money(b.taxes)}</span></div>
      <div class="row tot"><span>Sale Price</span><span>${money(sale(b))}</span></div>
      <div class="row"><span>Cost</span><span>${money(b.cost)}</span></div>
      <div class="row"><span style="color:var(--green)">Profit</span><span style="color:var(--green)">${money(profit(b))}</span></div>
      <div class="row"><span>Advance</span><span>${money(b.advance)}</span></div>
      <div class="row" style="border-top:2px solid var(--border);padding-top:10px"><span>Due</span><span style="color:${due(b)>0?'var(--red)':'var(--green)'};font-weight:700">${money(due(b))}</span></div>
    </div></div></div>`;
  } else { h=`<div class="tk-ops">
      <button class="btn primary" onclick="TK.op('issue')">🎫 Issue Ticket</button>
      <button class="btn" onclick="TK.op('reissue')">🔁 Re-issue</button>
      <button class="btn" onclick="TK.op('refund')">↩️ Refund</button>
      <button class="btn" onclick="TK.op('void')">🚫 Void</button>
      <button class="btn" onclick="TK.op('emd')">➕ EMD / Ancillary</button>
    </div>
    <div style="margin-top:6px;font-size:11.5px;color:var(--text3)">Booking: <span class="pill ${BST_PILL[b.bookingStatus]||'muted'}">${esc(b.bookingStatus)}</span> · Ticket: <span class="pill ${TST_PILL[b.ticketStatus]||'muted'}">${esc(b.ticketStatus)}</span></div>
    <div class="tk-sec"><b>🕑 History</b><div class="vz-tl" style="margin-top:8px">${(b.history||[]).map(t=>`<div class="vz-tle"><span class="vz-dot"></span><div><b>${esc(t.at)}</b><div>${esc(t.text)}</div></div></div>`).join('')||'<div style="color:var(--text3);font-size:12.5px">No history.</div>'}</div></div>`; }
  document.getElementById('tk-mb').innerHTML=h;
}
function syncDraft(){ const g=id=>{const e=document.getElementById(id);return e?e.value:undefined;};
  if(tab==='overview'&&g('k-customer')!==undefined){ ['customer','pnr','airline','vendor','from','to','trip','cabin','travelDate','returnDate','remarks'].forEach(k=>draft[k]=g('k-'+k)); }
  if(tab==='fare'&&g('k-baseFare')!==undefined){ draft.baseFare=+g('k-baseFare')||0; draft.taxes=+g('k-taxes')||0; draft.cost=+g('k-cost')||0; draft.advance=+g('k-advance')||0; }
  if(tab==='pax'){ document.querySelectorAll('#tk-mb tr[data-px]').forEach(tr=>{ const i=+tr.getAttribute('data-px'); if(!draft.pax[i])return; tr.querySelectorAll('[data-pk]').forEach(el=>draft.pax[i][el.getAttribute('data-pk')]=el.value); }); }
}

window.TK={
  f(k,v){ flt[k]=v; draw(); if(k==='q'){const s=host.querySelector('.search input'); if(s){s.focus();s.setSelectionRange(s.value.length,s.value.length);}} },
  new(){ draft={id:uid('TS'),pnr:'',customer:'',airline:AIRLINES[0],vendor:'',from:AIRPORTS[0],to:AIRPORTS[3],trip:'Return',cabin:'Economy',travelDate:'',returnDate:'',pax:[{name:'',type:'Adult',tkt:''}],baseFare:0,taxes:0,cost:0,advance:0,bookingStatus:'Pending',ticketStatus:'Unissued',history:[{at:stamp(),text:'Booking created.'}],remarks:''}; editId=null; openModal(); },
  open(id){ const b=books.find(x=>x.id===id); if(!b)return; draft=JSON.parse(JSON.stringify(b)); editId=id; openModal(); },
  close(){ document.getElementById('tk-modal').classList.remove('open'); draft=null; editId=null; },
  tab(t){ syncDraft(); tab=t; renderTabs(); modalBody(); },
  save(){ syncDraft(); if(!draft.customer){ alert('Customer is required.'); return; }
    if(editId){ const i=books.findIndex(x=>x.id===editId); books[i]=draft; } else books.unshift(draft);
    save(); TK.close(); draw(); },
  recalc(){ syncDraft(); modalBody(); },
  paxAdd(){ syncDraft(); draft.pax.push({name:'',type:'Adult',tkt:''}); modalBody(); },
  paxDel(i){ syncDraft(); draft.pax.splice(i,1); modalBody(); },
  op(kind){ syncDraft(); const b=draft;
    if(kind==='issue'){ b.ticketStatus='Issued'; b.bookingStatus='Confirmed';
      (b.pax||[]).forEach((p,i)=>{ if(!p.tkt) p.tkt='000-'+(Math.floor(Math.random()*9e9)+1e9); });
      log(b,'Ticket issued — PNR '+(b.pnr||'n/a')+'.'); }
    else if(kind==='reissue'){ const d=prompt('Re-issue fare difference (৳):','0'); if(d===null)return; b.bookingStatus='Re-issued'; b.taxes=(+b.taxes||0)+(+d||0); log(b,'Re-issued. Fare difference ৳'+(+d||0)+'.'); }
    else if(kind==='refund'){ const r=prompt('Refund amount to customer (৳):',String(b.advance||0)); if(r===null)return; b.bookingStatus='Refunded'; b.ticketStatus='Refunded'; log(b,'Refunded ৳'+(+r||0)+' to customer.'); }
    else if(kind==='void'){ if(!confirm('Void this ticket?'))return; b.bookingStatus='Voided'; b.ticketStatus='Void'; log(b,'Ticket voided.'); }
    else if(kind==='emd'){ const desc=prompt('EMD / ancillary description (e.g. extra baggage):'); if(!desc)return; const amt=prompt('Amount (৳):','0'); b.taxes=(+b.taxes||0)+(+amt||0); log(b,'EMD added: '+desc+' (৳'+(+amt||0)+').'); }
    modalBody(); },
};
function log(b,text){ (b.history=b.history||[]).push({at:stamp(),text}); }

function ensureCss(){ if(document.getElementById('tk-css'))return; const s=document.createElement('style'); s.id='tk-css';
  s.textContent=`
  .tk-tabs{display:flex;gap:4px}
  .tk-tab{border:0;background:none;padding:11px 14px;font-size:12.5px;font-weight:600;color:var(--text2);cursor:pointer;border-bottom:2px solid transparent;font-family:inherit}
  .tk-tab.on{color:var(--accent);border-bottom-color:var(--accent)}
  .tk-ops{display:flex;flex-wrap:wrap;gap:9px;margin-bottom:6px}
  .tk-sec{margin-top:16px;border-top:1px solid var(--border);padding-top:13px;font-size:13px}`;
  document.head.appendChild(s);
  // reuse visa timeline styles if its css not present
  if(!document.getElementById('vz-css')){ const v=document.createElement('style'); v.id='tk-tl-css';
    v.textContent=`.vz-tl{padding-left:6px}.vz-tle{display:flex;gap:11px;padding:6px 0;font-size:12.5px}.vz-dot{width:9px;height:9px;border-radius:50%;background:var(--accent);margin-top:5px;flex-shrink:0;box-shadow:0 0 0 3px var(--accent-light)}`;
    document.head.appendChild(v); }
}

TP.onReady(()=>{
  TP.addGroup({grp:'ticketing-grp',label:'Air Ticketing (Pro)',ic:'✈️',section:'Operations Pro',nw:true});
  TP.registerPage({ id:'ticketing-pro', label:'Air Ticketing', sub:'Bookings, passengers, fares & ticket operations', ic:'🎫', group:'ticketing-grp', nw:true, render });
});
})();
