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
  case: 'Case',
  counter: 'Counter',
  qr: 'QR',
  speed: 'Speed Test',
  timezone: 'Timezones',
  timer: 'Timer',
  random: 'Random',
  converter: 'Units',
};

const PRESET_TOOL_IDS = new Set(['password', 'qr', 'timezone', 'timer', 'random', 'converter']);
const PRIMARY_TOOLS = TOOLS.filter((tool) => tool.primary !== false);

const state = {
  activeTool: TOOLS[0].id,
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
};

const TOOL_STATE_ADAPTERS = {
  password: {
    params: {
      length: 'pw_len',
      lowercase: 'pw_low',
      uppercase: 'pw_up',
      numbers: 'pw_num',
      symbols: 'pw_sym',
    },
    getState: () => ({
      length: Number($('#password-length')?.value || 18),
      lowercase: $('#password-lowercase')?.checked ?? true,
      uppercase: $('#password-uppercase')?.checked ?? true,
      numbers: $('#password-numbers')?.checked ?? true,
      symbols: $('#password-symbols')?.checked ?? true,
    }),
    applyState: (toolState) => {
      applyCheckedState('#password-lowercase', toolState.lowercase);
      applyCheckedState('#password-uppercase', toolState.uppercase);
      applyCheckedState('#password-numbers', toolState.numbers);
      applyCheckedState('#password-symbols', toolState.symbols);
      applyValueState('#password-length', toolState.length);
    },
    watch: (callback) => {
      bindToolWatchers(
        ['#password-length', '#password-lowercase', '#password-uppercase', '#password-numbers', '#password-symbols'],
        callback,
      );
    },
    summarize: (toolState) => {
      const enabled = [
        toolState.lowercase && 'abc',
        toolState.uppercase && 'ABC',
        toolState.numbers && '123',
        toolState.symbols && '#$!',
      ]
        .filter(Boolean)
        .join(' ');
      return `${toolState.length || 18} chars${enabled ? ` · ${enabled}` : ''}`;
    },
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
  qr: {
    params: {
      text: 'qr_text',
    },
    autoSyncParams: {},
    getState: () => ({
      text: $('#qr-input')?.value || '',
    }),
    applyState: (toolState) => {
      applyValueState('#qr-input', toolState.text);
    },
    watch: (callback) => {
      bindToolWatchers(['#qr-input'], callback);
    },
    summarize: (toolState) => summarizeText(toolState.text, 40),
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
      unique: 'rand_unique',
    },
    getState: () => ({
      min: Number($('#random-min')?.value || 1),
      max: Number($('#random-max')?.value || 100),
      count: Number($('#random-count')?.value || 1),
      unique: $('#random-unique')?.checked ?? false,
    }),
    applyState: (toolState) => {
      applyValueState('#random-min', toolState.min);
      applyValueState('#random-max', toolState.max);
      applyValueState('#random-count', toolState.count);
      applyCheckedState('#random-unique', toolState.unique);
      $('#random-generate')?.click();
    },
    watch: (callback) => {
      bindToolWatchers(['#random-min', '#random-max', '#random-count', '#random-unique'], callback);
    },
    summarize: (toolState) => {
      const quantity = toolState.count > 1 ? `${toolState.count} values` : '1 value';
      const unique = toolState.unique ? ' · unique' : '';
      return `${quantity}${unique} · ${toolState.min} to ${toolState.max}`;
    },
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
  if (!tabs) return;
  const tabTools = getVisibleNavTools();

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

  if (!tabs.dataset.bound) {
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
    const workspace = existingWorkspace || document.createElement('details');
    const wasOpen = existingWorkspace?.open ?? false;

    workspace.className = 'panel-workspace';
    workspace.dataset.panelWorkspace = toolId;
    workspace.open = wasOpen;
    workspace.innerHTML = buildPanelWorkspaceMarkup(toolId);

    if (!existingWorkspace) {
      header.insertAdjacentElement('afterend', workspace);
    }
  });
}

function buildPanelWorkspaceMarkup(toolId) {
  const presets = state.presets[toolId] || [];
  const history = state.history[toolId] || [];
  const summary = PRESET_TOOL_IDS.has(toolId)
    ? `${presets.length} preset${presets.length === 1 ? '' : 's'} · ${history.length} recent`
    : state.favorites.has(toolId)
      ? 'Pinned for quick access'
      : 'Actions and share links';

  return `
    <summary class="panel-workspace-summary">
      <span class="panel-workspace-heading">Workspace</span>
      <span class="panel-workspace-meta">${escapeHtml(summary)}</span>
    </summary>
    <div class="panel-workspace-body">
      <div class="panel-utilities">
        <button class="panel-action" type="button" data-panel-favorite="${toolId}" aria-pressed="${state.favorites.has(toolId)}">${state.favorites.has(toolId) ? 'Pinned' : 'Pin to favorites'}</button>
        <button class="panel-action" type="button" data-panel-share="${toolId}">Copy share link</button>
        ${PRESET_TOOL_IDS.has(toolId)
          ? `<button class="panel-action" type="button" data-panel-save-preset="${toolId}">Save preset</button>`
          : ''}
      </div>
      <p class="workspace-status" id="workspace-status-${toolId}" aria-live="polite"></p>
      ${PRESET_TOOL_IDS.has(toolId)
        ? buildToolContextMarkup(toolId)
        : '<p class="context-empty">Pin this tool or copy a share link when you want to return to the same setup later.</p>'}
    </div>
  `;
}

function buildToolContextMarkup(toolId) {
  const presets = state.presets[toolId] || [];
  const history = state.history[toolId] || [];

  return `
    <div class="context-group">
      <div class="context-meta">
        <span class="context-label">Saved presets</span>
        <span class="context-count">${presets.length}</span>
      </div>
      <div class="context-pill-row">
        ${presets.length
          ? presets
              .map(
                (entry) => `
                  <button class="context-pill" type="button" data-apply-preset="${toolId}" data-entry-id="${entry.id}">
                    ${escapeHtml(entry.name)}
                  </button>
                `,
              )
              .join('')
          : '<p class="context-empty">No presets yet. Save a repeatable setup once you have one.</p>'}
      </div>
    </div>
    <div class="context-group">
      <div class="context-meta">
        <span class="context-label">Recent states</span>
        <span class="context-count">${history.length}</span>
      </div>
      <div class="context-pill-row">
        ${history.length
          ? history
              .map(
                (entry) => `
                  <button class="context-pill" type="button" data-apply-history="${toolId}" data-entry-id="${entry.id}">
                    ${escapeHtml(entry.label)}
                  </button>
                `,
              )
              .join('')
          : '<p class="context-empty">Aegis will remember recent setups here after you adjust this tool.</p>'}
      </div>
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

function initRouting() {
  const applyRoute = () => {
    const nextTool = getRouteTool();
    activateTool(nextTool, { recordRecent: false, syncUrl: false });
    applyStateFromUrl(nextTool);
  };

  window.addEventListener('hashchange', applyRoute);
  window.addEventListener('popstate', applyRoute);

  activateTool(getRouteTool(), { recordRecent: false, syncUrl: false });
  applyStateFromUrl(state.activeTool);
  scheduleUrlSync();
}

function getRouteTool() {
  const params = new URLSearchParams(window.location.search);
  const queryTool = params.get('tool');
  if (TOOLS.some((tool) => tool.id === queryTool)) return queryTool;

  const hashTool = window.location.hash.replace('#', '');
  if (TOOLS.some((tool) => tool.id === hashTool)) return hashTool;

  return state.activeTool;
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
  initToolSearch();
  initToolStateSync();
  renderQuickCollections();
  renderPanelEnhancements();
  initDelegatedUi();
  initTimerAlerts();
  initRouting();
}

init();
