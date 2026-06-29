/* ════════════════════════════════════════════════════════════════════
   FEATURE: Expiry & Compliance Center  ·  New
   Self-contained module via window.TravelPortal. Surfaces things that
   silently cost agencies money: passports about to expire, visas with
   travel dates approaching, unsold (unused) ticket stock, and overdue
   payments. Reads live data from the core resources; interactive
   (renew passport, mark paid) with results written back to the store.
   ════════════════════════════════════════════════════════════════════ */
(function(){
"use strict";
const TP=window.TravelPortal;
if(!TP){ console.warn('[Compliance] TravelPortal not found — feature not loaded'); return; }
const {esc,money}=TP.helpers;

/* ---------- date helpers ---------- */
function today(){ const d=new Date(); d.setHours(0,0,0,0); return d; }
function daysUntil(str){ if(!str) return null; const d=new Date(str); if(isNaN(d)) return null; d.setHours(0,0,0,0); return Math.round((d-today())/86400000); }
function dayPill(n){ // n = days until expiry/due (negative = past)
  if(n===null) return '<span class="pill muted">—</span>';
  if(n<0)  return `<span class="pill bad">Expired ${Math.abs(n)}d ago</span>`;
  if(n<=30) return `<span class="pill bad">${n}d left</span>`;
  if(n<=60) return `<span class="pill warn">${n}d left</span>`;
  if(n<=90) return `<span class="pill info">${n}d left</span>`;
  return `<span class="pill ok">${n}d left</span>`;
}
function addYears(str,y){ const d=new Date(str||today()); d.setFullYear(d.getFullYear()+y); return d.toISOString().slice(0,10); }

/* ---------- view state ---------- */
let host=null, win=90;   // passport window filter (days); 9999 = all
function render(el){ host=el||host; draw(); }
function rerender(){ draw(); }

/* ---------- data selectors ---------- */
function passports(){
  return (TP.DB['passport-holders']||[]).map(p=>({...p,_d:daysUntil(p.expiryDate)}))
    .filter(p=>p._d!==null).sort((a,b)=>a._d-b._d);
}
function expiringPassports(){
  return passports().filter(p=>win>=9999 ? true : p._d<=win);
}
function visaAttention(){
  return (TP.DB['visa']||[]).map(v=>({...v,_d:daysUntil(v.travelDate)}))
    .filter(v=>!['approved','rejected'].includes(v.status) && v._d!==null)
    .sort((a,b)=>a._d-b._d);
}
function unusedTickets(){
  return (TP.DB['tickets']||[]).map(t=>({...t,_rem:(+t.qty||0)-(+t.sold||0)}))
    .filter(t=>t.status==='Active' && t._rem>0).sort((a,b)=>b._rem-a._rem);
}
function overduePayments(){
  return (TP.DB['payment-schedules']||[]).map(p=>({...p,_d:daysUntil(p.dueDate)}))
    .filter(p=>p.status!=='paid' && p.status!=='cancelled' && p._d!==null && p._d<0)
    .sort((a,b)=>a._d-b._d);
}

/* ---------- render ---------- */
function draw(){
  const ps=passports(), va=visaAttention(), ut=unusedTickets(), od=overduePayments();
  const soon=ps.filter(p=>p._d<=90).length;
  const unusedSeats=ut.reduce((a,t)=>a+t._rem,0);
  const odTotal=od.reduce((a,p)=>a+(+p.amount||0),0);

  const winBtn=(v,l)=>`<button class="btn${win===v?' primary':''}" style="padding:6px 12px" onclick="CMP.win(${v})">${l}</button>`;

  const pRows=expiringPassports().map(p=>`
    <tr>
      <td class="strong">${esc(p.name)}</td>
      <td class="mono">${esc(p.passportNo||'—')}</td>
      <td>${esc(p.nationality||'')}</td>
      <td class="mono">${esc(p.expiryDate||'')}</td>
      <td>${dayPill(p._d)}</td>
      <td style="text-align:right"><button class="tbtn" title="Mark renewed (+5y)" onclick="CMP.renew('${p.id}')">🔄</button></td>
    </tr>`).join('')||`<tr><td class="empty" colspan="6">No passports in this window 🎉</td></tr>`;

  const vRows=va.map(v=>`
    <tr><td class="mono">${esc(v.id)}</td><td class="strong">${esc(v.applicant)}</td><td>${esc(v.country)}</td>
      <td>${esc(TP.helpers.pretty(v.status))}</td><td class="mono">${esc(v.travelDate||'—')}</td><td>${dayPill(v._d)}</td></tr>`
  ).join('')||`<tr><td class="empty" colspan="6">No visas with upcoming travel dates.</td></tr>`;

  const tRows=ut.map(t=>`
    <tr><td class="strong">${esc(t.route)}</td><td>${esc(t.airline)}</td>
      <td><span class="pill warn">${t._rem} unsold</span></td><td>${t.sold||0}/${t.qty||0} sold</td>
      <td>${money(t.price)}</td></tr>`
  ).join('')||`<tr><td class="empty" colspan="5">No unused stock.</td></tr>`;

  const oRows=od.map(p=>`
    <tr><td class="strong">${esc(p.party)}</td>
      <td><span class="pill ${p.type==='payable'?'bad':'ok'}">${esc(TP.helpers.pretty(p.type))}</span></td>
      <td>${money(p.amount)}</td><td class="mono">${esc(p.dueDate)}</td><td>${dayPill(p._d)}</td>
      <td style="text-align:right"><button class="tbtn" title="Mark paid" onclick="CMP.pay('${p.id}')">💳</button></td></tr>`
  ).join('')||`<tr><td class="empty" colspan="6">Nothing overdue 🎉</td></tr>`;

  host.innerHTML=`
    <div class="ph"><div><h2>Expiry &amp; Compliance Center <span class="badge-new">New</span></h2>
      <div class="sub">Catch expiring passports, approaching travel dates, unsold stock & overdue money before they cost you</div></div></div>

    <div class="kpis">
      <div class="kpi"><div class="lbl">📓 Passports expiring ≤90d</div><div class="val" style="color:${soon?'var(--red)':'var(--green)'}">${soon}</div><div class="meta">${ps.length} tracked</div></div>
      <div class="kpi"><div class="lbl">🛂 Visas needing attention</div><div class="val">${va.length}</div><div class="meta">travel date set, not yet approved</div></div>
      <div class="kpi"><div class="lbl">🎫 Unsold ticket seats</div><div class="val" style="color:var(--amber)">${unusedSeats}</div><div class="meta">across ${ut.length} active routes</div></div>
      <div class="kpi"><div class="lbl">💳 Overdue amount</div><div class="val" style="font-size:21px;color:var(--red)">${money(odTotal)}</div><div class="meta">${od.length} overdue items</div></div>
    </div>

    <div class="box"><h3>📓 Passport Expiry
      <span style="margin-left:auto;display:flex;gap:7px">${winBtn(30,'≤30d')}${winBtn(60,'≤60d')}${winBtn(90,'≤90d')}${winBtn(9999,'All')}</span></h3>
      <div class="card" style="box-shadow:none"><table class="tbl">
        <thead><tr><th>Holder</th><th>Passport No</th><th>Nationality</th><th>Expiry</th><th>Status</th><th style="text-align:right">Action</th></tr></thead>
        <tbody>${pRows}</tbody></table></div>
    </div>

    <div class="two">
      <div>
        <div class="box"><h3>🛂 Visa — Travel Date Approaching <span class="sp" onclick="TravelPortal.go('visa')">Open board →</span></h3>
          <table class="tbl"><thead><tr><th>App#</th><th>Applicant</th><th>Country</th><th>Status</th><th>Travel</th><th>Countdown</th></tr></thead>
          <tbody>${vRows}</tbody></table></div>
        <div class="box"><h3>🎫 Unused Ticket Stock <span class="sp" onclick="TravelPortal.go('tickets')">Inventory →</span></h3>
          <table class="tbl"><thead><tr><th>Route</th><th>Airline</th><th>Unsold</th><th>Progress</th><th>Cost</th></tr></thead>
          <tbody>${tRows}</tbody></table></div>
      </div>
      <div>
        <div class="box"><h3>💳 Overdue Payments <span class="sp" onclick="TravelPortal.go('payment-schedules')">Schedules →</span></h3>
          <table class="tbl"><thead><tr><th>Party</th><th>Type</th><th>Amount</th><th>Due</th><th>Overdue</th><th></th></tr></thead>
          <tbody>${oRows}</tbody></table></div>
      </div>
    </div>`;
}

/* ---------- handlers ---------- */
window.CMP={
  win(v){ win=v; rerender(); },
  renew(id){ const p=(TP.DB['passport-holders']||[]).find(x=>x.id===id); if(!p)return;
    p.issueDate=new Date().toISOString().slice(0,10); p.expiryDate=addYears(p.issueDate,5); p.status='Active';
    TP.store.saveRes('passport-holders'); rerender(); },
  pay(id){ const p=(TP.DB['payment-schedules']||[]).find(x=>x.id===id); if(!p)return;
    p.status='paid'; TP.store.saveRes('payment-schedules'); rerender(); }
};

/* ---------- register ---------- */
TP.onReady(()=>{
  // group first (nice label + "Alerts" section + New badge), then the page
  TP.addGroup({grp:'compliance-grp',label:'Compliance',ic:'🛡',section:'Alerts',nw:true});
  TP.registerPage({
    id:'compliance', label:'Expiry & Compliance', sub:'Expiry, SLA, unused stock & overdue alerts',
    ic:'⏰', group:'compliance-grp', nw:true, render
  });
});
})();
