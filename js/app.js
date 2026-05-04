import { TOOLS, initToolModules } from './tools.js';

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

const state = {
  activeTool: TOOLS[0].id,
};

const NAV_LABELS = {
  password: 'Password',
  case: 'Case',
  counter: 'Counter',
  qr: 'QR',
  speed: 'Speed',
  timezone: 'Timezones',
  timer: 'Timer',
  random: 'Random',
  converter: 'Units',
};

function initTheme() {
  const toggle = $('[data-theme-toggle]');
  const label = $('[data-theme-label]');

  const syncLabel = () => {
    const current = document.documentElement.dataset.theme || 'dark';
    if (label) label.textContent = current === 'dark' ? 'Light' : 'Dark';
    toggle?.setAttribute('aria-label', `Switch to ${current === 'dark' ? 'light' : 'dark'} theme`);
  };

  toggle?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('aegis-theme', next);
    syncLabel();
  });

  syncLabel();
}

function renderToolTabs() {
  const tabs = $('#top-tool-tabs');
  if (!tabs) return;

  tabs.innerHTML = TOOLS.map(
    (tool) => `
      <button
        class="tab-button"
        type="button"
        role="tab"
        id="tab-${tool.id}"
        aria-controls="${tool.id}"
        aria-selected="${tool.id === state.activeTool}"
        data-tool-tab="${tool.id}"
      >
        ${NAV_LABELS[tool.id] || tool.title}
      </button>
    `,
  ).join('');

  tabs.addEventListener('click', (event) => {
    const button = event.target.closest('[data-tool-tab]');
    if (!button) return;
    activateTool(button.dataset.toolTab, true);
  });
}

function activateTool(toolId, updateHash = false) {
  const tool = TOOLS.find((entry) => entry.id === toolId);
  if (!tool) return;

  state.activeTool = tool.id;

  $$('[data-tool-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.toolPanel !== tool.id;
  });

  $$('[data-tool-tab]').forEach((tab) => {
    tab.setAttribute('aria-selected', String(tab.dataset.toolTab === tool.id));
  });

  if (updateHash) {
    history.replaceState(null, '', `#${tool.id}`);
    $('#workbench')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
}

function initHashRouting() {
  const routeFromHash = () => {
    const hash = window.location.hash.replace('#', '');
    if (TOOLS.some((tool) => tool.id === hash)) {
      activateTool(hash, false);
      $('#workbench')?.scrollIntoView({ block: 'start' });
    }
  };

  window.addEventListener('hashchange', routeFromHash);
  activateTool(state.activeTool, false);
  routeFromHash();
}

function init() {
  initTheme();
  renderToolTabs();
  initToolModules();
  initHashRouting();
}

init();
