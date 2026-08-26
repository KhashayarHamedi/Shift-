const STORAGE_KEY = 'shift_final_state_v1';
const IDENTITY_KEY = 'shift_identity_v1';
const API_URL = '/api/state';
let adminAuthenticated = false;
const seed = {
  version: 1,
  rotation: ['kash','usama','patrick','param'],
  lastHost: 'kash',
  nextSessionAt: '2026-08-27T18:00:00+02:00',
  nextSessionPlace: 'Outside office',
  people: {
    kash: {
      id: 'kash', name: 'Kash', initial: 'K', role: 'Technology Explorer',
      bio: 'Curious about applied AI, automation and product building.',
      topic: 'Can AI automate an entire tender?',
      description: 'A practical look at intake, compliance, drafting and what still needs human judgment.',
      suggestions: ['Agent UX','MCP in consulting','AI native software']
    },
    usama: {
      id: 'usama', name: 'Usama', initial: 'U', role: 'Security Provocateur',
      bio: 'Interested in security, architecture and how autonomous systems should be controlled.',
      topic: 'Can autonomous agents be trusted?',
      description: 'A practical discussion about access, control and what we should never delegate.',
      suggestions: ['Agent identity','Zero trust for agents','Production access']
    },
    patrick: {
      id: 'patrick', name: 'Patrick', initial: 'P', role: 'Strategy Connector',
      bio: 'Connects technology shifts with consulting, business design and how teams work.',
      topic: 'What will consulting look like in 2030?',
      description: 'A discussion about how client work changes when knowledge, delivery and software become more autonomous.',
      suggestions: ['AI pricing models','Future skills','Consulting without slides']
    },
    param: {
      id: 'param', name: 'Param', initial: 'P', role: 'Automation Builder',
      bio: 'Likes practical automation, infrastructure and experiments that turn ideas into working systems.',
      topic: 'Do workflows disappear when agents arrive?',
      description: 'A hands on discussion about workflow engines, agents and the future of enterprise automation.',
      suggestions: ['n8n experiments','Appian and agents','Invisible workflows']
    }
  },
  future: [
    {id:'f1',name:'AI Agents',note:'What changes when software can plan and act?',size:'large',interest:4},
    {id:'f2',name:'MCP',note:'A common layer for tools, context and agent capabilities.',size:'medium',interest:3},
    {id:'f3',name:'Agent UX',note:'Designing interfaces when intent becomes the main input.',size:'medium',interest:3},
    {id:'f4',name:'Robotics',note:'Where physical automation meets enterprise software.',size:'small',interest:2},
    {id:'f5',name:'Local AI',note:'What becomes possible when useful models run close to the user?',size:'small',interest:2},
    {id:'f6',name:'Future of Consulting',note:'How delivery, pricing and skills change over the next few years.',size:'large',interest:4},
    {id:'f7',name:'Quantum',note:'What should consultants understand before the hype becomes practical?',size:'small',interest:1}
  ],
  library: [
    {id:'l1',name:'AI Agents',description:'Sessions, demos and resources about autonomous software and agent systems.',sessions:12,resources:38,featured:'Agent design principles'},
    {id:'l2',name:'Automation',description:'Practical automation patterns from workflows to agent orchestration.',sessions:8,resources:24,featured:'Automation decision map'},
    {id:'l3',name:'Appian',description:'Patterns, implementation notes and lessons from real delivery work.',sessions:7,resources:19,featured:'Appian delivery patterns'},
    {id:'l4',name:'Consulting',description:'Methods, facilitation ideas and ways to improve client delivery.',sessions:6,resources:16,featured:'Future consulting skills'},
    {id:'l5',name:'Security',description:'Security questions for automation, data and autonomous systems.',sessions:3,resources:10,featured:'Agent access checklist'},
    {id:'l6',name:'Future Tech',description:'Things we are watching before they become everyday client questions.',sessions:9,resources:31,featured:'Technology horizon notes'}
  ],
  history: [
    {id:'h1',date:'2026-08-13',host:'kash',topic:'I built an internal tool during lunch',type:'Live build'},
    {id:'h2',date:'2026-07-30',host:'param',topic:'The future of enterprise automation',type:'Discussion'},
    {id:'h3',date:'2026-07-16',host:'patrick',topic:'Consulting in 2030',type:'Debate'},
    {id:'h4',date:'2026-07-02',host:'usama',topic:'Security patterns nobody talks about',type:'Whiteboard'}
  ],
  updatedAt: new Date().toISOString()
};

let state = structuredClone(seed);
let currentUser = localStorage.getItem(IDENTITY_KEY) || 'kash';
let currentRoute = 'home';
let currentSuggestTarget = null;
let currentFutureId = null;
let currentLibraryId = null;
let currentHistoryId = null;
let pendingSuggestedTopic = '';
let futureBodies = [];
let futureFrame = null;
let cloudAvailable = false;
let saveTimer = null;

const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];

const escapeHtml = str =>
  String(str ?? '').replace(
    /[&<>'"]/g,
    c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[c])
  );

const uid = prefix =>
  prefix + Math.random().toString(36).slice(2, 9);

const isAdmin = () =>
  currentUser === 'kash' && adminAuthenticated;

const nextHostId = () => {
  const i = state.rotation.indexOf(state.lastHost);

  return state.rotation[
    (i + 1 + state.rotation.length) % state.rotation.length
  ];
};

const nextHost = () => state.people[nextHostId()];

function localLoad(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      if(parsed && parsed.people && parsed.future && parsed.library) state = parsed;
    }
  }catch(err){ console.warn('Local state could not be loaded', err); }
}

async function cloudLoad(){
  try{
    const res = await fetch(API_URL,{headers:{'accept':'application/json'}});
    if(!res.ok) throw new Error('cloud unavailable');
    const payload = await res.json();
    if(payload && payload.state && payload.state.people){
      state = payload.state;
      localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
    }
    cloudAvailable = true;
    setSync('cloud','Saved for the team');
  }catch(err){
    cloudAvailable = false;
    setSync('local','Saved on this device');
  }
}

function persist(){
  state.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  setSync(cloudAvailable?'cloud':'local',cloudAvailable?'Saving for the team':'Saved on this device');
  clearTimeout(saveTimer);
  if(cloudAvailable){
    saveTimer = setTimeout(async()=>{
      try{
        const res = await fetch(API_URL,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(state)});
        if(!res.ok) throw new Error('save failed');
        setSync('cloud','Saved for the team');
      }catch(err){
        cloudAvailable = false;
        setSync('error','Cloud save needs setup');
        toast('Saved on this device');
      }
    },280);
  }
}

function setSync(mode,text){
  const el = $('#syncState');
  if(!el) return;
  el.className = 'syncState' + (mode==='cloud'?' cloud':mode==='error'?' error':'');
  el.querySelector('span').textContent = text;
}

function formatDate(iso){
  const d = new Date(iso + (iso.length===10?'T12:00:00':''));
  return new Intl.DateTimeFormat('en',{day:'2-digit',month:'short',year:'numeric'}).format(d);
}
function formatLongDate(date){ return new Intl.DateTimeFormat('en',{day:'numeric',month:'long',year:'numeric'}).format(date); }
function timeText(date){ return new Intl.DateTimeFormat('en',{hour:'2-digit',minute:'2-digit',hour12:false}).format(date); }
function todayText(){ return new Intl.DateTimeFormat('en',{weekday:'long',day:'numeric',month:'long'}).format(new Date()).toUpperCase(); }

function renderAll(){
  renderShell(); renderHome(); renderFuture(); renderLibrary(); renderHistory(); renderIdentityChoices();
}

function renderShell(){
  const me = state.people[currentUser] || state.people.kash;
  $('#sideAvatar').textContent = me.initial;
  $('#sideName').textContent = me.name;
  $('#sideRole').textContent = me.role;
  $('#profileButton').textContent = me.initial;
  $('#todayLabel').textContent = todayText();
  $$('.adminOnly').forEach(el=>el.classList.toggle('hidden',!isAdmin()));
}

function renderHome(){
  const host = nextHost();
  $('#nextHostAvatar').textContent = host.initial;
  $('#nextHostName').textContent = host.name;
  $('#nextTopicTitle').textContent = host.topic || 'Topic to be decided';
  $('#nextTopicDescription').textContent = host.description || 'No description yet';
  const session = new Date(state.nextSessionAt);
  $('#nextSessionDate').textContent = formatLongDate(session);
  $('#nextSessionTime').textContent = timeText(session);
  $('#nextSessionPlace').textContent = state.nextSessionPlace;

  $('#peopleGrid').innerHTML = state.rotation.map(id=>{
    const p = state.people[id];
    const next = id===nextHostId();
    const own = id===currentUser;
    const canEdit = own || isAdmin();
    return `<article class="personCard ${next?'next':''}" data-person="${id}">
      <div class="personTop">
        <div class="personIdentity"><span class="avatar">${escapeHtml(p.initial)}</span><div><h3>${escapeHtml(p.name)}</h3><small>${escapeHtml(p.role)}</small></div></div>
        ${next?'<span class="personBadge">NEXT HOST</span>':''}
      </div>
      <div class="personTopic"><span class="fieldLabel">TOPIC</span><h4>${escapeHtml(p.topic || 'Topic to be decided')}</h4><span class="fieldLabel">DESCRIPTION</span><p>${escapeHtml(p.description || 'No description yet')}</p></div>
      <div class="suggestions"><span class="fieldLabel">SUGGESTED TOPICS</span><div class="suggestionList">
        ${(p.suggestions||[]).slice(0,4).map(s=>own||isAdmin()?`<button class="suggestionChip" data-accept="${id}" data-topic="${escapeHtml(s)}" title="Use this as topic">${escapeHtml(s)}</button>`:`<span class="suggestionChip">${escapeHtml(s)}</span>`).join('') || '<span class="suggestionChip">No suggestions yet</span>'}
      </div>
      <div class="cardActions">
        ${canEdit?`<button class="primaryMini" data-edit-person="${id}">Edit profile</button>`:''}
        <button data-suggest-person="${id}">Suggest topic</button>
      </div></div>
    </article>`;
  }).join('');

  $$('[data-edit-person]').forEach(btn=>btn.onclick=()=>openProfile(btn.dataset.editPerson));
  $$('[data-suggest-person]').forEach(btn=>btn.onclick=()=>openSuggest(btn.dataset.suggestPerson));
  $$('[data-accept]').forEach(btn=>btn.onclick=()=>{
    const id=btn.dataset.accept;
    if(id!==currentUser && !isAdmin()) return;
    state.people[id].topic = btn.dataset.topic;
    state.people[id].suggestions = state.people[id].suggestions.filter(x=>x!==btn.dataset.topic);
    persist(); renderHome(); toast('Topic selected');
  });
}

function updateCountdown(){
  const diff = Math.max(0,new Date(state.nextSessionAt).getTime()-Date.now());
  const sec = Math.floor(diff/1000);
  const days = Math.floor(sec/86400);
  const hours = Math.floor((sec%86400)/3600);
  const mins = Math.floor((sec%3600)/60);
  const secs = sec%60;
  $('#countDays').textContent=String(days).padStart(2,'0');
  $('#countHours').textContent=String(hours).padStart(2,'0');
  $('#countMinutes').textContent=String(mins).padStart(2,'0');
  $('#countSeconds').textContent=String(secs).padStart(2,'0');
}

function renderFuture(){
  const stage = $('#futureStage');
  stage.innerHTML = state.future.map(item=>`<button class="futureBubble ${item.size}" data-future="${item.id}" aria-label="Open ${escapeHtml(item.name)}"><span>${escapeHtml(item.name)}</span></button>`).join('');
  $$('[data-future]').forEach(btn=>btn.onclick=()=>openFuture(btn.dataset.future));
  initFutureMotion();
}

function initFutureMotion(){
  if(futureFrame) cancelAnimationFrame(futureFrame);
  const stage = $('#futureStage');
  const bubbles = $$('.futureBubble');
  if(!stage || !bubbles.length) return;
  const rect=stage.getBoundingClientRect();
  futureBodies = bubbles.map((el,i)=>{
    const size=el.getBoundingClientRect().width || (el.classList.contains('large')?172:el.classList.contains('medium')?132:96);
    const cols=Math.ceil(Math.sqrt(bubbles.length));
    const col=i%cols,row=Math.floor(i/cols);
    const x=30+col*((Math.max(260,rect.width)-160)/Math.max(1,cols-1));
    const y=35+row*145+(i%2)*28;
    return {el,x:Math.min(x,Math.max(10,rect.width-size-10)),y:Math.min(y,Math.max(10,rect.height-size-10)),vx:(i%2?1:-1)*(0.06+0.015*(i%3)),vy:(i%3?1:-1)*(0.045+0.012*(i%2)),size,hover:false};
  });
  futureBodies.forEach(b=>{b.el.onmouseenter=()=>b.hover=true;b.el.onmouseleave=()=>b.hover=false;});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tick=()=>{
    const r=stage.getBoundingClientRect();
    futureBodies.forEach(b=>{
      if(!reduced && !b.hover){b.x+=b.vx;b.y+=b.vy;}
      if(b.x<=8||b.x+b.size>=r.width-8)b.vx*=-1;
      if(b.y<=8||b.y+b.size>=r.height-8)b.vy*=-1;
      b.x=Math.max(8,Math.min(r.width-b.size-8,b.x)); b.y=Math.max(8,Math.min(r.height-b.size-8,b.y));
      b.el.style.transform=`translate3d(${b.x}px,${b.y}px,0)`;
    });
    futureFrame=requestAnimationFrame(tick);
  };
  tick();
}

function renderLibrary(filter=''){
  const f=filter.trim().toLowerCase();
  const list=state.library.filter(x=>!f || [x.name,x.description,x.featured].join(' ').toLowerCase().includes(f));
  $('#libraryGrid').innerHTML = list.map(item=>`<article class="libraryCard" tabindex="0" role="button" data-library="${item.id}">
    <div class="libraryIcon">□</div><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description)}</p>
    <div class="libraryMeta"><span>${item.sessions} sessions</span><span>${item.resources} resources</span></div></article>`).join('') || '<p class="motionNote">No matching collections</p>';
  $$('[data-library]').forEach(card=>{card.onclick=()=>openLibrary(card.dataset.library);card.onkeydown=e=>{if(e.key==='Enter')openLibrary(card.dataset.library);};});
}

function renderHistory(){
  $('#historyList').innerHTML = state.history.map((h,i)=>{
    const p=state.people[h.host]||{name:h.host};
    return `<article class="historyItem"><span class="historyDate">${escapeHtml(formatDate(h.date))}</span><span class="historyDot"></span><span class="historyHost">${escapeHtml(p.name.toUpperCase())}</span><span class="historyTopic">${escapeHtml(h.topic)}</span>${isAdmin()?`<button class="historyEditButton" data-edit-history="${h.id}">Edit</button>`:`<span class="historyType">${escapeHtml(h.type)}</span>`}</article>`;
  }).join('') || '<p class="motionNote">No completed sessions yet</p>';
  $$('[data-edit-history]').forEach(btn=>btn.onclick=()=>openHistory(btn.dataset.editHistory));
}

function renderIdentityChoices(){
  const html=state.rotation.map(id=>{const p=state.people[id];return `<button class="identityChoice" data-identity="${id}"><span class="avatar small">${escapeHtml(p.initial)}</span><span><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.role)}</small></span><span>${id===currentUser?'✓':''}</span></button>`}).join('');
  $('#identityChoices').innerHTML=html;
  $('#suggestPersonChoices').innerHTML=state.rotation.map(id=>{const p=state.people[id];return `<button class="identityChoice" data-choose-suggest="${id}"><span class="avatar small">${escapeHtml(p.initial)}</span><span><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.role)}</small></span><span>›</span></button>`}).join('');
  $$('[data-identity]').forEach(btn=>btn.onclick=()=>setIdentity(btn.dataset.identity));
  $$('[data-choose-suggest]').forEach(btn=>btn.onclick=()=>{closeModal('choosePersonModal');openSuggest(btn.dataset.chooseSuggest);});
}

function setIdentity(id){
  if(!state.people[id]) return;

  // Kash requires admin authentication
  if(id === 'kash' && !adminAuthenticated){
    $('#adminPasswordInput').value = '';
    $('#adminPasswordError').textContent = '';

    closePopover('identityPopover');
    openModal('adminPasswordModal');

    setTimeout(() => {
      $('#adminPasswordInput').focus();
    }, 100);

    return;
  }

  // Leaving Kash locks admin access again
  if(id !== 'kash'){
    adminAuthenticated = false;
  }

  currentUser = id;
  localStorage.setItem(IDENTITY_KEY, id);

  closePopover('identityPopover');
  renderAll();

  toast(`You are ${state.people[id].name}`);
}

function route(name){
  currentRoute=name;
  $$('.page').forEach(p=>p.classList.toggle('active',p.dataset.page===name));
  $$('[data-route]').forEach(b=>b.classList.toggle('active',b.dataset.route===name));
  $('#routeTitle').textContent=name.charAt(0).toUpperCase()+name.slice(1);
  window.scrollTo({top:0,behavior:'smooth'});
  if(name==='future') setTimeout(initFutureMotion,80);
}

function openModal(id){const el=$('#'+id);el.classList.add('open');el.setAttribute('aria-hidden','false');}
function closeModal(id){const el=$('#'+id);el.classList.remove('open');el.setAttribute('aria-hidden','true');}
function openPopover(id){const el=$('#'+id);el.classList.add('open');el.setAttribute('aria-hidden','false');}
function closePopover(id){const el=$('#'+id);el.classList.remove('open');el.setAttribute('aria-hidden','true');}

function openProfile(id=currentUser){
  if(id!==currentUser && !isAdmin()) return;
  const p=state.people[id];
  $('#profileModal').dataset.person=id;
  $('#profileModalTitle').textContent=p.name;
  $('#profileName').value=p.name; $('#profileRole').value=p.role; $('#profileBio').value=p.bio||''; $('#profileTopic').value=p.topic||''; $('#profileTopicDescription').value=p.description||''; $('#profileSuggestions').value=(p.suggestions||[]).join(', ');
  openModal('profileModal');
}

function openSuggest(id){
  currentSuggestTarget=id;
  $('#suggestTitle').textContent='For '+state.people[id].name;
  $('#suggestInput').value=pendingSuggestedTopic || ''; pendingSuggestedTopic='';
  openModal('suggestModal'); setTimeout(()=>$('#suggestInput').focus(),120);
}

function openFuture(id,editing=false){
  currentFutureId=id;
  const item=state.future.find(x=>x.id===id);
  if(!item) return;
  $('#futureModalTitle').textContent=item.name;
  $('#futureView').innerHTML=`<div class="detailHero"><span class="fieldLabel">WHY IT MATTERS</span><p>${escapeHtml(item.note||'No note yet')}</p></div><div class="detailMeta"><span>${escapeHtml(item.size)} bubble</span><span>${item.interest||0} interested</span></div><div class="detailActions"><button class="ghostButton" id="futureSuggestButton">Suggest for someone</button>${isAdmin()?'<button class="primaryButton" id="editFutureButton">Edit topic</button>':''}</div>`;
  $('#futureView').classList.toggle('hidden',editing);
  $('#futureForm').classList.toggle('hidden',!editing);
  if(editing){$('#futureNameInput').value=item.name;$('#futureNoteInput').value=item.note||'';$('#futureSizeInput').value=item.size;}
  openModal('futureModal');
  if(!editing){
    $('#futureSuggestButton').onclick=()=>{pendingSuggestedTopic=item.name;closeModal('futureModal');openModal('choosePersonModal');};
    const e=$('#editFutureButton');if(e)e.onclick=()=>openFuture(id,true);
  }
}

function openNewFuture(){
  const item={id:uid('f'),name:'New topic',note:'Why should the team care about this?',size:'medium',interest:0};
  state.future.push(item); currentFutureId=item.id; persist(); renderFuture(); openFuture(item.id,true);
}

function openLibrary(id,editing=false){
  currentLibraryId=id; const item=state.library.find(x=>x.id===id); if(!item)return;
  $('#libraryModalTitle').textContent=item.name;
  $('#libraryView').innerHTML=`<div class="detailHero"><span class="fieldLabel">COLLECTION</span><p>${escapeHtml(item.description)}</p></div><div class="detailMeta"><span>${item.sessions} sessions</span><span>${item.resources} resources</span></div><div class="detailHero"><span class="fieldLabel">FEATURED RESOURCE</span><p>${escapeHtml(item.featured||'Nothing featured yet')}</p></div><div class="detailActions">${isAdmin()?'<button class="primaryButton" id="editLibraryButton">Edit collection</button>':''}</div>`;
  $('#libraryView').classList.toggle('hidden',editing); $('#libraryForm').classList.toggle('hidden',!editing);
  if(editing){$('#libraryNameInput').value=item.name;$('#libraryDescriptionInput').value=item.description;$('#librarySessionsInput').value=item.sessions;$('#libraryResourcesInput').value=item.resources;$('#libraryFeaturedInput').value=item.featured||'';}
  openModal('libraryModal'); const e=$('#editLibraryButton');if(e)e.onclick=()=>openLibrary(id,true);
}
function openNewLibrary(){const item={id:uid('l'),name:'New collection',description:'Describe what belongs here.',sessions:0,resources:0,featured:''};state.library.push(item);currentLibraryId=item.id;persist();renderLibrary($('#librarySearch').value);openLibrary(item.id,true);}

function openHistory(id){
  if(!isAdmin()) return;
  currentHistoryId=id;
  const item=state.history.find(x=>x.id===id); if(!item)return;
  $('#historyDateInput').value=item.date;
  $('#historyTopicInput').value=item.topic;
  $('#historyTypeInput').value=item.type;
  $('#historyHostInput').innerHTML=state.rotation.map(pid=>`<option value="${pid}" ${pid===item.host?'selected':''}>${escapeHtml(state.people[pid].name)}</option>`).join('');
  openModal('historyModal');
}

function openAdmin(){
  if(!isAdmin()) return;
  $('#adminLastHost').innerHTML=state.rotation.map(id=>`<option value="${id}" ${id===state.lastHost?'selected':''}>${escapeHtml(state.people[id].name)}</option>`).join('');
  $('#adminNextHost').value=nextHost().name;
  const d=new Date(state.nextSessionAt);
  $('#adminSessionDate').value=d.toISOString().slice(0,10);
  $('#adminSessionTime').value=timeText(d);
  $('#adminSessionPlace').value=state.nextSessionPlace;
  openModal('adminModal');
}

function exportData(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='shift_team_data.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Team data exported');
}

function completeCurrentShift(){
  if(!isAdmin()) return;
  const hostId=nextHostId(); const host=state.people[hostId]; const d=new Date(state.nextSessionAt);
  state.history.unshift({id:uid('h'),date:d.toISOString().slice(0,10),host:hostId,topic:host.topic||'Untitled session',type:'Shift session'});
  state.lastHost=hostId;
  const next=new Date(d.getTime()+14*24*60*60*1000);
  while(next.getTime()<=Date.now()) next.setDate(next.getDate()+14);
  state.nextSessionAt=next.toISOString();
  persist();renderAll();updateCountdown();toast(`${host.name} completed. ${nextHost().name} is next`);
}

function toast(message){
  $('#toastText').textContent=message; $('#toast').classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>$('#toast').classList.remove('show'),1900);
}

function bind(){
  $$('[data-route]').forEach(btn=>btn.addEventListener('click',()=>route(btn.dataset.route)));
  $$('[data-close]').forEach(btn=>btn.addEventListener('click',()=>{const id=btn.dataset.close; if($('#'+id)?.classList.contains('popover'))closePopover(id); else closeModal(id);}));
  $('#identityButton').onclick=()=>openPopover('identityPopover');
  $('#profileButton').onclick=()=>openProfile(currentUser); $('#mobileProfile').onclick=()=>openProfile(currentUser);
  $('#adminButton').onclick=openAdmin;
  $('#adminPasswordForm').onsubmit = async e => {
  e.preventDefault();

  const password = $('#adminPasswordInput').value;
  const error = $('#adminPasswordError');

  error.textContent = '';

  try {
    const response = await fetch('/api/admin-auth', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ password })
    });

    if (!response.ok) {
      error.textContent = 'Incorrect password';
      return;
    }

    adminAuthenticated = true;
    currentUser = 'kash';

    localStorage.setItem(IDENTITY_KEY, 'kash');

    closeModal('adminPasswordModal');

    renderAll();

    toast('Admin unlocked');

  } catch {
    error.textContent = 'Could not verify password';
  }
};
  $('#quickAddButton').onclick=()=>openModal('quickAddModal');
  $('#quickSuggest').onclick=()=>{closeModal('quickAddModal');openModal('choosePersonModal');};
  $('#quickFuture').onclick=()=>{closeModal('quickAddModal');openNewFuture();};
  $('#quickLibrary').onclick=()=>{closeModal('quickAddModal');openNewLibrary();};
  $('#editSessionButton').onclick=()=>{
    const d=new Date(state.nextSessionAt); $('#sessionDateInput').value=d.toISOString().slice(0,10); $('#sessionTimeInput').value=timeText(d); $('#sessionPlaceInput').value=state.nextSessionPlace; openModal('sessionModal');
  };
  $('#profileForm').onsubmit=e=>{
    e.preventDefault(); const id=$('#profileModal').dataset.person; if(id!==currentUser&&!isAdmin())return;
    const p=state.people[id]; p.name=$('#profileName').value.trim();p.role=$('#profileRole').value.trim();p.bio=$('#profileBio').value.trim();p.topic=$('#profileTopic').value.trim();p.description=$('#profileTopicDescription').value.trim();p.suggestions=$('#profileSuggestions').value.split(',').map(x=>x.trim()).filter(Boolean).slice(0,12);p.initial=(p.name||'?').trim().charAt(0).toUpperCase();
    persist();closeModal('profileModal');renderAll();toast('Profile saved');
  };
  $('#suggestForm').onsubmit=e=>{
    e.preventDefault();const topic=$('#suggestInput').value.trim();if(!topic||!currentSuggestTarget)return;
    const arr=state.people[currentSuggestTarget].suggestions||(state.people[currentSuggestTarget].suggestions=[]);if(!arr.includes(topic))arr.unshift(topic);persist();closeModal('suggestModal');renderHome();toast('Suggestion sent');
  };
  $('#sessionForm').onsubmit=e=>{
    e.preventDefault();if(!isAdmin())return;const date=$('#sessionDateInput').value,time=$('#sessionTimeInput').value;state.nextSessionAt=new Date(`${date}T${time}:00`).toISOString();state.nextSessionPlace=$('#sessionPlaceInput').value.trim();persist();closeModal('sessionModal');renderHome();updateCountdown();toast('Session updated');
  };
  $('#addFutureButton').onclick=openNewFuture;
  $('#futureForm').onsubmit=e=>{e.preventDefault();if(!isAdmin())return;const item=state.future.find(x=>x.id===currentFutureId);if(!item)return;item.name=$('#futureNameInput').value.trim();item.note=$('#futureNoteInput').value.trim();item.size=$('#futureSizeInput').value;persist();renderFuture();openFuture(item.id,false);toast('Future topic saved');};
  $('#deleteFutureButton').onclick=()=>{if(!isAdmin())return;state.future=state.future.filter(x=>x.id!==currentFutureId);persist();closeModal('futureModal');renderFuture();toast('Future topic deleted');};
  $('#cancelFutureEdit').onclick=()=>openFuture(currentFutureId,false);
  $('#addLibraryButton').onclick=openNewLibrary;
  $('#libraryForm').onsubmit=e=>{e.preventDefault();if(!isAdmin())return;const item=state.library.find(x=>x.id===currentLibraryId);if(!item)return;item.name=$('#libraryNameInput').value.trim();item.description=$('#libraryDescriptionInput').value.trim();item.sessions=Number($('#librarySessionsInput').value||0);item.resources=Number($('#libraryResourcesInput').value||0);item.featured=$('#libraryFeaturedInput').value.trim();persist();renderLibrary($('#librarySearch').value);openLibrary(item.id,false);toast('Library collection saved');};
  $('#deleteLibraryButton').onclick=()=>{if(!isAdmin())return;state.library=state.library.filter(x=>x.id!==currentLibraryId);persist();closeModal('libraryModal');renderLibrary($('#librarySearch').value);toast('Library collection deleted');};
  $('#cancelLibraryEdit').onclick=()=>openLibrary(currentLibraryId,false);
  $('#librarySearch').oninput=e=>renderLibrary(e.target.value);
  $('#adminLastHost').onchange=e=>{const id=e.target.value;const i=state.rotation.indexOf(id);$('#adminNextHost').value=state.people[state.rotation[(i+1)%state.rotation.length]].name;};
  $('#adminForm').onsubmit=e=>{e.preventDefault();if(!isAdmin())return;state.lastHost=$('#adminLastHost').value;state.nextSessionAt=new Date(`${$('#adminSessionDate').value}T${$('#adminSessionTime').value}:00`).toISOString();state.nextSessionPlace=$('#adminSessionPlace').value.trim();persist();closeModal('adminModal');renderAll();updateCountdown();toast('Admin settings saved');};
  $$('[data-admin-route]').forEach(btn=>btn.onclick=()=>{closeModal('adminModal');route(btn.dataset.adminRoute);});
  $('#exportDataButton').onclick=exportData;
  $('#importDataInput').onchange=async e=>{if(!isAdmin())return;const file=e.target.files?.[0];if(!file)return;try{const data=JSON.parse(await file.text());if(!data.people||!data.future||!data.library||!data.history)throw new Error('invalid');state=data;persist();closeModal('adminModal');renderAll();updateCountdown();toast('Team data imported');}catch(err){toast('Import file is not valid');}e.target.value='';};
  $('#historyForm').onsubmit=e=>{e.preventDefault();if(!isAdmin())return;const item=state.history.find(x=>x.id===currentHistoryId);if(!item)return;item.date=$('#historyDateInput').value;item.host=$('#historyHostInput').value;item.topic=$('#historyTopicInput').value.trim();item.type=$('#historyTypeInput').value.trim();persist();closeModal('historyModal');renderHistory();toast('History updated');};
  $('#deleteHistoryButton').onclick=()=>{if(!isAdmin())return;state.history=state.history.filter(x=>x.id!==currentHistoryId);persist();closeModal('historyModal');renderHistory();toast('History item deleted');};
  $('#completeShiftButton').onclick=completeCurrentShift;
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){$$('.modal.open').forEach(m=>closeModal(m.id));$$('.popover.open').forEach(p=>closePopover(p.id));}});
  document.addEventListener('click',e=>{if(!e.target.closest('#identityPopover')&&!e.target.closest('#identityButton'))closePopover('identityPopover');});
  window.addEventListener('resize',()=>{if(currentRoute==='future')initFutureMotion();});
}

async function init(){
  localLoad(); renderAll(); bind(); updateCountdown(); setInterval(updateCountdown,1000);
  await cloudLoad(); renderAll(); updateCountdown();
  const uiText=document.body.innerText;
  if(/[–—]/.test(uiText)) console.warn('Visible long dash detected');
}

window.addEventListener("load", () => {
  const intro = document.getElementById("intro");

  setTimeout(() => {
    intro.classList.add("hide");
  }, 1800);
});

init();
