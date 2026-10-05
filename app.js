// Campus Referral Console: a browser-only simulation.
// Everything below runs on synthetic data and is stored in this browser only.

const STORAGE_KEY = 'nxtwave-console-v2';
const TARGET = 500;
const PLANNED_CONNECTORS = 20;
const ELIGIBLE_YEAR = '2027';

const seed = {
  connectors: [
    { name: 'Priya Sharma', audience: 'VIT CSE, final year', channel: 'Student ambassador', code: 'PRIYA-VIT', unique: 42, status: 'Active' },
    { name: 'Rohit Mehta', audience: 'SRM placement group', channel: 'Placement community', code: 'ROHIT-SRM', unique: 38, status: 'Active' },
    { name: 'TechSphere Club', audience: 'MIT technical club', channel: 'Technical club', code: 'TECH-MIT', unique: 35, status: 'Active' },
    { name: 'Ayesha Khan', audience: 'BMSCE ISE, final year', channel: 'Student ambassador', code: 'AYESHA-BMS', unique: 27, status: 'Active' },
    { name: 'CodeCraft Club', audience: 'PESU coding community', channel: 'Technical club', code: 'CODE-PES', unique: 0, status: 'Pending' }
  ],
  registrations: [
    { name: 'Ananya Rao', college: 'VIT', branch: 'CSE', source: 'PRIYA-VIT', status: 'Verified', time: 'Sample record', email: 'ananya@example.com' },
    { name: 'Nikhil Verma', college: 'SRM', branch: 'IT', source: 'ROHIT-SRM', status: 'Verified', time: 'Sample record', email: 'nikhil@example.com' },
    { name: 'Ishita Nair', college: 'MIT', branch: 'CSE', source: 'TECH-MIT', status: 'Verified', time: 'Sample record', email: 'ishita@example.com' },
    { name: 'Arjun Pillai', college: 'BMSCE', branch: 'ISE', source: 'AYESHA-BMS', status: 'Verified', time: 'Sample record', email: 'arjun@example.com' }
  ],
  // Aggregates for the 20-connector simulation; only a few rows are listed above.
  gross: 361,
  baselineUnique: 324,
  rejected: 33,
  activeConnectorCount: 18,
  sourceTotals: { 'Student ambassador': 145, 'Technical club': 112, 'Placement community': 71 }
};

const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

// ---------- storage ----------

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.connectors)) return saved;
  } catch (error) {
    // Corrupt or blocked storage: fall back to the seeded demo.
  }
  return structuredClone(seed);
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    // Private mode or full storage: the demo still works for this visit.
  }
}

let state = load();

// ---------- rules ----------

// The same inbox can be written many ways: Priya.S+test@x.com and priyas@x.com
// reach one person. Referral programmes get gamed through exactly this, so the
// duplicate check compares a canonical form, not the raw string.
function canonicalEmail(email) {
  const [local, domain] = email.trim().toLowerCase().split('@');
  return `${local.split('+')[0].replace(/\./g, '')}@${domain}`;
}

function findExistingRegistration(email) {
  const key = canonicalEmail(email);
  // Only verified seats block a new entry. A student who first picked the wrong
  // graduation year should be able to correct it.
  return state.registrations.find(r => r.status === 'Verified' && r.email && canonicalEmail(r.email) === key);
}

function uniqueTotal() {
  return state.baselineUnique + state.registrations.filter(r => r.status === 'Verified').length;
}

function connectorPool() {
  return PLANNED_CONNECTORS + state.connectors.filter(c => c.custom).length;
}

function codeFor(name, audience) {
  const left = name.split(' ')[0].replace(/[^a-z]/gi, '').slice(0, 6).toUpperCase() || 'CAMPUS';
  const right = (audience.match(/[A-Za-z]{2,}/g) || ['LINK'])[0].slice(0, 4).toUpperCase();
  let code = `${left}-${right}`;
  let n = 2;
  while (state.connectors.some(c => c.code === code)) code = `${left}-${right}${n++}`;
  return code;
}

function linkFor(code) {
  const link = new URL(location.href);
  link.searchParams.set('ref', code);
  link.hash = 'register';
  return link.href;
}

// ---------- rendering ----------

function renderHeadline() {
  const unique = uniqueTotal();
  const gross = state.gross;
  const pool = connectorPool();
  const inactive = Math.max(0, pool - state.activeConnectorCount);

  $('#unique-total').textContent = unique;
  $('#metric-unique').textContent = unique;
  $('#metric-gross').textContent = gross;
  $('#metric-filtered').textContent = `${gross - unique} filtered for quality`;
  $('#metric-active').textContent = `${state.activeConnectorCount} / ${pool}`;
  $('#metric-inactive').textContent = inactive ? `${inactive} still need activation` : 'All connectors active';
  $('#metric-quality').textContent = `${(unique / gross * 100).toFixed(1)}%`;

  $('#progress-bar').style.width = `${Math.min(unique / TARGET * 100, 100)}%`;
  $('#progress-copy').textContent = unique >= TARGET
    ? 'Simulated target reached.'
    : `${TARGET - unique} sample registrations to target`;
}

function renderChart() {
  const unique = uniqueTotal();
  const days = [32, 70, 119, 171, 235, Math.min(unique, 328), unique];
  const peak = Math.max(unique, 328);
  $('#chart').innerHTML = days.map(value => `
    <div class="bar-wrap">
      <div class="bar" style="height:${Math.max(8, value / peak * 100)}%"><span>${value}</span></div>
    </div>`).join('');
}

function renderSources() {
  const channels = [
    ['Student ambassadors', state.sourceTotals['Student ambassador']],
    ['Technical clubs', state.sourceTotals['Technical club']],
    ['Placement communities', state.sourceTotals['Placement community']]
  ];
  const max = Math.max(...channels.map(([, value]) => value));
  $('#source-list').innerHTML = channels.map(([name, value]) => `
    <div class="source-row">
      <div class="source-title"><span>${name}</span><span>${value}</span></div>
      <div class="source-track"><i style="width:${value / max * 100}%"></i></div>
    </div>`).join('');
}

// Points the operator at one specific person instead of a generic to-do.
function renderNextAction() {
  const inactive = Math.max(0, connectorPool() - state.activeConnectorCount);
  const stalled = state.connectors.find(c => c.status === 'Pending');
  const button = $('#action-button');

  if (stalled) {
    $('#action-title').textContent = `Activate ${inactive} more connector${inactive === 1 ? '' : 's'}`;
    $('#action-copy').textContent = `Start with ${stalled.name} (${stalled.audience}). They have a code but no verified sign-ups yet, so one personal nudge is cheaper than recruiting someone new.`;
    button.textContent = `Open ${stalled.name.split(' ')[0]}'s kit →`;
    button.onclick = () => openKit(stalled);
    return;
  }

  const active = state.connectors.filter(c => c.status === 'Active');
  const slowest = active.reduce((low, c) => (c.unique < low.unique ? c : low), active[0]);
  $('#action-title').textContent = inactive ? `Recruit ${inactive} more connector${inactive === 1 ? '' : 's'}` : 'Keep active connectors engaged';
  $('#action-copy').textContent = slowest
    ? `${slowest.name} has the fewest verified sign-ups (${slowest.unique}). Check whether their audience is already saturated before sending another reminder.`
    : 'Give each connector a tracked kit and a distinct eligible audience.';
  button.textContent = 'Open connector list →';
  button.onclick = () => switchView('connectors');
}

function renderConnectors() {
  $('#connectors-body').innerHTML = state.connectors.map((c, i) => `
    <tr>
      <td><b>${escapeHTML(c.name)}</b><small>${escapeHTML(c.audience)}</small></td>
      <td>${escapeHTML(c.channel)}</td>
      <td><span class="code">${escapeHTML(c.code)}</span></td>
      <td><b>${c.unique}</b></td>
      <td><span class="status ${c.status === 'Pending' ? 'pending' : ''}">${escapeHTML(c.status)}</span></td>
      <td><button class="row-button" data-kit="${i}">Open kit →</button></td>
    </tr>`).join('');
  $$('[data-kit]').forEach(button => {
    button.onclick = () => openKit(state.connectors[+button.dataset.kit]);
  });
}

function renderRegistrations() {
  $('#registrations-body').innerHTML = state.registrations.slice().reverse().map(r => `
    <tr>
      <td><b>${escapeHTML(r.name)}</b><small>${escapeHTML(r.email || 'Synthetic prototype record')}</small></td>
      <td>${escapeHTML(r.college)}<small>${escapeHTML(r.branch)}</small></td>
      <td><span class="code">${escapeHTML(r.source)}</span></td>
      <td><span class="status ${r.status === 'Verified' ? '' : 'pending'}">${escapeHTML(r.status)}</span></td>
      <td>${escapeHTML(r.time)}</td>
    </tr>`).join('');
}

function render() {
  renderHeadline();
  renderChart();
  renderSources();
  renderNextAction();
  renderConnectors();
  renderRegistrations();
}

// ---------- navigation and dialogs ----------

const VIEW_TITLES = { dashboard: 'Overview', connectors: 'Connectors', registrations: 'Registrations' };

function switchView(name) {
  $$('.view').forEach(view => view.classList.toggle('active', view.id === `${name}-view`));
  $$('.nav-link').forEach(link => link.classList.toggle('active', link.dataset.view === name));
  $('#page-title').textContent = VIEW_TITLES[name];
  history.replaceState(null, '', `#${name}`);
  window.scrollTo(0, 0);
}

function openKit(connector) {
  const link = linkFor(connector.code);
  $('#kit-name').textContent = `${connector.name.split(' ')[0]}'s referral kit`;
  $('#kit-code').textContent = connector.code;
  $('#kit-link').value = link;
  $('#kit-message').value = `Hey! I found a free NxtWave workshop for final-year engineering students: “Build Your First AI Project in 60 Minutes.”\n\nYou’ll build a small AI project and leave with a portfolio next step. Register here: ${link}`;
  $('#open-kit-registration').onclick = () => {
    $('#kit-modal').close();
    openStudent(connector.code);
  };
  $('#kit-modal').showModal();
}

function openStudent(ref) {
  const connector = state.connectors.find(c => c.code === ref);
  const form = $('#student-form');
  form.reset();
  form.email.setCustomValidity('');
  form.dataset.ref = ref || '';
  $('#form-referrer').textContent = connector ? connector.name : 'Campus connector';
  $('#student-modal').showModal();
}

function showResult(status, name, match, email) {
  const verified = status === 'Verified';
  const icon = $('#result-icon');
  icon.textContent = verified ? '✓' : '!';
  icon.style.background = verified ? '#e6f8f5' : '#fff2e6';
  icon.style.color = verified ? '#03ab9d' : '#c8752e';

  $('#result-eyebrow').textContent = verified ? 'SAMPLE REGISTRATION RECORDED' : 'QUALITY CHECK COMPLETE';

  const copy = {
    Verified: ['Sample seat recorded.', `${name}, the sample source and eligibility were recorded in this browser.`],
    Ineligible: ['Not eligible in this scenario.', `${name}, this graduation year is outside the sample final-year audience. The unique total did not change.`],
    Duplicate: ['Already counted.', match && match.email !== email
      ? `${email} reaches the same inbox as ${match.email}, which is already registered. Dots and +tags are ignored. The unique total did not change.`
      : `${name}, this sample email is already registered. The unique total did not change.`]
  }[status];

  $('#result-title').textContent = copy[0];
  $('#result-copy').textContent = copy[1];
  $('#result-modal').showModal();
}

async function copyField(button) {
  const input = $(`#${button.dataset.copy}`);
  try {
    await navigator.clipboard.writeText(input.value);
  } catch (error) {
    input.select();
    document.execCommand('copy');
  }
  const label = button.textContent;
  button.textContent = 'Copied';
  setTimeout(() => { button.textContent = label; }, 1200);
}

// ---------- events ----------

$$('[data-view]').forEach(link => {
  link.onclick = event => {
    event.preventDefault();
    switchView(link.dataset.view);
  };
});
$$('[data-view-target]').forEach(button => {
  button.onclick = () => switchView(button.dataset.viewTarget);
});

$('#new-connector').onclick = $('#new-connector-2').onclick = () => $('#connector-modal').showModal();
$('#open-student-form').onclick = () => openStudent('PRIYA-VIT');
$('#open-kit-registration').onclick = () => openStudent('PRIYA-VIT');
$$('[data-copy]').forEach(button => { button.onclick = () => copyField(button); });

$('#connector-form').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const name = data.get('name').trim();
  const audience = data.get('audience').trim();
  const connector = {
    name,
    audience,
    channel: data.get('channel'),
    code: codeFor(name, audience),
    unique: 0,
    status: 'Pending',
    custom: true
  };
  state.connectors.unshift(connector);
  save();
  render();
  event.currentTarget.reset();
  $('#connector-modal').close();
  openKit(connector);
});

$('#student-form').email.addEventListener('input', event => event.target.setCustomValidity(''));

$('#student-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const email = data.get('email').trim().toLowerCase();
  const name = data.get('studentName').trim();
  const ref = form.dataset.ref || 'DIRECT';

  if (!email.endsWith('@example.com')) {
    form.email.setCustomValidity('This sandbox only accepts sample @example.com addresses.');
    form.email.reportValidity();
    return;
  }

  const match = findExistingRegistration(email);
  const status = match ? 'Duplicate' : data.get('year') === ELIGIBLE_YEAR ? 'Verified' : 'Ineligible';

  state.gross++;
  if (status !== 'Verified') state.rejected++;
  state.registrations.push({
    name,
    college: data.get('college'),
    branch: data.get('branch'),
    source: ref,
    status,
    time: 'Just now',
    email
  });

  if (status === 'Verified') {
    const connector = state.connectors.find(c => c.code === ref);
    if (connector) {
      if (connector.status === 'Pending') state.activeConnectorCount++;
      connector.unique++;
      connector.status = 'Active';
      state.sourceTotals[connector.channel]++;
    }
  }

  save();
  render();
  $('#student-modal').close();
  showResult(status, name, match, email);
});

$('#reset-data').onclick = () => {
  try { localStorage.removeItem(STORAGE_KEY); } catch (error) { /* nothing stored */ }
  state = structuredClone(seed);
  render();
};

// ---------- start ----------

render();

const startView = location.hash.slice(1);
if (VIEW_TITLES[startView]) switchView(startView);

if (location.hash === '#register') {
  const ref = new URLSearchParams(location.search).get('ref');
  setTimeout(() => openStudent(ref), 300);
}
