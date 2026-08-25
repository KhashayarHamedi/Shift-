const $ = (s, root = document) => root.querySelector(s)
const $$ = (s, root = document) => [...root.querySelectorAll(s)]

const state = {
  page: 'home',
  sound: false,
  mystery: false,
}

const pageLabels = {
  home: 'TUESDAY 25 AUGUST',
  timeline: 'TIMELINE',
  ideas: 'IDEA WALL',
  radar: 'TECH RADAR',
  library: 'KNOWLEDGE LIBRARY',
  team: 'TEAM',
  profile: 'YOUR PROFILE',
}

window.addEventListener('load', () => {
  setTimeout(() => $('#intro').classList.add('done'), 1200)
  initReveal()
  updateCountdown()
  setInterval(updateCountdown, 30000)
})

function initReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible')
    })
  }, { threshold: .08 })
  $$('.reveal').forEach(el => observer.observe(el))
}

function navTo(page) {
  if (!$('#page-' + page)) return
  state.page = page
  $$('.page').forEach(el => el.classList.remove('active'))
  $('#page-' + page).classList.add('active')
  $$('.navItem, .mobileNav button').forEach(btn => btn.classList.toggle('active', btn.dataset.nav === page))
  $('#pageEyebrow').textContent = pageLabels[page] || 'SHIFT'
  $('#commandPalette').classList.remove('open')
  $('#commandPalette').setAttribute('aria-hidden', 'true')
  window.scrollTo({ top: 0, behavior: 'smooth' })
  setTimeout(() => $$('#page-' + page + ' .reveal').forEach(el => el.classList.add('visible')), 80)
}

$$('[data-nav]').forEach(btn => btn.addEventListener('click', () => navTo(btn.dataset.nav)))

function updateCountdown() {
  const target = new Date('2026-08-27T18:00:00+02:00')
  const now = new Date()
  let diff = Math.max(0, target - now)
  const d = Math.floor(diff / 86400000)
  diff %= 86400000
  const h = Math.floor(diff / 3600000)
  diff %= 3600000
  const m = Math.floor(diff / 60000)
  $('#days').textContent = String(d).padStart(2, '0')
  $('#hours').textContent = String(h).padStart(2, '0')
  $('#minutes').textContent = String(m).padStart(2, '0')
}

document.addEventListener('mousemove', e => {
  const glow = $('#cursorGlow')
  glow.style.left = e.clientX + 'px'
  glow.style.top = e.clientY + 'px'
})

$$('.tilt').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - .5
    const y = (e.clientY - r.top) / r.height - .5
    card.style.transform = `perspective(900px) rotateY(${x * 4}deg) rotateX(${y * -4}deg) translateY(-3px)`
  })
  card.addEventListener('mouseleave', () => card.style.transform = '')
})

$$('.magnetic').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const r = btn.getBoundingClientRect()
    const x = e.clientX - r.left - r.width / 2
    const y = e.clientY - r.top - r.height / 2
    btn.style.transform = `translate(${x * .08}px, ${y * .08}px)`
  })
  btn.addEventListener('mouseleave', () => btn.style.transform = '')
})

$$('.reactionBtn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation()
    const b = $('b', btn)
    if (b && !btn.dataset.reacted) {
      b.textContent = Number(b.textContent) + 1
      btn.dataset.reacted = 'true'
      btn.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(1.22)' },
        { transform: 'scale(1)' }
      ], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' })
      toast('Reaction added', '✦')
    }
  })
})

$('#soundBtn').addEventListener('click', () => {
  state.sound = !state.sound
  $('#soundIcon').textContent = state.sound ? '●' : '◌'
  toast(state.sound ? 'Ambient sound on' : 'Ambient sound off', state.sound ? '♪' : '◌')
})

$('#mysteryBtn').addEventListener('click', () => {
  state.mystery = !state.mystery
  const title = $('.heroStory h2')
  const description = $('.heroStory p')
  if (state.mystery) {
    title.dataset.original = title.innerHTML
    description.dataset.original = description.innerHTML
    title.innerHTML = 'TOPIC<br>CLASSIFIED<br><em>until Thursday.</em>'
    description.textContent = 'Usama has locked the topic. You will see it when the Shift begins.'
    $('#mysteryBtn').innerHTML = 'Turn mystery mode off <span>↗</span>'
    toast('Mystery mode is on', '◉')
  } else {
    title.innerHTML = title.dataset.original
    description.innerHTML = description.dataset.original
    $('#mysteryBtn').innerHTML = 'Turn mystery mode on <span>↗</span>'
    toast('Topic revealed', '✦')
  }
})

function openModal(id) {
  const modal = $('#' + id)
  modal.classList.add('open')
  modal.setAttribute('aria-hidden', 'false')
}
function closeModal(id) {
  const modal = $('#' + id)
  modal.classList.remove('open')
  modal.setAttribute('aria-hidden', 'true')
}
$$('[data-close]').forEach(el => el.addEventListener('click', () => closeModal(el.dataset.close)))

const topics = [
  ['AI AGENTS', 'Could AI agents replace half the software we currently use?'],
  ['ZERO INTERFACE', 'What happens when software stops needing screens?'],
  ['LOCAL MODELS', 'Could our most useful AI eventually run entirely on device?'],
  ['ROBOT TEAMS', 'What would a consulting team look like with five digital colleagues?'],
  ['TRUST', 'Which decisions should we never delegate to an agent?'],
  ['AUTOMATION', 'Could one person operate a company that used to need fifty?'],
  ['MCP', 'Is MCP becoming the USB C of software tools?'],
  ['FUTURE WORK', 'Which part of our job will feel ancient in three years?']
]
let topicTimer
function rollTopic() {
  clearInterval(topicTimer)
  let ticks = 0
  topicTimer = setInterval(() => {
    const [name] = topics[Math.floor(Math.random() * topics.length)]
    $('#topicRoller').textContent = name
    ticks++
    if (ticks > 11) {
      clearInterval(topicTimer)
      const [name, prompt] = topics[Math.floor(Math.random() * topics.length)]
      $('#topicRoller').textContent = name
      $('#topicPrompt').textContent = prompt
      $('#topicRoller').animate([{filter:'blur(8px)',transform:'translateY(8px)'},{filter:'none',transform:'none'}],{duration:330})
    }
  }, 70)
}
function openShiftMe() { openModal('shiftModal'); rollTopic() }
$('#shiftMeBtn').addEventListener('click', openShiftMe)
$('#mobileShiftMe').addEventListener('click', openShiftMe)
$('#commandShiftMe').addEventListener('click', () => { $('#commandPalette').classList.remove('open'); openShiftMe() })
$('#rollAgainBtn').addEventListener('click', rollTopic)

$('#newIdeaBtn').addEventListener('click', () => openModal('ideaModal'))
$('#publishIdeaBtn').addEventListener('click', () => {
  const title = $('#ideaInput').value.trim()
  const reason = $('#ideaReason').value.trim()
  if (!title) { toast('Give the idea a title first', '◌'); return }
  const card = document.createElement('article')
  card.className = 'wallCard'
  card.innerHTML = `<div><span>KASH · NEW IDEA</span><h3>${escapeHtml(title)}</h3></div><p>${escapeHtml(reason || 'Freshly added to the wall.')}</p><div class="wallFoot"><button class="reactionBtn">🔥 <b>1</b></button><span>just now</span></div>`
  $('#ideaWall').prepend(card)
  closeModal('ideaModal')
  $('#ideaInput').value = ''
  $('#ideaReason').value = ''
  toast('Idea published', '✦')
})

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))
}

$('#commandBtn').addEventListener('click', () => {
  $('#commandPalette').classList.add('open')
  $('#commandPalette').setAttribute('aria-hidden', 'false')
  setTimeout(() => $('#commandInput').focus(), 80)
})
$('#commandPalette').addEventListener('click', e => {
  if (e.target === $('#commandPalette')) {
    $('#commandPalette').classList.remove('open')
    $('#commandPalette').setAttribute('aria-hidden', 'true')
  }
})
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault(); $('#commandBtn').click()
  }
  if (e.key === 'Escape') {
    $$('.modal.open').forEach(m => closeModal(m.id))
    $('#commandPalette').classList.remove('open')
  }
})

$('#startShiftBtn').addEventListener('click', () => {
  $('#liveMode').classList.add('open')
  $('#liveMode').setAttribute('aria-hidden', 'false')
  document.body.style.overflow = 'hidden'
})
$('#exitLiveBtn').addEventListener('click', () => {
  $('#liveMode').classList.remove('open')
  $('#liveMode').setAttribute('aria-hidden', 'true')
  document.body.style.overflow = ''
})
$$('[data-live]').forEach(btn => {
  btn.addEventListener('click', () => {
    const emoji = btn.dataset.live
    for (let i = 0; i < 7; i++) {
      const el = document.createElement('span')
      el.className = 'floatingReaction'
      el.textContent = emoji
      el.style.left = (12 + Math.random() * 76) + 'vw'
      el.style.bottom = (4 + Math.random() * 12) + 'vh'
      el.style.animationDelay = (Math.random() * .16) + 's'
      $('#reactionStage').appendChild(el)
      setTimeout(() => el.remove(), 2000)
    }
  })
})

$$('.formatChoices button').forEach(btn => btn.addEventListener('click', () => {
  $$('.formatChoices button').forEach(b => b.style.background = '')
  btn.style.background = '#f4f1ea'
  btn.style.color = '#090909'
}))

function toast(text, icon = '✦') {
  $('#toastText').textContent = text
  $('#toastIcon').textContent = icon
  $('#toast').classList.add('show')
  clearTimeout(window.toastTimer)
  window.toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 1800)
}
