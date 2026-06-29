/* ════════════════════════════════════════════════════════════════════
   FEATURE: Quotation Builder  ·  New
   Self-contained module. Plugs into the Epal Travels portal via
   window.TravelPortal. Build multi-line quotes (flight + visa + hotel +
   transfer), auto-calc profit/VAT, send (mock WhatsApp), convert to
   booking, print. All data persists to localStorage (epal_tr_quotations).
   Remove the <script> tag in travel.html and this feature vanishes cleanly.
   ════════════════════════════════════════════════════════════════════ */
(function(){
"use strict";
const TP=window.TravelPortal;
if(!TP){ console.warn('[Quotation] TravelPortal not found — feature not loaded'); return; }
const {esc,uid,sum}=TP.helpers;

/* ---------- persistence (own namespace) ---------- */
const LS='epal_tr_quotations';
const SEED=[
  {id:'QT-4001',customer:'Rahim Enterprise',date:'2026-06-26',valid:'2026-07-10',currency:'৳',status:'Sent',
   items:[{type:'Flight',desc:'Dhaka → Dubai (DAC-DXB) · Emirates · Return',qty:2,cost:48000,sale:56000},
          {type:'Visa',desc:'UAE Tourist Visa · 30 days',qty:2,cost:9000,sale:14000}],
   discount:4000,tax:0,notes:'Fare valid for 48 hours. Subject to seat availability.'},
  {id:'QT-4002',customer:'GreenLand Tours',date:'2026-06-27',valid:'2026-07-05',currency:'৳',status:'Draft',
   items:[{type:'Flight',desc:'Dhaka → Kuala Lumpur (DAC-KUL) · Malaysia Airlines',qty:4,cost:39000,sale:46000},
          {type:'Hotel',desc:'KL 4★ · 3 nights · twin',qty:4,cost:12000,sale:16000},
          {type:'Transfer',desc:'Airport pickup + drop',qty:1,cost:3000,sale:5000}],
   discount:0,tax:5,notes:''}
];
let quotes=load();
function load(){ try{const r=localStorage.getItem(LS); if(r)return JSON.parse(r);}catch(e){} return SEED.map(x=>JSON.parse(JSON.stringify(x))); }
function save(){ try{localStorage.setItem(LS,JSON.stringify(quotes));}catch(e){} }

/* ---------- helpers ---------- */
const ITEM_TYPES=['Flight','Visa','Hotel','Transfer','Tour','Insurance','Other'];
const CURRENCIES=['৳','$','SAR','AED'];
const STATUSES=['Draft','Sent','Accepted','Rejected','Converted'];
const STATUS_PILL={Draft:'muted',Sent:'info',Accepted:'ok',Rejected:'bad',Converted:'purple'};
function fmt(n,cur){ return (cur||'৳')+' '+Number(n||0).toLocaleString('en-IN'); }
function lineTotal(it){ return (+it.qty||0)*(+it.sale||0); }
function lineProfit(it){ return (+it.qty||0)*((+it.sale||0)-(+it.cost||0)); }
function calc(q){
  const subtotal=sum(q.items||[],lineTotal);
  const itemProfit=sum(q.items||[],lineProfit);
  const discount=+q.discount||0;
  const taxable=Math.max(0,subtotal-discount);
  const taxAmt=taxable*((+q.tax||0)/100);
  const grand=taxable+taxAmt;
  const profit=itemProfit-discount;
  return {subtotal,discount,taxAmt,grand,profit};
}

/* ---------- view state ---------- */
let host=null, view='list', draft=null, editingId=null;
function render(el){ host=el||host; view==='edit'?renderEditor():renderList(); }
function rerender(){ render(host); }

/* ════════════════ LIST VIEW ════════════════ */
function renderList(){
  const rows=quotes.map(q=>{
    const c=calc(q);
    return `<tr>
      <td class="mono">${esc(q.id)}</td>
      <td class="strong">${esc(q.customer||'—')}</td>
      <td>${esc(q.date||'')}</td>
      <td>${esc(q.valid||'')}</td>
      <td>${(q.items||[]).length}</td>
      <td>${fmt(c.grand,q.currency)}</td>
      <td style="color:var(--green)">${fmt(c.profit,q.currency)}</td>
      <td><span class="pill ${STATUS_PILL[q.status]||'muted'}">${esc(q.status||'Draft')}</span></td>
      <td style="text-align:right;white-space:nowrap">
        <button class="tbtn" title="Edit" onclick="QUO.edit('${q.id}')">✏️</button>
        <button class="tbtn" title="Print" onclick="QUO.print('${q.id}')">🖨</button>
        <button class="tbtn danger" title="Delete" onclick="QUO.del('${q.id}')">🗑</button>
      </td></tr>`;
  }).join('')||`<tr><td class="empty" colspan="9">No quotations yet. Click “＋ New Quotation”.</td></tr>`;

  const tot=quotes.reduce((a,q)=>{const c=calc(q);a.grand+=c.grand;a.profit+=c.profit;return a;},{grand:0,profit:0});
  host.innerHTML=`
    <div class="ph"><div><h2>Quotation Builder <span class="badge-new">New</span></h2>
      <div class="sub">Build, send & convert customer quotes — flight, visa, hotel & more</div></div>
      <div class="ph-r"><button class="btn primary" onclick="QUO.newQuote()">＋ New Quotation</button></div></div>

    <div class="kpis">
      <div class="kpi"><div class="lbl">📄 Quotations</div><div class="val">${quotes.length}</div><div class="meta">${quotes.filter(q=>q.status==='Sent').length} sent · ${quotes.filter(q=>q.status==='Accepted').length} accepted</div></div>
      <div class="kpi"><div class="lbl">💰 Pipeline Value</div><div class="val" style="font-size:21px">${fmt(tot.grand)}</div><div class="meta">across all quotes</div></div>
      <div class="kpi"><div class="lbl">📈 Potential Profit</div><div class="val" style="font-size:21px;color:var(--green)">${fmt(tot.profit)}</div><div class="meta">if all accepted</div></div>
    </div>

    <div class="card"><table class="tbl">
      <thead><tr><th>Quote #</th><th>Customer</th><th>Date</th><th>Valid Till</th><th>Items</th><th>Grand Total</th><th>Profit</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>
      <tbody>${rows}</tbody></table></div>`;
}

/* ════════════════ EDITOR VIEW ════════════════ */
function blank(){ return {id:uid('QT'),customer:'',date:new Date().toISOString().slice(0,10),valid:'',currency:'৳',status:'Draft',items:[],discount:0,tax:0,notes:''}; }
function customerOpts(sel){
  const list=(TP.DB['customers']||[]).map(c=>c.name);
  return ['<option value="">— select customer —</option>',...list.map(n=>`<option${n===sel?' selected':''}>${esc(n)}</option>`)].join('');
}
function opt(arr,sel){ return arr.map(o=>`<option${String(o)===String(sel)?' selected':''}>${esc(o)}</option>`).join(''); }

function renderEditor(){
  const q=draft;
  const itemsRows=(q.items||[]).map((it,i)=>`
    <tr data-li="${i}">
      <td><select data-k="type" style="width:108px">${opt(ITEM_TYPES,it.type)}</select></td>
      <td><input data-k="desc" value="${esc(it.desc||'')}" placeholder="Description" style="min-width:200px;width:100%"></td>
      <td><input data-k="qty" type="number" min="0" value="${esc(it.qty)}" style="width:64px"></td>
      <td><input data-k="cost" type="number" min="0" value="${esc(it.cost)}" style="width:96px"></td>
      <td><input data-k="sale" type="number" min="0" value="${esc(it.sale)}" style="width:96px"></td>
      <td class="mono q-lt">${fmt(lineTotal(it),q.currency)}</td>
      <td class="mono q-lp" style="color:var(--green)">${fmt(lineProfit(it),q.currency)}</td>
      <td style="text-align:right"><button class="tbtn danger" title="Remove" onclick="QUO.removeItem(${i})">🗑</button></td>
    </tr>`).join('')||`<tr><td class="empty" colspan="8">No line items. Click “＋ Add line item”.</td></tr>`;

  host.innerHTML=`
    <div class="ph"><div><h2>${editingId?'Edit':'New'} Quotation <span class="badge-new">New</span>
      <span class="mono" style="font-size:13px;color:var(--text3)">${esc(q.id)}</span></h2>
      <div class="sub">Fill the sections below, then save / send / convert</div></div>
      <div class="ph-r"><button class="btn" onclick="QUO.back()">← Back to list</button></div></div>

   <div id="q-editor">
    <!-- Section 1: Quotation info -->
    <div class="box"><h3>🧾 Quotation Info</h3>
      <div class="form">
        <div class="field"><label>Customer</label><select data-f="customer">${customerOpts(q.customer)}</select></div>
        <div class="field"><label>Status</label><select data-f="status">${opt(STATUSES,q.status)}</select></div>
        <div class="field"><label>Quote Date</label><input data-f="date" type="date" value="${esc(q.date)}"></div>
        <div class="field"><label>Valid Till</label><input data-f="valid" type="date" value="${esc(q.valid)}"></div>
        <div class="field"><label>Currency</label><select data-f="currency">${opt(CURRENCIES,q.currency)}</select></div>
      </div>
    </div>

    <!-- Section 2: Line items -->
    <div class="box"><h3>📦 Line Items <span class="sp" onclick="QUO.addItem()">＋ Add line item</span></h3>
      <div class="card" style="box-shadow:none"><table class="tbl">
        <thead><tr><th>Type</th><th>Description</th><th>Qty</th><th>Unit Cost</th><th>Unit Sale</th><th>Line Total</th><th>Profit</th><th></th></tr></thead>
        <tbody>${itemsRows}</tbody></table></div>
      <div style="margin-top:10px"><button class="btn" onclick="QUO.addItem()">＋ Add line item</button></div>
    </div>

    <div class="two">
      <!-- Section 3: Charges + notes -->
      <div>
        <div class="box"><h3>💸 Charges</h3>
          <div class="form">
            <div class="field"><label>Discount (${esc(q.currency)})</label><input data-f="discount" type="number" min="0" value="${esc(q.discount)}"></div>
            <div class="field"><label>VAT / Tax (%)</label><input data-f="tax" type="number" min="0" value="${esc(q.tax)}"></div>
          </div>
        </div>
        <div class="box"><h3>📝 Notes / Terms</h3>
          <textarea data-f="notes" rows="4" style="width:100%;box-sizing:border-box;border:1px solid var(--border2);background:var(--bg);border-radius:9px;padding:9px 12px;font-size:13px;font-family:inherit;color:var(--text);outline:none" placeholder="Fare rules, payment terms, validity…">${esc(q.notes||'')}</textarea>
        </div>
      </div>
      <!-- Section 4: Live summary -->
      <div>
        <div class="box"><h3>🧮 Summary</h3><div id="q-summary">${summaryHTML(q)}</div></div>
        <!-- Section 5: Actions -->
        <div class="box"><h3>⚡ Actions</h3>
          <div style="display:flex;flex-direction:column;gap:9px">
            <button class="btn primary" onclick="QUO.saveDraft()">💾 Save Quotation</button>
            <button class="btn" onclick="QUO.markSent()">📲 Save &amp; Send via WhatsApp</button>
            <button class="btn" onclick="QUO.convert()">🔄 Convert to Booking</button>
            <button class="btn" onclick="QUO.print()">🖨 Print / PDF</button>
          </div>
        </div>
      </div>
    </div>
   </div>`;

  // delegated live recalculation (keeps focus while typing)
  const ed=host.querySelector('#q-editor');
  ed.addEventListener('input',sync);
  ed.addEventListener('change',sync);
}

function summaryHTML(q){
  const c=calc(q);
  return `
    <div class="pay" style="grid-template-columns:1fr">
      <div>
        <div class="row"><span>Subtotal (${(q.items||[]).length} items)</span><span>${fmt(c.subtotal,q.currency)}</span></div>
        <div class="row"><span>Discount</span><span style="color:var(--red)">− ${fmt(c.discount,q.currency)}</span></div>
        <div class="row"><span>VAT / Tax (${+q.tax||0}%)</span><span>${fmt(c.taxAmt,q.currency)}</span></div>
        <div class="row tot"><span>Grand Total</span><span>${fmt(c.grand,q.currency)}</span></div>
        <div class="row" style="border:none"><span style="color:var(--green);font-weight:700">Total Profit</span><span style="color:var(--green);font-weight:700">${fmt(c.profit,q.currency)}</span></div>
      </div>
    </div>`;
}

/* read DOM → draft, recompute live cells */
function sync(){
  if(!draft) return;
  host.querySelectorAll('#q-editor [data-f]').forEach(el=>{
    const k=el.getAttribute('data-f');
    draft[k]=(el.type==='number')?(el.value===''?0:Number(el.value)):el.value;
  });
  host.querySelectorAll('#q-editor tr[data-li]').forEach(tr=>{
    const i=+tr.getAttribute('data-li'); const it=draft.items[i]; if(!it) return;
    tr.querySelectorAll('[data-k]').forEach(el=>{
      const k=el.getAttribute('data-k');
      it[k]=(el.type==='number')?(el.value===''?0:Number(el.value)):el.value;
    });
    const lt=tr.querySelector('.q-lt'), lp=tr.querySelector('.q-lp');
    if(lt) lt.textContent=fmt(lineTotal(it),draft.currency);
    if(lp) lp.textContent=fmt(lineProfit(it),draft.currency);
  });
  const s=host.querySelector('#q-summary'); if(s) s.innerHTML=summaryHTML(draft);
}

/* ════════════════ PRINT ════════════════ */
function printQuote(q){
  const c=calc(q);
  const rows=(q.items||[]).map(it=>`<tr><td>${esc(it.type)}</td><td>${esc(it.desc||'')}</td><td style="text-align:center">${esc(it.qty)}</td><td style="text-align:right">${fmt(lineTotal(it),q.currency)}</td></tr>`).join('');
  const w=window.open('','_blank');
  if(!w){ alert('Allow pop-ups to print the quotation.'); return; }
  w.document.write(`<!doctype html><html><head><title>${esc(q.id)} — Quotation</title>
    <style>body{font-family:'DM Sans',Arial,sans-serif;color:#1a2035;padding:36px;max-width:760px;margin:auto}
    h1{font-size:22px;margin:0}.muted{color:#5a6480;font-size:13px}
    table{width:100%;border-collapse:collapse;margin-top:18px;font-size:13px}
    th,td{padding:9px 10px;border-bottom:1px solid #e4e8f0;text-align:left}
    th{background:#f0f2f8;font-size:11px;text-transform:uppercase;letter-spacing:.4px}
    .tot{margin-top:16px;width:280px;margin-left:auto;font-size:13px}
    .tot div{display:flex;justify-content:space-between;padding:5px 0}
    .tot .g{font-weight:700;font-size:16px;border-top:2px solid #1a2035;padding-top:8px}
    .hd{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #2563eb;padding-bottom:14px}
    .logo{font-weight:800;font-size:20px;color:#2563eb;font-style:italic}</style></head>
    <body>
    <div class="hd"><div><div class="logo">Epal Travels</div><div class="muted">Air Ticketing · Visa · Holidays</div></div>
      <div style="text-align:right"><h1>QUOTATION</h1><div class="muted">${esc(q.id)}<br>Date: ${esc(q.date||'')}<br>Valid till: ${esc(q.valid||'—')}</div></div></div>
    <p style="margin-top:16px"><b>To:</b> ${esc(q.customer||'—')}<br><span class="pill">Status: ${esc(q.status||'Draft')}</span></p>
    <table><thead><tr><th>Type</th><th>Description</th><th style="text-align:center">Qty</th><th style="text-align:right">Amount</th></tr></thead><tbody>${rows||'<tr><td colspan=4>No items</td></tr>'}</tbody></table>
    <div class="tot">
      <div><span>Subtotal</span><span>${fmt(c.subtotal,q.currency)}</span></div>
      <div><span>Discount</span><span>− ${fmt(c.discount,q.currency)}</span></div>
      <div><span>VAT/Tax (${+q.tax||0}%)</span><span>${fmt(c.taxAmt,q.currency)}</span></div>
      <div class="g"><span>Grand Total</span><span>${fmt(c.grand,q.currency)}</span></div></div>
    ${q.notes?`<p class="muted" style="margin-top:20px"><b>Notes:</b><br>${esc(q.notes)}</p>`:''}
    <p class="muted" style="margin-top:30px">Thank you for choosing Epal Travels.</p>
    <script>window.onload=function(){window.print();}<\/script></body></html>`);
  w.document.close();
}

/* ════════════════ PUBLIC HANDLERS ════════════════ */
window.QUO={
  newQuote(){ draft=blank(); editingId=null; view='edit'; rerender(); },
  edit(id){ const q=quotes.find(x=>x.id===id); if(!q)return; draft=JSON.parse(JSON.stringify(q)); editingId=id; view='edit'; rerender(); },
  del(id){ if(!confirm('Delete this quotation?'))return; quotes=quotes.filter(x=>x.id!==id); save(); rerender(); },
  back(){ view='list'; draft=null; editingId=null; rerender(); },
  addItem(){ sync(); draft.items.push({type:'Flight',desc:'',qty:1,cost:0,sale:0}); rerender(); },
  removeItem(i){ sync(); draft.items.splice(i,1); rerender(); },
  saveDraft(){ commit(); QUO.back(); },
  markSent(){ sync(); draft.status='Sent'; commit(true);
    alert('📲 WhatsApp (mock)\n\nQuotation '+draft.id+' for '+(draft.customer||'customer')+'\nGrand total: '+fmt(calc(draft).grand,draft.currency)+'\n\nIn the real app this opens a WhatsApp template with the PDF link.');
    QUO.back(); },
  convert(){ sync(); draft.status='Converted'; commit(true);
    alert('🔄 Convert to Booking (mock)\n\n'+draft.id+' → a new Ticket Sale / Visa booking would be created from these line items, and a receivable added to Payment Schedules.');
    QUO.back(); },
  print(id){ if(id&&typeof id==='string'){ const q=quotes.find(x=>x.id===id); if(q)printQuote(q); } else { sync(); printQuote(draft); } }
};
function commit(silent){
  sync();
  const i=quotes.findIndex(x=>x.id===draft.id);
  if(i>=0) quotes[i]=JSON.parse(JSON.stringify(draft));
  else quotes.unshift(JSON.parse(JSON.stringify(draft)));
  save();
  if(!silent){ /* stay quiet on plain save */ }
}

/* ════════════════ REGISTER WITH PORTAL ════════════════ */
TP.onReady(()=>{
  // 1) create the group first (nice label + section + New badge on the group)
  TP.addGroup({grp:'sales-tools',label:'Sales Tools',ic:'🧰',section:'Sales Tools',nw:true});
  // 2) register the page — this also attaches the nav item under the group
  TP.registerPage({
    id:'quotation',
    label:'Quotation Builder',
    sub:'Build, send & convert customer quotes',
    ic:'🧮',
    group:'sales-tools',
    nw:true,
    render:render
  });
});
})();
