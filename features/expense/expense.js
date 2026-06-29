/* ════════════════════════════════════════════════════════════════════
   FEATURE: Expense Claims (ESS)  ·  New
   Self-contained module via window.TravelPortal. Lets the employee submit
   reimbursement claims with a receipt, track approval status, and see
   month totals. Persists to localStorage (epal_tr_expenses). Lives under
   the "Self Service" sidebar group.
   ════════════════════════════════════════════════════════════════════ */
(function(){
"use strict";
const TP=window.TravelPortal;
if(!TP){ console.warn('[Expense] TravelPortal not found — feature not loaded'); return; }
const {esc,money,uid,sum,pretty}=TP.helpers;

const LS='epal_tr_expenses';
const CATS=['Travel','Transport','Food','Office','Client Meeting','Visa Fee','Other'];
const STATUSES=['Pending','Approved','Rejected','Reimbursed'];
const PILL={Pending:'warn',Approved:'info',Rejected:'bad',Reimbursed:'ok'};

let claims=load();
function load(){ try{const r=localStorage.getItem(LS); if(r)return JSON.parse(r);}catch(e){} return SEED(); }
function save(){ try{localStorage.setItem(LS,JSON.stringify(claims));}catch(e){} }
function SEED(){ return [
  {id:'EXP-2201',date:'2026-06-24',category:'Transport',desc:'CNG to embassy for client visa drop',amount:450,receipt:'cng-receipt.jpg',status:'Approved'},
  {id:'EXP-2202',date:'2026-06-26',category:'Client Meeting',desc:'Lunch with GreenLand Tours',amount:2200,receipt:'lunch-bill.pdf',status:'Pending'},
  {id:'EXP-2203',date:'2026-06-27',category:'Office',desc:'Printer toner for ticketing desk',amount:1800,receipt:'',status:'Pending'}
];}

let host=null;
function render(el){ host=el||host; draw(); }

function draw(){
  const mTotal=sum(claims,c=>c.amount);
  const pend=claims.filter(c=>c.status==='Pending');
  const appr=sum(claims.filter(c=>c.status==='Approved'),c=>c.amount);
  const reimb=sum(claims.filter(c=>c.status==='Reimbursed'),c=>c.amount);

  const rows=claims.map(c=>`
    <tr>
      <td class="mono">${esc(c.id)}</td>
      <td>${esc(c.date)}</td>
      <td>${esc(c.category)}</td>
      <td class="strong">${esc(c.desc)}</td>
      <td>${money(c.amount)}</td>
      <td>${c.receipt?`<span class="pill info">📎 ${esc(c.receipt)}</span>`:'<span class="pill muted">none</span>'}</td>
      <td><span class="pill ${PILL[c.status]||'muted'}">${esc(c.status)}</span></td>
      <td style="text-align:right;white-space:nowrap">
        ${c.status==='Pending'?`<button class="tbtn" title="Mark Approved (demo)" onclick="EXP.setStatus('${c.id}','Approved')">✓</button>`:''}
        <button class="tbtn danger" title="Delete" onclick="EXP.del('${c.id}')">🗑</button>
      </td>
    </tr>`).join('')||`<tr><td class="empty" colspan="8">No claims yet. Submit one above.</td></tr>`;

  host.innerHTML=`
    <div class="ph"><div><h2>Expense Claims <span class="badge-new">New</span></h2>
      <div class="sub">Submit reimbursements, attach receipts & track approval</div></div></div>

    <div class="bal">
      <div class="b"><div class="n">${money(mTotal).replace('৳','৳')}</div><div class="t">Total Claimed</div></div>
      <div class="b"><div class="n" style="color:var(--amber)">${pend.length}</div><div class="t">Pending</div></div>
      <div class="b"><div class="n" style="color:var(--accent)">${money(appr)}</div><div class="t">Approved</div></div>
      <div class="b"><div class="n" style="color:var(--green)">${money(reimb)}</div><div class="t">Reimbursed</div></div>
    </div>

    <div class="box"><h3>➕ New Claim</h3>
      <div class="form">
        <div class="field"><label>Date <span style="color:var(--red)">*</span></label><input id="x-date" type="date" value="${new Date().toISOString().slice(0,10)}"></div>
        <div class="field"><label>Category <span style="color:var(--red)">*</span></label><select id="x-cat">${CATS.map(c=>`<option>${esc(c)}</option>`).join('')}</select></div>
        <div class="field full"><label>Description <span style="color:var(--red)">*</span></label><input id="x-desc" placeholder="What was this expense for?"></div>
        <div class="field"><label>Amount (৳) <span style="color:var(--red)">*</span></label><input id="x-amt" type="number" min="0" placeholder="0"></div>
        <div class="field"><label>Receipt</label><input id="x-file" type="file"></div>
      </div>
      <div style="margin-top:14px;display:flex;gap:10px"><button class="btn primary" onclick="EXP.add()">Submit Claim</button>
        <button class="btn" onclick="EXP.reset()">Clear</button></div>
    </div>

    <div class="card"><table class="tbl">
      <thead><tr><th>Claim #</th><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th>Receipt</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>
      <tbody>${rows}</tbody></table></div>`;
}

window.EXP={
  add(){
    const d=TP.helpers.$('x-date').value, cat=TP.helpers.$('x-cat').value,
          desc=TP.helpers.$('x-desc').value.trim(), amt=Number(TP.helpers.$('x-amt').value||0),
          fileEl=TP.helpers.$('x-file'), file=fileEl&&fileEl.files&&fileEl.files[0]?fileEl.files[0].name:'';
    if(!d||!desc||!amt){ alert('Please fill Date, Description and Amount.'); return; }
    claims.unshift({id:uid('EXP'),date:d,category:cat,desc,amount:amt,receipt:file,status:'Pending'});
    save(); draw();
  },
  reset(){ draw(); },
  setStatus(id,s){ const c=claims.find(x=>x.id===id); if(c){ c.status=s; save(); draw(); } },
  del(id){ if(!confirm('Delete this claim?'))return; claims=claims.filter(x=>x.id!==id); save(); draw(); }
};

TP.onReady(()=>{
  // lives inside the existing "Self Service" group (grp 'me')
  TP.registerPage({ id:'ess-expense', label:'Expense Claims', sub:'Reimbursement claims & status',
    ic:'🧾', group:'me', nw:true, render });
});
})();
