/* ════════════════════════════════════════════════════════════════════
   FEATURE (native, additive): Travel Desk — Task Board  ·  New
   A brand-new Travel module section. Renders into #tv-tasks-root (panel
   erp-panel-tv-tasks, defined in travel.html). Native ERP look via the
   shared design tokens (var(--accent) etc.). Add / move / delete tasks,
   priority, assignee, due date — persisted to localStorage (epal_tv_tasks).
   Nothing existing is touched; this only ADDS a new section.
   ════════════════════════════════════════════════════════════════════ */
(function(){
"use strict";
var LS='epal_tv_tasks';
var COLS=[{k:'todo',t:'To Do',c:'#94a3b8'},{k:'progress',t:'In Progress',c:'#2563eb'},{k:'review',t:'Review',c:'#d97706'},{k:'done',t:'Done',c:'#16a34a'}];
var PRIO={Urgent:'#dc2626',High:'#ea580c',Medium:'#d97706',Low:'#16a34a'};
var AGENTS=['Imran Hossain','Fatema Akter','Mitu Rani','Tareq Aziz'];

function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];});}
function uid(){return 'TVT-'+String(Date.now()).slice(-5)+Math.floor(Math.random()*90+10);}
function load(){try{var r=localStorage.getItem(LS);if(r)return JSON.parse(r);}catch(e){}return seed();}
function save(){try{localStorage.setItem(LS,JSON.stringify(TASKS));}catch(e){}}
function seed(){return [
  {id:'TVT-1',title:'Issue Emirates tickets — Rahim Enterprise',assignee:'Imran Hossain',priority:'High',due:'2026-06-30',status:'progress'},
  {id:'TVT-2',title:'Follow up Schengen docs — Rumana Begum',assignee:'Mitu Rani',priority:'Urgent',due:'2026-06-29',status:'todo'},
  {id:'TVT-3',title:'Send Umrah package quote — Delwar',assignee:'Imran Hossain',priority:'Medium',due:'2026-07-02',status:'review'},
  {id:'TVT-4',title:'Reconcile SkyLink GSA payment',assignee:'Tareq Aziz',priority:'Low',due:'2026-07-05',status:'todo'},
  {id:'TVT-5',title:'Confirm Malaysia visa submission',assignee:'Fatema Akter',priority:'Medium',due:'2026-06-27',status:'done'}
];}
var TASKS=load();

function initials(n){return String(n||'?').split(' ').map(function(w){return w[0];}).slice(0,2).join('').toUpperCase();}
function dueFlag(t){ if(!t.due||t.status==='done')return ''; var d=new Date(t.due);d.setHours(0,0,0,0);var n=new Date();n.setHours(0,0,0,0);
  var diff=Math.round((d-n)/86400000); if(diff<0)return 'overdue'; if(diff===0)return 'today'; return ''; }

function render(){
  var root=document.getElementById('tv-tasks-root'); if(!root) return;
  var counts=COLS.map(function(c){return TASKS.filter(function(t){return t.status===c.k;}).length;});
  var due0=TASKS.filter(function(t){return dueFlag(t)==='today';}).length;
  var over=TASKS.filter(function(t){return dueFlag(t)==='overdue';}).length;

  var kpis=''
    +'<div class="tvt-kpi"><div class="l">📋 Total</div><div class="v">'+TASKS.length+'</div></div>'
    +'<div class="tvt-kpi"><div class="l">📅 Due Today</div><div class="v" style="color:#d97706">'+due0+'</div></div>'
    +'<div class="tvt-kpi"><div class="l">⚠️ Overdue</div><div class="v" style="color:#dc2626">'+over+'</div></div>'
    +'<div class="tvt-kpi"><div class="l">✅ Done</div><div class="v" style="color:#16a34a">'+counts[3]+'</div></div>';

  var board=COLS.map(function(c){
    var items=TASKS.filter(function(t){return t.status===c.k;});
    var cards=items.map(function(t){
      var i=COLS.findIndex(function(x){return x.k===c.k;});
      var left=i>0?'<button class="tvt-mv" title="Move left" onclick="tvtMove(\''+t.id+'\',\''+COLS[i-1].k+'\')">‹</button>':'';
      var right=i<COLS.length-1?'<button class="tvt-mv" title="Move right" onclick="tvtMove(\''+t.id+'\',\''+COLS[i+1].k+'\')">›</button>':'';
      var df=dueFlag(t);
      var duePill=t.due?'<span class="tvt-due '+df+'">📅 '+esc(t.due)+'</span>':'';
      return '<div class="tvt-card">'
        +'<div class="tvt-row"><span class="tvt-prio" style="background:'+(PRIO[t.priority]||'#94a3b8')+'">'+esc(t.priority)+'</span>'+duePill+'</div>'
        +'<div class="tvt-t">'+esc(t.title)+'</div>'
        +'<div class="tvt-row"><span class="tvt-av" title="'+esc(t.assignee)+'">'+initials(t.assignee)+'</span>'
        +'<span class="tvt-as">'+esc(t.assignee||'Unassigned')+'</span>'
        +'<span class="tvt-actions">'+left+right+'<button class="tvt-mv" title="Delete" onclick="tvtDel(\''+t.id+'\')">✕</button></span></div>'
        +'</div>';
    }).join('')||'<div class="tvt-empty">—</div>';
    return '<div class="tvt-col"><div class="tvt-col-h"><span class="tvt-dot" style="background:'+c.c+'"></span>'+c.t+'<span class="tvt-ct">'+items.length+'</span></div>'+cards+'</div>';
  }).join('');

  root.innerHTML=''
    +'<div class="tvt-kpis">'+kpis+'</div>'
    +'<div class="tvt-add">'
      +'<input id="tvt-in" placeholder="Add a task and press Enter…" onkeydown="if(event.key===\'Enter\')tvtAdd()">'
      +'<select id="tvt-prio">'+Object.keys(PRIO).map(function(p){return '<option'+(p==='Medium'?' selected':'')+'>'+p+'</option>';}).join('')+'</select>'
      +'<select id="tvt-asg">'+AGENTS.map(function(a){return '<option>'+esc(a)+'</option>';}).join('')+'</select>'
      +'<input id="tvt-due" type="date">'
      +'<button class="erp-btn btn-primary" onclick="tvtAdd()">＋ Add Task</button>'
    +'</div>'
    +'<div class="tvt-board">'+board+'</div>';
}

window.tvtAdd=function(){
  var i=document.getElementById('tvt-in'); if(!i||!i.value.trim())return;
  TASKS.unshift({id:uid(),title:i.value.trim(),assignee:(document.getElementById('tvt-asg')||{}).value||'',priority:(document.getElementById('tvt-prio')||{}).value||'Medium',due:(document.getElementById('tvt-due')||{}).value||'',status:'todo'});
  save(); render();
};
window.tvtMove=function(id,s){var t=TASKS.find(function(x){return x.id===id;});if(t){t.status=s;save();render();}};
window.tvtDel=function(id){if(!confirm('Delete this task?'))return;TASKS=TASKS.filter(function(x){return x.id!==id;});save();render();};
window.tvTaskAdd=function(){var i=document.getElementById('tvt-in');if(i){i.focus();}};

function injectCss(){ if(document.getElementById('tvt-css'))return; var s=document.createElement('style'); s.id='tvt-css';
  s.textContent=''
  +'#erp-panel-tv-tasks .tvt-kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-bottom:16px}'
  +'#erp-panel-tv-tasks .tvt-kpi{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:13px 15px;box-shadow:var(--shadow)}'
  +'#erp-panel-tv-tasks .tvt-kpi .l{font-size:11.5px;color:var(--text2)}'
  +'#erp-panel-tv-tasks .tvt-kpi .v{font-size:23px;font-weight:700;margin-top:4px;font-family:"DM Mono",monospace}'
  +'#erp-panel-tv-tasks .tvt-add{display:flex;gap:9px;flex-wrap:wrap;margin-bottom:16px}'
  +'#erp-panel-tv-tasks .tvt-add input,#erp-panel-tv-tasks .tvt-add select{border:1px solid var(--border2,#d0d6e8);background:var(--bg2);border-radius:9px;padding:9px 12px;font-size:13px;font-family:inherit;color:var(--text);outline:none}'
  +'#erp-panel-tv-tasks .tvt-add #tvt-in{flex:1;min-width:220px}'
  +'#erp-panel-tv-tasks .tvt-board{display:flex;gap:14px;overflow-x:auto;padding-bottom:8px}'
  +'#erp-panel-tv-tasks .tvt-col{background:var(--bg3);border-radius:13px;padding:12px;min-width:240px;flex:1;min-height:140px}'
  +'#erp-panel-tv-tasks .tvt-col-h{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--text2);margin:2px 4px 11px}'
  +'#erp-panel-tv-tasks .tvt-dot{width:9px;height:9px;border-radius:50%}'
  +'#erp-panel-tv-tasks .tvt-ct{margin-left:auto;background:rgba(0,0,0,.07);border-radius:10px;padding:1px 9px;font-size:11px}'
  +'#erp-panel-tv-tasks .tvt-card{background:var(--bg2);border:1px solid var(--border);border-radius:11px;padding:11px;margin-bottom:10px;box-shadow:var(--shadow)}'
  +'#erp-panel-tv-tasks .tvt-row{display:flex;align-items:center;gap:7px;margin-bottom:6px}'
  +'#erp-panel-tv-tasks .tvt-t{font-size:13px;font-weight:600;margin:3px 0 8px;line-height:1.35}'
  +'#erp-panel-tv-tasks .tvt-prio{font-size:10px;font-weight:800;color:#fff;padding:1px 7px;border-radius:6px;text-transform:uppercase;letter-spacing:.3px}'
  +'#erp-panel-tv-tasks .tvt-due{font-size:10.5px;color:var(--text3);margin-left:auto;background:var(--bg3);padding:1px 7px;border-radius:6px}'
  +'#erp-panel-tv-tasks .tvt-due.today{background:#fffbeb;color:#d97706}'
  +'#erp-panel-tv-tasks .tvt-due.overdue{background:#fef2f2;color:#dc2626}'
  +'#erp-panel-tv-tasks .tvt-av{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;font-size:9.5px;font-weight:700}'
  +'#erp-panel-tv-tasks .tvt-as{font-size:11px;color:var(--text3)}'
  +'#erp-panel-tv-tasks .tvt-actions{margin-left:auto;display:flex;gap:4px}'
  +'#erp-panel-tv-tasks .tvt-mv{border:1px solid var(--border2,#d0d6e8);background:var(--bg2);border-radius:6px;width:24px;height:24px;cursor:pointer;font-size:12px;line-height:1;color:var(--text2)}'
  +'#erp-panel-tv-tasks .tvt-mv:hover{border-color:var(--accent);color:var(--accent)}'
  +'#erp-panel-tv-tasks .tvt-empty{font-size:12px;color:var(--text3);text-align:center;padding:14px 0}';
  document.head.appendChild(s);
}

function boot(){ injectCss(); var root=document.getElementById('tv-tasks-root');
  if(root){ render(); } else { document.addEventListener('DOMContentLoaded', render); } }
boot();
})();
