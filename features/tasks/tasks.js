/* ════════════════════════════════════════════════════════════════════
   FEATURE: Task Management (Team)  ·  New
   World-class employee task management — board + list views, assignee,
   priority, due dates, labels, checklists (sub-tasks) with live progress,
   comments, filters & a rich detail modal. Drag-drop across columns.
   Modular: plugs in via window.TravelPortal, persists to localStorage
   (epal_tr_tasks). Self-contained styles injected once.
   ════════════════════════════════════════════════════════════════════ */
(function(){
"use strict";
const TP=window.TravelPortal;
if(!TP){ console.warn('[Tasks] TravelPortal not found'); return; }
const {esc,uid,pretty}=TP.helpers;
const OFFICERS=TP.pools.OFFICERS;

/* ---------- model ---------- */
const LS='epal_tr_tasks';
const COLS=[{k:'todo',t:'To Do',c:'#94a3b8'},{k:'progress',t:'In Progress',c:'#2563eb'},{k:'review',t:'Review',c:'#d97706'},{k:'done',t:'Done',c:'#16a34a'}];
const PRIO=['Urgent','High','Medium','Low'];
const PRIO_PILL={Urgent:'bad',High:'warn',Medium:'info',Low:'muted'};
const TAGS=['Air Ticket','Visa','Customer','Finance','Documents','Follow-up','Internal'];

let tasks=load();
function load(){ try{const r=localStorage.getItem(LS); if(r)return JSON.parse(r);}catch(e){} return SEED(); }
function save(){ try{localStorage.setItem(LS,JSON.stringify(tasks));}catch(e){} }
function SEED(){ return [
  {id:'TSK-9001',title:'Issue Emirates tickets — Rahim Enterprise',desc:'2 pax DAC-DXB return, confirm seats then issue & invoice.',assignee:'Imran Hossain',priority:'High',status:'progress',due:'2026-06-30',tags:['Air Ticket'],checklist:[{t:'Confirm seat availability',done:true},{t:'Collect payment',done:true},{t:'Issue ticket',done:false},{t:'Send invoice',done:false}],comments:[{by:'Fahim Rahman',at:'2026-06-28',text:'Customer wants window seats.'}]},
  {id:'TSK-9002',title:'Follow up Schengen docs — Rumana Begum',desc:'Awaiting bank statement before file submission.',assignee:'Mitu Rani',priority:'Urgent',status:'todo',due:'2026-06-29',tags:['Visa','Follow-up'],checklist:[{t:'Request bank statement',done:true},{t:'Verify 6-month balance',done:false}],comments:[]},
  {id:'TSK-9003',title:'Send Umrah package quote — Delwar',desc:'Quote for group of 4, Makkah 5★.',assignee:'Imran Hossain',priority:'Medium',status:'review',due:'2026-07-02',tags:['Customer','Visa'],checklist:[{t:'Build quotation',done:true},{t:'Manager review',done:false}],comments:[]},
  {id:'TSK-9004',title:'Reconcile SkyLink GSA payment',desc:'Match ৳95,000 settlement against invoices.',assignee:'Tareq Aziz',priority:'Low',status:'todo',due:'2026-07-05',tags:['Finance'],checklist:[],comments:[]},
  {id:'TSK-9005',title:'Confirm Malaysia visa submission',desc:'Submitted at embassy, awaiting biometric date.',assignee:'Fatema Akter',priority:'Medium',status:'done',due:'2026-06-27',tags:['Visa'],checklist:[{t:'Submit application',done:true},{t:'Book biometric',done:true}],comments:[]}
];}

/* ---------- helpers ---------- */
const initials=n=>String(n||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
const prog=t=>{const c=t.checklist||[];return c.length?Math.round(c.filter(x=>x.done).length/c.length*100):(t.status==='done'?100:0);};
function dueState(t){ if(!t.due) return ''; const d=new Date(t.due);d.setHours(0,0,0,0);const n=new Date();n.setHours(0,0,0,0);
  const diff=Math.round((d-n)/86400000); if(t.status==='done') return ''; if(diff<0) return 'bad'; if(diff===0) return 'warn'; return ''; }
const today=()=>{const d=new Date();d.setHours(0,0,0,0);return d;};

/* ---------- view state ---------- */
let host=null, view='board', flt={q:'',assignee:'',priority:''}, draft=null, editId=null;
function render(el){ host=el||host; ensureCss(); ensureModal(); draw(); }

function filtered(){
  return tasks.filter(t=>{
    if(flt.assignee&&t.assignee!==flt.assignee) return false;
    if(flt.priority&&t.priority!==flt.priority) return false;
    if(flt.q){ const q=flt.q.toLowerCase(); if(!(`${t.title} ${t.desc} ${t.assignee} ${(t.tags||[]).join(' ')}`.toLowerCase().includes(q))) return false; }
    return true;
  });
}

/* ---------- page ---------- */
function draw(){
  const data=filtered();
  const due0=tasks.filter(t=>t.status!=='done'&&t.due&&new Date(t.due).setHours(0,0,0,0)===+today()).length;
  const overdue=tasks.filter(t=>t.status!=='done'&&t.due&&new Date(t.due).setHours(0,0,0,0)<+today()).length;
  const done=tasks.filter(t=>t.status==='done').length;

  const opt=(arr,sel)=>arr.map(o=>`<option${o===sel?' selected':''}>${esc(o)}</option>`).join('');
  host.innerHTML=`
    <div class="ph"><div><h2>Task Management <span class="badge-new">New</span></h2>
      <div class="sub">Assign, track & collaborate on every operational task</div></div>
      <div class="ph-r">
        <div class="tsk-viewtog"><button class="${view==='board'?'on':''}" onclick="TSK.view('board')">▦ Board</button><button class="${view==='list'?'on':''}" onclick="TSK.view('list')">≣ List</button></div>
        <button class="btn primary" onclick="TSK.new()">＋ New Task</button>
      </div></div>

    <div class="kpis">
      <div class="kpi"><div class="lbl">📋 Total Tasks</div><div class="val">${tasks.length}</div><div class="meta">${data.length} shown</div></div>
      <div class="kpi"><div class="lbl">📅 Due Today</div><div class="val" style="color:var(--amber)">${due0}</div><div class="meta">act before EOD</div></div>
      <div class="kpi"><div class="lbl">⚠️ Overdue</div><div class="val" style="color:var(--red)">${overdue}</div><div class="meta">past due date</div></div>
      <div class="kpi"><div class="lbl">✅ Completed</div><div class="val" style="color:var(--green)">${done}</div><div class="meta">marked done</div></div>
    </div>

    <div class="toolbar">
      <div class="search"><input placeholder="Search tasks…" value="${esc(flt.q)}" oninput="TSK.f('q',this.value)"></div>
      <select onchange="TSK.f('assignee',this.value)"><option value="">All assignees</option>${opt(OFFICERS,flt.assignee)}</select>
      <select onchange="TSK.f('priority',this.value)"><option value="">All priorities</option>${opt(PRIO,flt.priority)}</select>
      <span class="ct">${data.length} task${data.length===1?'':'s'}</span>
    </div>
    ${view==='board'?board(data):list(data)}`;
}

function card(t){
  const p=prog(t), ds=dueState(t);
  const tags=(t.tags||[]).map(x=>`<span class="tsk-tag">${esc(x)}</span>`).join('');
  const cl=t.checklist||[];
  return `<div class="kcard" draggable="true" ondragstart="TSK.dstart(event,'${t.id}')" ondragend="TSK.dend(event)" onclick="TSK.open('${t.id}')">
    <div class="foot" style="margin:0 0 6px"><span class="pill ${PRIO_PILL[t.priority]||'muted'}">${esc(t.priority)}</span>${t.due?`<span class="pill ${ds||'muted'}" style="margin-left:auto">📅 ${esc(t.due)}</span>`:''}</div>
    <div class="t">${esc(t.title)}</div>
    ${tags?`<div style="margin:7px 0 2px">${tags}</div>`:''}
    ${cl.length?`<div class="tsk-prog"><div class="tsk-prog-b" style="width:${p}%"></div></div><div class="tsk-prog-x">${cl.filter(x=>x.done).length}/${cl.length} · ${p}%</div>`:''}
    <div class="foot"><span class="tsk-av" title="${esc(t.assignee||'')}">${initials(t.assignee)}</span>
      <span style="font-size:11px;color:var(--text3)">${esc(t.assignee||'Unassigned')}</span>
      ${(t.comments||[]).length?`<span style="margin-left:auto;font-size:11px;color:var(--text3)">💬 ${t.comments.length}</span>`:''}
    </div></div>`;
}
function board(data){
  return `<div class="kanban">${COLS.map(c=>{
    const items=data.filter(t=>t.status===c.k);
    return `<div class="kcol" ondragover="TSK.dover(event,this)" ondragleave="this.classList.remove('over')" ondrop="TSK.drop(event,'${c.k}',this)">
      <div class="kcol-h"><span class="kdot" style="background:${c.c}"></span>${c.t}<span class="kct">${items.length}</span></div>
      ${items.map(card).join('')||'<div class="kempty">—</div>'}
      <button class="tsk-quick" onclick="TSK.quick('${c.k}')">＋ Add</button>
    </div>`;
  }).join('')}</div>`;
}
function list(data){
  const rows=data.map(t=>{const p=prog(t),ds=dueState(t);
    return `<tr onclick="TSK.open('${t.id}')" style="cursor:pointer">
      <td class="strong">${esc(t.title)}</td>
      <td><span class="tsk-av">${initials(t.assignee)}</span> ${esc(t.assignee||'—')}</td>
      <td><span class="pill ${PRIO_PILL[t.priority]||'muted'}">${esc(t.priority)}</span></td>
      <td><span class="pill ${({todo:'muted',progress:'info',review:'warn',done:'ok'})[t.status]}">${pretty(t.status)}</span></td>
      <td class="${ds==='bad'?'':''}">${t.due?`<span class="pill ${ds||'muted'}">${esc(t.due)}</span>`:'—'}</td>
      <td style="min-width:120px">${(t.checklist||[]).length?`<div class="tsk-prog" style="margin:0"><div class="tsk-prog-b" style="width:${p}%"></div></div>`:'—'}</td>
    </tr>`;}).join('')||`<tr><td class="empty" colspan="6">No tasks match.</td></tr>`;
  return `<div class="card"><table class="tbl"><thead><tr><th>Task</th><th>Assignee</th><th>Priority</th><th>Status</th><th>Due</th><th>Progress</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

/* ---------- detail modal ---------- */
function ensureModal(){ if(document.getElementById('tsk-modal'))return;
  const m=document.createElement('div'); m.id='tsk-modal'; m.className='modal'; m.onclick=e=>{if(e.target===m)TSK.close();};
  m.innerHTML=`<div class="modal-box" style="width:680px"><div class="modal-h"><span class="ti" id="tsk-mti">Task</span><button class="x" onclick="TSK.close()">✕</button></div>
    <div class="modal-b" id="tsk-mb"></div>
    <div class="modal-f"><button class="btn danger" id="tsk-del" style="margin-right:auto;border-color:#f3c0c0;color:#dc2626">🗑 Delete</button><button class="btn" onclick="TSK.close()">Cancel</button><button class="btn primary" onclick="TSK.save()">Save Task</button></div></div>`;
  document.body.appendChild(m);
}
function openModal(){ draft.checklist=draft.checklist||[]; draft.comments=draft.comments||[]; draft.tags=draft.tags||[];
  document.getElementById('tsk-mti').textContent=editId?'Edit Task':'New Task';
  document.getElementById('tsk-del').style.display=editId?'':'none';
  document.getElementById('tsk-del').onclick=()=>{ if(editId&&confirm('Delete this task?')){ tasks=tasks.filter(x=>x.id!==editId); save(); TSK.close(); draw(); } };
  modalBody(); document.getElementById('tsk-modal').classList.add('open');
}
function modalBody(){
  const t=draft, opt=(a,s)=>a.map(o=>`<option${o===s?' selected':''}>${esc(o)}</option>`).join('');
  const cl=t.checklist.map((c,i)=>`<div class="tsk-ci"><input type="checkbox" ${c.done?'checked':''} onchange="TSK.chk(${i})"><span class="${c.done?'done':''}">${esc(c.t)}</span><button class="tbtn danger" onclick="TSK.chkDel(${i})">✕</button></div>`).join('');
  const p=prog(t);
  const cm=t.comments.map(c=>`<div class="tsk-cm"><span class="tsk-av">${initials(c.by)}</span><div><b>${esc(c.by)}</b> <span style="color:var(--text3);font-size:11px">${esc(c.at)}</span><div>${esc(c.text)}</div></div></div>`).join('')||'<div style="color:var(--text3);font-size:12.5px">No comments yet.</div>';
  document.getElementById('tsk-mb').innerHTML=`
    <div class="form">
      <div class="field full"><label>Title *</label><input id="t-title" value="${esc(t.title||'')}" placeholder="Task title"></div>
      <div class="field full"><label>Description</label><textarea id="t-desc" rows="2">${esc(t.desc||'')}</textarea></div>
      <div class="field"><label>Assignee</label><select id="t-assignee"><option value="">— unassigned —</option>${opt(OFFICERS,t.assignee)}</select></div>
      <div class="field"><label>Priority</label><select id="t-priority">${opt(PRIO,t.priority||'Medium')}</select></div>
      <div class="field"><label>Status</label><select id="t-status">${COLS.map(c=>`<option value="${c.k}"${t.status===c.k?' selected':''}>${c.t}</option>`).join('')}</select></div>
      <div class="field"><label>Due Date</label><input id="t-due" type="date" value="${esc(t.due||'')}"></div>
      <div class="field full"><label>Labels</label><div class="tsk-tags">${TAGS.map(x=>`<button class="tsk-tagx ${t.tags.includes(x)?'on':''}" onclick="TSK.tag('${x}')">${esc(x)}</button>`).join('')}</div></div>
    </div>
    <div class="tsk-sec"><b>✅ Checklist</b> ${t.checklist.length?`<span style="color:var(--text3);font-size:11.5px">— ${p}%</span><div class="tsk-prog"><div class="tsk-prog-b" style="width:${p}%"></div></div>`:''}
      ${cl}
      <div class="addbar" style="margin:8px 0 0"><input id="t-chk" placeholder="Add a sub-task…" onkeydown="if(event.key==='Enter')TSK.chkAdd()"><button class="btn" onclick="TSK.chkAdd()">＋</button></div>
    </div>
    <div class="tsk-sec"><b>💬 Comments</b><div style="margin:8px 0">${cm}</div>
      <div class="addbar" style="margin:0"><input id="t-cm" placeholder="Write a comment…" onkeydown="if(event.key==='Enter')TSK.cmAdd()"><button class="btn" onclick="TSK.cmAdd()">Post</button></div>
    </div>`;
}
function syncDraft(){ const g=id=>{const e=document.getElementById(id);return e?e.value:undefined;};
  if(g('t-title')!==undefined){ draft.title=g('t-title'); draft.desc=g('t-desc'); draft.assignee=g('t-assignee'); draft.priority=g('t-priority'); draft.status=g('t-status'); draft.due=g('t-due'); } }

/* ---------- handlers ---------- */
window.TSK={
  view(v){ view=v; draw(); },
  f(k,v){ flt[k]=v; draw(); if(k==='q'){const s=host.querySelector('.search input'); if(s){s.focus();s.setSelectionRange(s.value.length,s.value.length);} } },
  new(){ draft={id:uid('TSK'),title:'',desc:'',assignee:'',priority:'Medium',status:'todo',due:'',tags:[],checklist:[],comments:[]}; editId=null; openModal(); },
  quick(status){ const title=prompt('New task title:'); if(!title)return; tasks.unshift({id:uid('TSK'),title:title.trim(),desc:'',assignee:'',priority:'Medium',status,due:'',tags:[],checklist:[],comments:[]}); save(); draw(); },
  open(id){ const t=tasks.find(x=>x.id===id); if(!t)return; draft=JSON.parse(JSON.stringify(t)); editId=id; openModal(); },
  close(){ document.getElementById('tsk-modal').classList.remove('open'); draft=null; editId=null; },
  save(){ syncDraft(); if(!draft.title.trim()){ alert('Title is required.'); return; }
    if(editId){ const i=tasks.findIndex(x=>x.id===editId); tasks[i]=draft; } else tasks.unshift(draft);
    save(); TSK.close(); draw(); },
  tag(x){ syncDraft(); const i=draft.tags.indexOf(x); i>=0?draft.tags.splice(i,1):draft.tags.push(x); modalBody(); },
  chk(i){ syncDraft(); draft.checklist[i].done=!draft.checklist[i].done; modalBody(); },
  chkAdd(){ syncDraft(); const e=document.getElementById('t-chk'); if(e&&e.value.trim()){ draft.checklist.push({t:e.value.trim(),done:false}); modalBody(); document.getElementById('t-chk').focus(); } },
  chkDel(i){ syncDraft(); draft.checklist.splice(i,1); modalBody(); },
  cmAdd(){ syncDraft(); const e=document.getElementById('t-cm'); if(e&&e.value.trim()){ draft.comments.push({by:'Imran Hossain',at:new Date().toISOString().slice(0,10),text:e.value.trim()}); modalBody(); } },
  dstart(e,id){ TSK._drag=id; e.dataTransfer.effectAllowed='move'; e.currentTarget.classList.add('dragging'); },
  dend(e){ e.currentTarget.classList.remove('dragging'); },
  dover(e,el){ e.preventDefault(); el.classList.add('over'); },
  drop(e,status,el){ e.preventDefault(); el.classList.remove('over'); const t=tasks.find(x=>x.id===TSK._drag); if(t&&t.status!==status){ t.status=status; if(status==='done'&&(t.checklist||[]).length) t.checklist.forEach(c=>c.done=true); save(); draw(); } TSK._drag=null; }
};

/* ---------- styles ---------- */
function ensureCss(){ if(document.getElementById('tsk-css'))return; const s=document.createElement('style'); s.id='tsk-css';
  s.textContent=`
  .tsk-viewtog{display:inline-flex;border:1px solid var(--border2);border-radius:9px;overflow:hidden}
  .tsk-viewtog button{border:0;background:var(--bg2);padding:8px 13px;font-size:12.5px;font-weight:600;cursor:pointer;color:var(--text2);font-family:inherit}
  .tsk-viewtog button.on{background:var(--accent);color:#fff}
  .tsk-av{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;font-size:9.5px;font-weight:700;vertical-align:middle}
  .tsk-tag{display:inline-block;font-size:10px;font-weight:600;background:var(--bg3);color:var(--text2);padding:2px 8px;border-radius:6px;margin-right:4px}
  .tsk-prog{height:6px;background:var(--bg3);border-radius:6px;overflow:hidden;margin:8px 0 3px}
  .tsk-prog-b{height:100%;background:linear-gradient(90deg,#2563eb,#16a34a);border-radius:6px}
  .tsk-prog-x{font-size:10.5px;color:var(--text3)}
  .tsk-quick{width:100%;border:1px dashed var(--border2);background:transparent;border-radius:9px;padding:7px;font-size:12px;color:var(--text2);cursor:pointer;font-family:inherit}
  .tsk-quick:hover{border-color:var(--accent);color:var(--accent)}
  .tsk-sec{margin-top:16px;border-top:1px solid var(--border);padding-top:13px;font-size:13px}
  .tsk-ci{display:flex;align-items:center;gap:9px;padding:5px 0;font-size:13px}
  .tsk-ci .done{text-decoration:line-through;color:var(--text3)}
  .tsk-ci button{margin-left:auto}
  .tsk-tags{display:flex;flex-wrap:wrap;gap:6px}
  .tsk-tagx{border:1px solid var(--border2);background:var(--bg2);border-radius:7px;padding:4px 10px;font-size:11.5px;cursor:pointer;font-family:inherit;color:var(--text2)}
  .tsk-tagx.on{background:var(--accent-light);border-color:var(--accent);color:var(--accent);font-weight:600}
  .tsk-cm{display:flex;gap:9px;padding:7px 0;font-size:12.5px;align-items:flex-start}`;
  document.head.appendChild(s);
}

/* ---------- register ---------- */
TP.onReady(()=>{
  TP.addGroup({grp:'work',label:'Workspace',ic:'🗂',section:'Productivity',nw:true});
  TP.registerPage({ id:'task-mgmt', label:'Task Management', sub:'Assign, track & collaborate on tasks', ic:'📋', group:'work', nw:true, render });
});
})();
