import { TOOLS, initToolModules } from './tools.js';

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

const STORAGE_KEYS = {
  favorites: 'aegis-favorite-tools',
  recentTools: 'aegis-recent-tools',
  presets: 'aegis-tool-presets',
  history: 'aegis-tool-history',
};

const NAV_LABELS = {
  password: 'Password',
  hash: 'Hash',
  case: 'Case',
  counter: 'Counter',
  json: 'JSON',
  encode: 'Encode',
  qr: 'QR',
  speed: 'Speed Test',
  timezone: 'Timezones',
  datetime: 'Dates',
  timer: 'Timer',
  random: 'Random',
  uuid: 'UUID',
  converter: 'Units',
};

const PRESET_TOOL_IDS = new Set(['password', 'hash', 'json', 'encode', 'qr', 'timezone', 'datetime', 'timer', 'random', 'uuid', 'converter']);
const PRIMARY_TOOLS = TOOLS.filter((tool) => tool.primary !== false);

const state = {
  activeTool: TOOLS[0].id,
  viewMode: 'home',
  favorites: new Set(readStoredJson(STORAGE_KEYS.favorites, [])),
  recentTools: readStoredJson(STORAGE_KEYS.recentTools, []),
  presets: readStoredJson(STORAGE_KEYS.presets, {}),
  history: readStoredJson(STORAGE_KEYS.history, {}),
  isApplyingState: false,
  urlSyncTimer: 0,
  historyTimers: new Map(),
  workspaceStatusTimers: new Map(),
  audioContext: null,
  searchOpen: false,
  toolDrawerOpen: false,
};

const TOOL_STATE_ADAPTERS = {
  password: {
    params: {
      length: 'pw_len',
      lowercase: 'pw_low',
      uppercase: 'pw_up',
      numbers: 'pw_num',
      symbols: 'pw_sym',
      ambiguous: 'pw_amb',
    },
    getState: () => ({
      length: Number($('#password-length')?.value || 18),
      lowercase: $('#password-lowercase')?.checked ?? true,
      uppercase: $('#password-uppercase')?.checked ?? true,
      numbers: $('#password-numbers')?.checked ?? true,
      symbols: $('#password-symbols')?.checked ?? true,
      ambiguous: $('#password-ambiguous')?.checked ?? false,
    }),
    applyState: (toolState) => {
      applyCheckedState('#password-lowercase', toolState.lowercase);
      applyCheckedState('#password-uppercase', toolState.uppercase);
      applyCheckedState('#password-numbers', toolState.numbers);
      applyCheckedState('#password-symbols', toolState.symbols);
      applyCheckedState('#password-ambiguous', toolState.ambiguous);
      applyValueState('#password-length', toolState.length);
    },
    watch: (callback) => {
      bindToolWatchers(
        ['#password-length', '#password-lowercase', '#password-uppercase', '#password-numbers', '#password-symbols', '#password-ambiguous'],
        callback,
      );
    },
    summarize: (toolState) => {
      const enabled = [
        toolState.lowercase && 'abc',
        toolState.uppercase && 'ABC',
        toolState.numbers && '123',
        toolState.symbols && '#$!',
        toolState.ambiguous && 'clear',
      ]
        .filter(Boolean)
        .join(' ');
      return `${toolState.length || 18} chars${enabled ? ` · ${enabled}` : ''}`;
    },
  },
  hash: {
    params: {
      source: 'hash_source',
      algorithm: 'hash_alg',
      text: 'hash_text',
    },
    autoSyncParams: {
      source: 'hash_source',
      algorithm: 'hash_alg',
    },
    getState: () => ({
      source: $('#hash-source')?.value || 'text',
      algorithm: $('#hash-algorithm')?.value || 'sha256',
      text: $('#hash-input')?.value || '',
    }),
    applyState: (toolState) => {
      applyValueState('#hash-source', toolState.source);
      applyValueState('#hash-algorithm', toolState.algorithm);
      applyValueState('#hash-input', toolState.text);
    },
    watch: (callback) => {
      bindToolWatchers(['#hash-source', '#hash-algorithm', '#hash-input'], callback);
    },
    summarize: (toolState) => `${toolState.algorithm || 'sha256'} · ${toolState.source || 'text'}${toolState.source === 'text' ? ` · ${summarizeText(toolState.text, 24)}` : ''}`,
  },
  case: {
    params: {
      text: 'case_text',
      mode: 'case_mode',
    },
    autoSyncParams: {
      mode: 'case_mode',
    },
    getState: () => ({
      text: $('#case-input')?.value || '',
      mode: $('[data-case-mode][aria-pressed="true"]')?.dataset.caseMode || 'lower',
    }),
    applyState: (toolState) => {
      applyValueState('#case-input', toolState.text);
      const modeButton = toolState.mode ? $(`[data-case-mode="${toolState.mode}"]`) : null;
      modeButton?.click();
    },
    watch: (callback) => {
      bindToolWatchers(['#case-input'], callback);
      $$('[data-case-mode]').forEach((button) => button.addEventListener('click', callback));
    },
    summarize: (toolState) => `${toolState.mode || 'lower'} · ${summarizeText(toolState.text, 36)}`,
  },
  counter: {
    params: {
      text: 'counter_text',
    },
    autoSyncParams: {},
    getState: () => ({
      text: $('#counter-input')?.value || '',
    }),
    applyState: (toolState) => {
      applyValueState('#counter-input', toolState.text);
    },
    watch: (callback) => {
      bindToolWatchers(['#counter-input'], callback);
    },
    summarize: (toolState) => summarizeText(toolState.text, 36),
  },
  json: {
    params: {
      text: 'json_text',
      mode: 'json_mode',
      indent: 'json_indent',
      sortKeys: 'json_sort',
    },
    autoSyncParams: {
      mode: 'json_mode',
      indent: 'json_indent',
      sortKeys: 'json_sort',
    },
    getState: () => ({
      text: $('#json-input')?.value || '',
      mode: $('#json-mode')?.value || 'pretty',
      indent: Number($('#json-indent')?.value || 2),
      sortKeys: $('#json-sort-keys')?.checked ?? false,
    }),
    applyState: (toolState) => {
      applyValueState('#json-input', toolState.text);
      applyValueState('#json-mode', toolState.mode);
      applyValueState('#json-indent', toolState.indent);
      applyCheckedState('#json-sort-keys', toolState.sortKeys);
    },
    watch: (callback) => {
      bindToolWatchers(['#json-input', '#json-mode', '#json-indent', '#json-sort-keys'], callback);
    },
    summarize: (toolState) => `${toolState.mode || 'pretty'}${toolState.sortKeys ? ' · sorted' : ''} · ${summarizeText(toolState.text, 30)}`,
  },
  encode: {
    params: {
      text: 'enc_text',
      mode: 'enc_mode',
      direction: 'enc_dir',
    },
    autoSyncParams: {
      mode: 'enc_mode',
      direction: 'enc_dir',
    },
    getState: () => ({
      text: $('#encode-input')?.value || '',
      mode: $('#encode-mode')?.value || 'base64',
      direction: $('#encode-direction')?.value || 'encode',
    }),
    applyState: (toolState) => {
      applyValueState('#encode-input', toolState.text);
      applyValueState('#encode-mode', toolState.mode);
      applyValueState('#encode-direction', toolState.direction);
    },
    watch: (callback) => {
      bindToolWatchers(['#encode-input', '#encode-mode', '#encode-direction'], callback);
    },
    summarize: (toolState) => `${toolState.direction || 'encode'} ${toolState.mode || 'base64'} · ${summarizeText(toolState.text, 28)}`,
  },
  qr: {
    params: {
      text: 'qr_text',
      size: 'qr_size',
      quietZone: 'qr_qz',
    },
    autoSyncParams: {},
    getState: () => ({
      text: $('#qr-input')?.value || '',
      size: Number($('#qr-size')?.value || 768),
      quietZone: Number($('#qr-quiet-zone')?.value || 4),
    }),
    applyState: (toolState) => {
      applyValueState('#qr-input', toolState.text);
      applyValueState('#qr-size', toolState.size);
      applyValueState('#qr-quiet-zone', toolState.quietZone);
    },
    watch: (callback) => {
      bindToolWatchers(['#qr-input', '#qr-size', '#qr-quiet-zone'], callback);
    },
    summarize: (toolState) => `${summarizeText(toolState.text, 28)} · ${toolState.size || 768}px`,
  },
  timezone: {
    params: {
      value: 'tz_value',
      from: 'tz_from',
      to: 'tz_to',
    },
    getState: () => ({
      value: $('#timezone-input')?.value || '',
      from: $('#timezone-from')?.value || '',
      to: $('#timezone-to')?.value || '',
    }),
    applyState: (toolState) => {
      applyValueState('#timezone-input', toolState.value);
      applyValueState('#timezone-from', toolState.from);
      applyValueState('#timezone-to', toolState.to);
    },
    watch: (callback) => {
      bindToolWatchers(['#timezone-input', '#timezone-from', '#timezone-to'], callback);
    },
    summarize: (toolState) => {
      const time = toolState.value ? toolState.value.replace('T', ' ') : 'Current time';
      return `${time} · ${toolState.from || 'UTC'} to ${toolState.to || 'UTC'}`;
    },
  },
  datetime: {
    params: {
      source: 'dt_value',
      assume: 'dt_assume',
      start: 'dt_start',
      end: 'dt_end',
    },
    autoSyncParams: {
      assume: 'dt_assume',
      start: 'dt_start',
      end: 'dt_end',
    },
    getState: () => ({
      source: $('#datetime-source')?.value || '',
      assume: $('#datetime-assume-timezone')?.value || 'local',
      start: $('#datetime-start')?.value || '',
      end: $('#datetime-end')?.value || '',
    }),
    applyState: (toolState) => {
      applyValueState('#datetime-source', toolState.source);
      applyValueState('#datetime-assume-timezone', toolState.assume);
      applyValueState('#datetime-start', toolState.start);
      applyValueState('#datetime-end', toolState.end);
    },
    watch: (callback) => {
      bindToolWatchers(['#datetime-source', '#datetime-assume-timezone', '#datetime-start', '#datetime-end'], callback);
    },
    summarize: (toolState) => `${summarizeText(toolState.source, 24)} · ${toolState.start || 'start'} to ${toolState.end || 'end'}`,
  },
  timer: {
    params: {
      hours: 'tm_h',
      minutes: 'tm_m',
      seconds: 'tm_s',
      notify: 'tm_n',
      sound: 'tm_sound',
      vibrate: 'tm_v',
    },
    getState: () => ({
      hours: Number($('#timer-hours')?.value || 0),
      minutes: Number($('#timer-minutes')?.value || 5),
      seconds: Number($('#timer-seconds')?.value || 0),
      notify: $('#timer-notify')?.checked ?? false,
      sound: $('#timer-sound')?.checked ?? true,
      vibrate: $('#timer-vibrate')?.checked ?? true,
    }),
    applyState: (toolState) => {
      applyValueState('#timer-hours', toolState.hours);
      applyValueState('#timer-minutes', toolState.minutes);
      applyValueState('#timer-seconds', toolState.seconds);
      applyCheckedState('#timer-notify', toolState.notify);
      applyCheckedState('#timer-sound', toolState.sound);
      applyCheckedState('#timer-vibrate', toolState.vibrate);
    },
    watch: (callback) => {
      bindToolWatchers(
        ['#timer-hours', '#timer-minutes', '#timer-seconds', '#timer-notify', '#timer-sound', '#timer-vibrate'],
        callback,
      );
    },
    summarize: (toolState) => {
      const totalSeconds = ((toolState.hours || 0) * 3600) + ((toolState.minutes || 0) * 60) + (toolState.seconds || 0);
      const alerts = [
        toolState.notify && 'alert',
        toolState.sound && 'sound',
        toolState.vibrate && 'vibrate',
      ]
        .filter(Boolean)
        .join(', ');
      return `${formatDuration(totalSeconds * 1000)}${alerts ? ` · ${alerts}` : ''}`;
    },
  },
  random: {
    params: {
      min: 'rand_min',
      max: 'rand_max',
      count: 'rand_count',
      decimals: 'rand_dec',
      unique: 'rand_unique',
      sort: 'rand_sort',
    },
    getState: () => ({
      min: Number($('#random-min')?.value || 1),
      max: Number($('#random-max')?.value || 100),
      count: Number($('#random-count')?.value || 1),
      decimals: Number($('#random-decimals')?.value || 0),
      unique: $('#random-unique')?.checked ?? false,
      sort: $('#random-sort')?.value || 'none',
    }),
    applyState: (toolState) => {
      applyValueState('#random-min', toolState.min);
      applyValueState('#random-max', toolState.max);
      applyValueState('#random-count', toolState.count);
      applyValueState('#random-decimals', toolState.decimals);
      applyCheckedState('#random-unique', toolState.unique);
      applyValueState('#random-sort', toolState.sort);
      $('#random-generate')?.click();
    },
    watch: (callback) => {
      bindToolWatchers(['#random-min', '#random-max', '#random-count', '#random-decimals', '#random-unique', '#random-sort'], callback);
    },
    summarize: (toolState) => {
      const quantity = toolState.count > 1 ? `${toolState.count} values` : '1 value';
      const unique = toolState.unique ? ' · unique' : '';
      const decimals = toolState.decimals ? ` · ${toolState.decimals}dp` : '';
      return `${quantity}${unique}${decimals} · ${toolState.min} to ${toolState.max}`;
    },
  },
  uuid: {
    params: {
      count: 'uuid_count',
      case: 'uuid_case',
      separator: 'uuid_sep',
      braces: 'uuid_braces',
    },
    getState: () => ({
      count: Number($('#uuid-count')?.value || 1),
      case: $('#uuid-case')?.value || 'lower',
      separator: $('#uuid-separator')?.value || 'lines',
      braces: $('#uuid-braces')?.checked ?? false,
    }),
    applyState: (toolState) => {
      applyValueState('#uuid-count', toolState.count);
      applyValueState('#uuid-case', toolState.case);
      applyValueState('#uuid-separator', toolState.separator);
      applyCheckedState('#uuid-braces', toolState.braces);
    },
    watch: (callback) => {
      bindToolWatchers(['#uuid-count', '#uuid-case', '#uuid-separator', '#uuid-braces'], callback);
    },
    summarize: (toolState) => `${toolState.count || 1} UUIDs · ${toolState.case || 'lower'}${toolState.braces ? ' · braced' : ''}`,
  },
  converter: {
    params: {
      category: 'unit_cat',
      value: 'unit_value',
      from: 'unit_from',
      to: 'unit_to',
    },
    getState: () => ({
      category: $('#unit-category')?.value || 'length',
      value: $('#unit-value')?.value || '1',
      from: $('#unit-from')?.value || '',
      to: $('#unit-to')?.value || '',
    }),
    applyState: (toolState) => {
      applyValueState('#unit-category', toolState.category);
      applyValueState('#unit-value', toolState.value);
      applyValueState('#unit-from', toolState.from);
      applyValueState('#unit-to', toolState.to);
    },
    watch: (callback) => {
      bindToolWatchers(['#unit-category', '#unit-value', '#unit-from', '#unit-to'], callback);
    },
    summarize: (toolState) => `${toolState.value} · ${toolState.from || '?'} to ${toolState.to || '?'}`,
  },
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
  const tabTools = getVisibleNavTools();

  if (tabs) {
    tabs.innerHTML = tabTools.map(
      (tool) => `
        <button
          class="tab-button"
          type="button"
          role="tab"
          id="tab-${tool.id}"
          aria-controls="${tool.id}"
          aria-selected="${tool.id === state.activeTool}"
          tabindex="${tool.id === state.activeTool ? '0' : '-1'}"
          data-tool-tab="${tool.id}"
          data-favorite="${state.favorites.has(tool.id)}"
        >
          ${NAV_LABELS[tool.id] || tool.title}
        </button>
      `,
    ).join('');
  }

  renderToolDrawer();

  if (tabs && !tabs.dataset.bound) {
    tabs.addEventListener('click', (event) => {
      const button = event.target.closest('[data-tool-tab]');
      if (!button) return;
      activateTool(button.dataset.toolTab, { scroll: true });
    });
    tabs.addEventListener('keydown', (event) => {
      const tabButtons = $$('[data-tool-tab]', tabs);
      const currentIndex = tabButtons.findIndex((button) => button === document.activeElement);
      if (currentIndex === -1) return;

      let nextIndex = null;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        nextIndex = (currentIndex + 1) % tabButtons.length;
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        nextIndex = (currentIndex - 1 + tabButtons.length) % tabButtons.length;
      } else if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = tabButtons.length - 1;
      }

      if (nextIndex === null) return;
      event.preventDefault();
      const nextTab = tabButtons[nextIndex];
      activateTool(nextTab.dataset.toolTab, { scroll: false });
      nextTab.focus();
    });
    tabs.dataset.bound = 'true';
  }
}

function renderToolDrawer() {
  const groups = $('#tool-drawer-groups');
  if (!groups) return;

  const groupedTools = getVisibleNavTools().reduce((accumulator, tool) => {
    if (!accumulator.has(tool.category)) {
      accumulator.set(tool.category, []);
    }
    accumulator.get(tool.category).push(tool);
    return accumulator;
  }, new Map());

  groups.innerHTML = [...groupedTools.entries()]
    .map(([category, tools]) => `
      <section class="tool-drawer-group" aria-label="${escapeHtml(category)} tools">
        <div class="tool-drawer-group-head">
          <h3>${escapeHtml(category)}</h3>
          <span>${tools.length}</span>
        </div>
        <div class="tool-drawer-list">
          ${tools.map((tool) => `
            <button class="tool-drawer-link" type="button" data-drawer-tool="${tool.id}" aria-current="${tool.id === state.activeTool ? 'true' : 'false'}">
              <strong>${escapeHtml(NAV_LABELS[tool.id] || tool.title)}</strong>
              <span>${escapeHtml(tool.summary)}</span>
            </button>
          `).join('')}
        </div>
      </section>
    `)
    .join('');
}

function getVisibleNavTools() {
  const activeTool = getTool(state.activeTool);
  if (activeTool && activeTool.primary === false) {
    return [...PRIMARY_TOOLS, activeTool];
  }
  return PRIMARY_TOOLS;
}

function activateTool(toolId, options = {}) {
  const { recordRecent = true, scroll = false, syncUrl = true } = options;
  const tool = TOOLS.find((entry) => entry.id === toolId);
  if (!tool) return;

  state.activeTool = tool.id;
  setViewMode('tool');
  renderToolTabs();

  $$('[data-tool-panel]').forEach((panel) => {
    const isActive = panel.dataset.toolPanel === tool.id;
    panel.hidden = !isActive;
    panel.setAttribute('aria-hidden', String(!isActive));
    panel.tabIndex = isActive ? 0 : -1;
  });

  $$('[data-tool-tab]').forEach((tab) => {
    const isActive = tab.dataset.toolTab === tool.id;
    tab.setAttribute('aria-selected', String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
  });

  if (recordRecent) updateRecentTools(tool.id);
  renderQuickCollections();
  renderPanelEnhancements();
  renderSearchResults($('#tool-search')?.value || '');
  closeToolDrawer();

  if (scroll) {
    $('#workbench')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  if (syncUrl) {
    scheduleUrlSync();
  }
}

function initToolSearch() {
  const input = $('#tool-search');
  if (!input) return;

  input.addEventListener('input', () => {
    state.searchOpen = true;
    renderSearchResults(input.value);
  });

  input.addEventListener('focus', () => {
    state.searchOpen = true;
    renderSearchResults(input.value);
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      const [firstMatch] = getToolMatches(input.value);
      if (!firstMatch) return;
      event.preventDefault();
      activateTool(firstMatch.id, { scroll: true });
      closeToolSearch({ clear: true, blur: true });
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeToolSearch({ clear: !input.value.trim(), blur: true });
    }
  });

  document.addEventListener('keydown', (event) => {
    const target = event.target;
    const isEditable = target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable="true"]');
    if ((event.key === '/' && !isEditable) || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k')) {
      event.preventDefault();
      state.searchOpen = true;
      input.focus();
      input.select();
      renderSearchResults(input.value);
    }
  });

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Node)) return;
    if (input.contains(event.target) || $('#tool-search-results')?.contains(event.target)) return;
    closeToolSearch();
  });
}

function renderSearchResults(query) {
  const results = $('#tool-search-results');
  if (!results) return;

  if (!state.searchOpen) {
    results.innerHTML = '';
    return;
  }

  const trimmed = query.trim();
  if (!trimmed) {
    const defaultTools = getDefaultSearchTools();
    results.innerHTML = defaultTools
      .map((tool) => buildSearchResultMarkup(tool))
      .join('');
    return;
  }

  const matches = getToolMatches(trimmed);
  results.innerHTML = matches.length
    ? matches.map((tool) => buildSearchResultMarkup(tool)).join('')
    : `
        <div class="tool-search-result" role="status">
          <strong>No matches</strong>
          <span>Try a tool name, category, or what you want to do.</span>
        </div>
      `;
}

function getDefaultSearchTools() {
  const ids = [...state.favorites, ...state.recentTools];
  const unique = [...new Set(ids)].slice(0, 5);
  const fallback = PRIMARY_TOOLS.map((tool) => tool.id);
  return [...new Set([...unique, ...fallback])].slice(0, 5).map((toolId) => getTool(toolId));
}

function getToolMatches(query) {
  const normalized = query.trim().toLowerCase();
  return TOOLS
    .map((tool) => {
      const haystack = `${tool.title} ${tool.category} ${tool.summary} ${tool.keywords || ''}`.toLowerCase();
      let score = 0;
      if (tool.title.toLowerCase().startsWith(normalized)) score += 4;
      if ((NAV_LABELS[tool.id] || '').toLowerCase().startsWith(normalized)) score += 3;
      if (haystack.includes(normalized)) score += 2;
      if (state.favorites.has(tool.id)) score += 0.5;
      if (tool.primary === false) score -= 0.25;
      return { ...tool, score };
    })
    .filter((tool) => tool.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 6);
}

function buildSearchResultMarkup(tool) {
  return `
    <button class="tool-search-result" type="button" data-search-tool="${tool.id}">
      <strong>${escapeHtml(tool.title)}</strong>
      <span>${tool.primary === false ? 'Preview · ' : ''}${escapeHtml(tool.category)} · ${escapeHtml(tool.summary)}</span>
    </button>
  `;
}

function closeToolSearch(options = {}) {
  const { clear = false, blur = false } = options;
  const input = $('#tool-search');
  if (!input) return;

  state.searchOpen = false;
  if (clear) input.value = '';
  if (blur) input.blur();
  renderSearchResults(input.value);
}

function initToolStateSync() {
  Object.entries(TOOL_STATE_ADAPTERS).forEach(([toolId, adapter]) => {
    adapter.watch(() => {
      if (state.isApplyingState) return;
      if (toolId === state.activeTool) {
        scheduleUrlSync();
      }
      if (PRESET_TOOL_IDS.has(toolId)) {
        scheduleHistorySnapshot(toolId);
      }
      if (toolId === 'timer') {
        syncTimerAlertStatus();
      }
    });
  });
}

function renderQuickCollections() {
  renderCollection('#favorite-tools', [...state.favorites], 'favorite');
  renderCollection('#recent-tools', state.recentTools, 'recent');
}

function renderCollection(selector, toolIds, kind) {
  const container = $(selector);
  if (!container) return;

  const tools = toolIds
    .map((toolId) => getTool(toolId))
    .filter(Boolean);

  if (!tools.length) {
    const suggestions = getCollectionSuggestions(kind);
    container.innerHTML = `
      <div class="collection-empty">
        <p>${kind === 'favorite' ? 'Pin the tools you revisit most often.' : 'Recent tools appear here after you open them.'}</p>
        <div class="chip-list">
          ${suggestions
            .map(
              (tool) => `
                <button class="chip-button" type="button" data-chip-tool="${tool.id}" data-kind="${kind}">
                  ${escapeHtml(NAV_LABELS[tool.id] || tool.title)}
                </button>
              `,
            )
            .join('')}
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = tools
    .map(
      (tool) => `
        <button class="chip-button" type="button" data-chip-tool="${tool.id}" data-kind="${kind}">
          ${escapeHtml(NAV_LABELS[tool.id] || tool.title)}
        </button>
      `,
    )
    .join('');
}

function getCollectionSuggestions(kind) {
  const defaults = kind === 'favorite'
    ? ['password', 'timezone', 'converter']
    : [state.activeTool, 'random', 'timer'];

  return defaults
    .map((toolId) => getTool(toolId))
    .filter((tool, index, list) => tool && tool.primary !== false && list.findIndex((entry) => entry?.id === tool.id) === index)
    .slice(0, 3);
}

function renderPanelEnhancements() {
  $$('[data-tool-panel]').forEach((panel) => {
    const toolId = panel.dataset.toolPanel;
    const header = $('.panel-header', panel);
    if (!header || !toolId) return;

    const existingWorkspace = $(`[data-panel-workspace="${toolId}"]`, panel);
    const workspace = existingWorkspace || document.createElement('section');

    workspace.className = 'panel-workspace';
    workspace.dataset.panelWorkspace = toolId;
    workspace.setAttribute('aria-label', 'Workspace actions');
    workspace.innerHTML = buildPanelWorkspaceMarkup(toolId);

    if (!existingWorkspace) {
      header.insertAdjacentElement('afterend', workspace);
    }
  });
}

function buildPanelWorkspaceMarkup(toolId) {
  const presets = state.presets[toolId] || [];
  const history = state.history[toolId] || [];
  const summaryParts = [];
  if (state.favorites.has(toolId)) summaryParts.push('Pinned');
  if (PRESET_TOOL_IDS.has(toolId) && presets.length) {
    summaryParts.push(`${presets.length} preset${presets.length === 1 ? '' : 's'}`);
  }
  if (PRESET_TOOL_IDS.has(toolId) && history.length) {
    summaryParts.push(`${history.length} recent`);
  }
  const summary = summaryParts.join(' · ') || 'Quick actions and saved setup links';

  return `
    <div class="panel-workspace-bar">
      <div class="panel-workspace-copy">
        <span class="panel-workspace-heading">Workspace</span>
        <span class="panel-workspace-meta">${escapeHtml(summary)}</span>
      </div>
      <div class="panel-utilities">
        <button class="panel-action" type="button" data-panel-favorite="${toolId}" aria-pressed="${state.favorites.has(toolId)}">${state.favorites.has(toolId) ? 'Pinned' : 'Pin to favorites'}</button>
        <button class="panel-action" type="button" data-panel-share="${toolId}">Copy share link</button>
        ${PRESET_TOOL_IDS.has(toolId)
          ? `<button class="panel-action" type="button" data-panel-save-preset="${toolId}">Save preset</button>`
          : ''}
      </div>
    </div>
    ${buildWorkspaceShortcutMarkup(toolId, presets, history)}
    <p class="workspace-status" id="workspace-status-${toolId}" aria-live="polite"></p>
  `;
}

function buildWorkspaceShortcutMarkup(toolId, presets, history) {
  if (!PRESET_TOOL_IDS.has(toolId)) return '';

  const shortcuts = presets.slice(0, 2).map((entry) => `
    <button class="context-pill" type="button" data-apply-preset="${toolId}" data-entry-id="${entry.id}">
      ${escapeHtml(entry.name)}
    </button>
  `);

  if (history[0]) {
    shortcuts.push(`
      <button class="context-pill" type="button" data-apply-history="${toolId}" data-entry-id="${history[0].id}">
        Last setup
      </button>
    `);
  }

  if (!shortcuts.length) return '';

  return `
    <div class="panel-workspace-shortcuts" aria-label="Saved tool shortcuts">
      ${shortcuts.join('')}
    </div>
  `;
}

function initDelegatedUi() {
  document.addEventListener('click', async (event) => {
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (!target) return;

    const searchButton = target.closest('[data-search-tool]');
    if (searchButton) {
      activateTool(searchButton.dataset.searchTool, { scroll: true });
      closeToolSearch({ clear: true, blur: true });
      return;
    }

    const drawerButton = target.closest('[data-drawer-tool]');
    if (drawerButton) {
      activateTool(drawerButton.dataset.drawerTool, { scroll: true });
      return;
    }

    const chipButton = target.closest('[data-chip-tool]');
    if (chipButton) {
      activateTool(chipButton.dataset.chipTool, { scroll: true });
      return;
    }

    const favoriteButton = target.closest('[data-panel-favorite]');
    if (favoriteButton) {
      toggleFavorite(favoriteButton.dataset.panelFavorite);
      return;
    }

    const shareButton = target.closest('[data-panel-share]');
    if (shareButton) {
      await copyShareLink(shareButton.dataset.panelShare, shareButton);
      return;
    }

    const savePresetButton = target.closest('[data-panel-save-preset]');
    if (savePresetButton) {
      savePreset(savePresetButton.dataset.panelSavePreset, savePresetButton);
      return;
    }

    const applyPresetButton = target.closest('[data-apply-preset]');
    if (applyPresetButton) {
      const toolId = applyPresetButton.dataset.applyPreset;
      const entryId = applyPresetButton.dataset.entryId;
      const entry = (state.presets[toolId] || []).find((item) => item.id === entryId);
      if (entry) {
        applyToolSnapshot(toolId, entry.state);
        announceWorkspaceStatus(toolId, `Preset "${entry.name}" applied.`);
      }
      return;
    }

    const applyHistoryButton = target.closest('[data-apply-history]');
    if (applyHistoryButton) {
      const toolId = applyHistoryButton.dataset.applyHistory;
      const entryId = applyHistoryButton.dataset.entryId;
      const entry = (state.history[toolId] || []).find((item) => item.id === entryId);
      if (entry) {
        applyToolSnapshot(toolId, entry.state);
        announceWorkspaceStatus(toolId, 'Recent setup restored.');
      }
    }
  });
}

function initToolMenu() {
  $('[data-tool-menu-toggle]')?.addEventListener('click', () => {
    if (state.toolDrawerOpen) {
      closeToolDrawer();
    } else {
      openToolDrawer();
    }
  });

  document.addEventListener('click', (event) => {
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (!target?.closest('[data-tool-drawer-close]')) return;
    closeToolDrawer();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && state.toolDrawerOpen) {
      closeToolDrawer();
    }
  });
}

function openToolDrawer() {
  const drawer = $('#tool-drawer');
  if (!drawer) return;

  drawer.hidden = false;
  state.toolDrawerOpen = true;
  document.body.classList.add('tool-drawer-open');
  $('[data-tool-menu-toggle]')?.setAttribute('aria-expanded', 'true');
}

function closeToolDrawer() {
  const drawer = $('#tool-drawer');
  if (!drawer || !state.toolDrawerOpen) return;

  drawer.hidden = true;
  state.toolDrawerOpen = false;
  document.body.classList.remove('tool-drawer-open');
  $('[data-tool-menu-toggle]')?.setAttribute('aria-expanded', 'false');
}

function initRouting() {
  const applyRoute = () => {
    const route = getRouteState();
    if (route.viewMode === 'home') {
      setViewMode('home');
      if (window.location.hash === '#home') {
        $('#home')?.scrollIntoView({ block: 'start' });
      }
      return;
    }

    activateTool(route.toolId, { recordRecent: false, syncUrl: false });
    applyStateFromUrl(route.toolId);
  };

  window.addEventListener('hashchange', applyRoute);
  window.addEventListener('popstate', applyRoute);

  const route = getRouteState();
  if (route.viewMode === 'home') {
    setViewMode('home');
  } else {
    activateTool(route.toolId, { recordRecent: false, syncUrl: false });
    applyStateFromUrl(route.toolId);
  }
  scheduleUrlSync();
}

function getRouteState() {
  const params = new URLSearchParams(window.location.search);
  const queryTool = params.get('tool');
  if (TOOLS.some((tool) => tool.id === queryTool)) {
    return { viewMode: 'tool', toolId: queryTool };
  }

  const hashTool = window.location.hash.replace('#', '');
  if (TOOLS.some((tool) => tool.id === hashTool)) {
    return { viewMode: 'tool', toolId: hashTool };
  }

  return { viewMode: 'home', toolId: state.activeTool };
}

function applyStateFromUrl(toolId) {
  const adapter = TOOL_STATE_ADAPTERS[toolId];
  if (!adapter) return;

  const params = new URLSearchParams(window.location.search);
  const nextState = readAdapterStateFromParams(adapter, params);
  if (!Object.keys(nextState).length) return;

  state.isApplyingState = true;
  adapter.applyState(nextState);
  state.isApplyingState = false;
}

function scheduleUrlSync() {
  window.clearTimeout(state.urlSyncTimer);
  state.urlSyncTimer = window.setTimeout(syncUrlToState, 120);
}

function syncUrlToState() {
  const url = new URL(window.location.href);
  url.search = '';

  if (state.viewMode === 'home') {
    url.hash = 'home';
    history.replaceState(null, '', url);
    return;
  }

  url.searchParams.set('tool', state.activeTool);

  const adapter = TOOL_STATE_ADAPTERS[state.activeTool];
  if (adapter) {
    writeAdapterStateToParams(adapter, adapter.getState(), url.searchParams, adapter.autoSyncParams ?? adapter.params);
  }

  url.hash = state.activeTool;
  history.replaceState(null, '', url);
}

function toggleFavorite(toolId) {
  if (!toolId) return;

  if (state.favorites.has(toolId)) {
    state.favorites.delete(toolId);
  } else {
    state.favorites.add(toolId);
  }

  localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify([...state.favorites]));
  renderToolTabs();
  renderQuickCollections();
  renderPanelEnhancements();
  renderSearchResults($('#tool-search')?.value || '');
  announceWorkspaceStatus(toolId, state.favorites.has(toolId) ? 'Pinned to favorites.' : 'Removed from favorites.');
}

function updateRecentTools(toolId) {
  state.recentTools = [toolId, ...state.recentTools.filter((entry) => entry !== toolId)].slice(0, 6);
  localStorage.setItem(STORAGE_KEYS.recentTools, JSON.stringify(state.recentTools));
}

async function copyShareLink(toolId, button) {
  if (!toolId) return;

  const originalTool = state.activeTool;
  if (toolId !== state.activeTool) {
    activateTool(toolId, { recordRecent: false, syncUrl: false });
  }

  const url = buildShareUrl(toolId);

  try {
    await navigator.clipboard.writeText(url);
    flashButton(button, 'Copied');
    announceWorkspaceStatus(toolId, 'Share link copied.');
  } catch {
    flashButton(button, 'Clipboard off');
    announceWorkspaceStatus(toolId, 'Clipboard is unavailable here.');
  }

  if (toolId !== originalTool) {
    activateTool(originalTool, { recordRecent: false, syncUrl: false });
  } else {
    scheduleUrlSync();
  }
}

function buildShareUrl(toolId) {
  const url = new URL(window.location.href);
  url.search = '';
  url.searchParams.set('tool', toolId);

  const adapter = TOOL_STATE_ADAPTERS[toolId];
  if (adapter) {
    writeAdapterStateToParams(adapter, adapter.getState(), url.searchParams);
  }

  url.hash = toolId;
  return url.toString();
}

function savePreset(toolId, button) {
  if (!toolId || !PRESET_TOOL_IDS.has(toolId)) return;
  const adapter = TOOL_STATE_ADAPTERS[toolId];
  if (!adapter) return;

  const name = window.prompt('Preset name');
  if (!name) return;
  const trimmedName = name.trim();
  if (!trimmedName) return;

  const nextPreset = {
    id: createId(),
    name: trimmedName,
    state: adapter.getState(),
    createdAt: Date.now(),
  };

  state.presets[toolId] = [nextPreset, ...(state.presets[toolId] || [])].slice(0, 6);
  persistStoredJson(STORAGE_KEYS.presets, state.presets);
  renderPanelEnhancements();
  flashButton($(`[data-panel-save-preset="${toolId}"]`), 'Saved');
  announceWorkspaceStatus(toolId, `Saved preset "${trimmedName}".`);
}

function applyToolSnapshot(toolId, snapshot) {
  const adapter = TOOL_STATE_ADAPTERS[toolId];
  if (!adapter) return;

  activateTool(toolId, { scroll: true });
  state.isApplyingState = true;
  adapter.applyState(snapshot);
  state.isApplyingState = false;
  scheduleUrlSync();
  scheduleHistorySnapshot(toolId, true);
}

function scheduleHistorySnapshot(toolId, immediate = false) {
  const adapter = TOOL_STATE_ADAPTERS[toolId];
  if (!adapter) return;

  const saveSnapshot = () => {
    const nextState = adapter.getState();
    const signature = JSON.stringify(nextState);
    const previousEntries = state.history[toolId] || [];

    if (previousEntries[0]?.signature === signature) return;

    state.history[toolId] = [
      {
        id: createId(),
        label: adapter.summarize(nextState),
        signature,
        state: nextState,
        createdAt: Date.now(),
      },
      ...previousEntries.filter((entry) => entry.signature !== signature),
    ].slice(0, 6);

    persistStoredJson(STORAGE_KEYS.history, state.history);
    renderPanelEnhancements();
  };

  window.clearTimeout(state.historyTimers.get(toolId));
  if (immediate) {
    saveSnapshot();
    return;
  }

  const timer = window.setTimeout(saveSnapshot, 240);
  state.historyTimers.set(toolId, timer);
}

function initTimerAlerts() {
  const notifyToggle = $('#timer-notify');
  const startButton = $('#timer-start');

  notifyToggle?.addEventListener('change', async () => {
    if (!notifyToggle.checked || !('Notification' in window)) {
      syncTimerAlertStatus();
      return;
    }

    if (state.isApplyingState) {
      syncTimerAlertStatus();
      return;
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        notifyToggle.checked = false;
      }
    }

    syncTimerAlertStatus();
    scheduleUrlSync();
  });

  ['#timer-sound', '#timer-vibrate'].forEach((selector) => {
    $(selector)?.addEventListener('change', syncTimerAlertStatus);
  });

  startButton?.addEventListener('click', primeAlertAudio);
  window.addEventListener('aegis:timer-complete', handleTimerComplete);

  syncTimerAlertStatus();
}

function syncTimerAlertStatus() {
  const status = $('#timer-alert-status');
  const notify = $('#timer-notify')?.checked;
  const sound = $('#timer-sound')?.checked;
  const vibrate = $('#timer-vibrate')?.checked;

  if (!status) return;

  if (!notify && !sound && !vibrate) {
    status.textContent = 'No end-of-timer alerts are enabled.';
    return;
  }

  if (notify) {
    if (!('Notification' in window)) {
      status.textContent = 'Browser alerts are not supported here.';
      return;
    }
    if (Notification.permission === 'denied') {
      status.textContent = 'Browser alerts are blocked for this site.';
      return;
    }
    if (Notification.permission === 'default') {
      status.textContent = 'Browser alerts will ask for permission on first use.';
      return;
    }
  }

  status.textContent = 'Alerts stay on this device.';
}

async function handleTimerComplete() {
  const notify = $('#timer-notify')?.checked;
  const sound = $('#timer-sound')?.checked;
  const vibrate = $('#timer-vibrate')?.checked;

  if (sound) {
    await playAlertTone();
  }

  if (vibrate && navigator.vibrate) {
    navigator.vibrate([160, 120, 160]);
  }

  if (notify && 'Notification' in window && Notification.permission === 'granted') {
    new Notification('Aegis timer complete', {
      body: 'Your countdown has finished.',
      tag: 'aegis-timer-finished',
    });
  }
}

function primeAlertAudio() {
  if (!('AudioContext' in window || 'webkitAudioContext' in window)) return;
  if (!state.audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    state.audioContext = new AudioContextClass();
  }

  if (state.audioContext.state === 'suspended') {
    state.audioContext.resume().catch(() => {});
  }
}

async function playAlertTone() {
  primeAlertAudio();
  const context = state.audioContext;
  if (!context) return;

  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(784, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.16, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.36);
}

function readAdapterStateFromParams(adapter, params) {
  return Object.entries(adapter.params).reduce((accumulator, [key, param]) => {
    if (!params.has(param)) return accumulator;
    accumulator[key] = parseParamValue(params.get(param));
    return accumulator;
  }, {});
}

function writeAdapterStateToParams(adapter, toolState, params, paramMap = adapter.params) {
  Object.entries(paramMap).forEach(([key, param]) => {
    const value = toolState[key];
    if (value === undefined || value === null || value === '') return;
    params.set(param, String(value));
  });
}

function bindToolWatchers(selectors, callback) {
  selectors.forEach((selector) => {
    const element = $(selector);
    if (!element) return;
    element.addEventListener('input', callback);
    element.addEventListener('change', callback);
  });
}

function applyValueState(selector, value) {
  if (value === undefined || value === null) return;
  const element = $(selector);
  if (!element) return;
  element.value = String(value);
  dispatchFieldUpdate(element);
}

function applyCheckedState(selector, checked) {
  if (checked === undefined || checked === null) return;
  const element = $(selector);
  if (!element) return;
  element.checked = Boolean(checked);
  dispatchFieldUpdate(element);
}

function dispatchFieldUpdate(element) {
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

function flashButton(button, text) {
  if (!(button instanceof HTMLElement)) return;
  const original = button.textContent;
  button.textContent = text;
  window.setTimeout(() => {
    if (button.isConnected) button.textContent = original || '';
  }, 1500);
}

function announceWorkspaceStatus(toolId, message) {
  const node = $(`#workspace-status-${toolId}`);
  if (!node) return;

  node.textContent = message;
  window.clearTimeout(state.workspaceStatusTimers.get(toolId));
  const timer = window.setTimeout(() => {
    if (node.isConnected && node.textContent === message) {
      node.textContent = '';
    }
  }, 2200);
  state.workspaceStatusTimers.set(toolId, timer);
}

function formatDuration(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function summarizeText(value, maxLength) {
  const text = (value || '').trim().replace(/\s+/g, ' ');
  if (!text) return 'No text yet';
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function readStoredJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function persistStoredJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function parseParamValue(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);
  return value;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function setViewMode(mode) {
  state.viewMode = mode;
  document.documentElement.dataset.view = mode;
  document.body.dataset.view = mode;
}

function getTool(toolId) {
  return TOOLS.find((tool) => tool.id === toolId);
}

function createId() {
  return globalThis.crypto?.randomUUID?.() || `aegis-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function init() {
  initTheme();
  renderToolTabs();
  initToolModules();
  initToolMenu();
  initToolSearch();
  initToolStateSync();
  renderQuickCollections();
  renderPanelEnhancements();
  initDelegatedUi();
  initTimerAlerts();
  initRouting();
}

init();
