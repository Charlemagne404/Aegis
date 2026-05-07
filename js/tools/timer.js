import { $, $$, clamp, formatDuration, safeText } from './shared.js';

export function initTimerTool() {
  const timerDisplay = $('#timer-display');
  const timerStatus = $('#timer-status');
  const timerStart = $('#timer-start');
  const timerPause = $('#timer-pause');
  const timerReset = $('#timer-reset');
  const addMinuteButton = $('#timer-add-minute');
  const hoursInput = $('#timer-hours');
  const minutesInput = $('#timer-minutes');
  const secondsInput = $('#timer-seconds');
  const presetButtons = $$('[data-timer-preset]');
  let timerRemaining = readDuration();
  let timerEnd = 0;
  let timerFrame = null;
  let isTimerRunning = false;

  const updateTimerDisplay = () => {
    safeText(timerDisplay, formatDuration(timerRemaining));
  };

  const setTimerStatus = (status) => safeText(timerStatus, status);

  const tickTimer = () => {
    if (!isTimerRunning) return;
    timerRemaining = Math.max(0, timerEnd - Date.now());
    updateTimerDisplay();

    if (timerRemaining <= 0) {
      isTimerRunning = false;
      window.clearInterval(timerFrame);
      setTimerStatus('Done');
      safeText(timerStart, 'Start');
      window.dispatchEvent(new CustomEvent('aegis:timer-complete'));
      return;
    }
  };

  const syncDuration = () => {
    if (!isTimerRunning) {
      timerRemaining = readDuration();
      updateTimerDisplay();
    }
  };

  const writeDuration = (milliseconds) => {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hoursInput) hoursInput.value = String(hours);
    if (minutesInput) minutesInput.value = String(minutes);
    if (secondsInput) secondsInput.value = String(seconds);
  };

  [hoursInput, minutesInput, secondsInput].forEach((input) => input?.addEventListener('input', syncDuration));
  presetButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const seconds = Number(button.dataset.timerPreset || 0);
      writeDuration(seconds * 1000);
      syncDuration();
      setTimerStatus('Preset loaded');
    });
  });
  addMinuteButton?.addEventListener('click', () => {
    if (isTimerRunning) {
      timerRemaining += 60000;
      timerEnd += 60000;
      updateTimerDisplay();
      setTimerStatus('Extended by 1 minute');
      return;
    }

    writeDuration(readDuration() + 60000);
    syncDuration();
    setTimerStatus('Added 1 minute');
  });

  timerStart?.addEventListener('click', () => {
    if (isTimerRunning) return;
    if (timerRemaining <= 0) timerRemaining = readDuration();
    if (timerRemaining <= 0) {
      setTimerStatus('Set a duration');
      return;
    }

    timerEnd = Date.now() + timerRemaining;
    isTimerRunning = true;
    setTimerStatus('Running');
    safeText(timerStart, 'Resume');
    window.clearInterval(timerFrame);
    timerFrame = window.setInterval(tickTimer, 100);
    tickTimer();
  });

  timerPause?.addEventListener('click', () => {
    if (!isTimerRunning) return;
    isTimerRunning = false;
    window.clearInterval(timerFrame);
    timerRemaining = Math.max(0, timerEnd - Date.now());
    setTimerStatus('Paused');
    updateTimerDisplay();
  });

  timerReset?.addEventListener('click', () => {
    isTimerRunning = false;
    window.clearInterval(timerFrame);
    timerRemaining = readDuration();
    setTimerStatus('Idle');
    safeText(timerStart, 'Start');
    updateTimerDisplay();
  });

  function readDuration() {
    const hours = clamp(Number(hoursInput?.value || 0), 0, 99);
    const minutes = clamp(Number(minutesInput?.value || 0), 0, 59);
    const seconds = clamp(Number(secondsInput?.value || 0), 0, 59);
    return ((hours * 3600) + (minutes * 60) + seconds) * 1000;
  }

  updateTimerDisplay();
  initStopwatch();
}

function initStopwatch() {
  const display = $('#stopwatch-display');
  const status = $('#stopwatch-status');
  const startButton = $('#stopwatch-start');
  const lapButton = $('#stopwatch-lap');
  const resetButton = $('#stopwatch-reset');
  const lapList = $('#lap-list');
  let running = false;
  let startedAt = 0;
  let elapsed = 0;
  let frame = null;

  const currentElapsed = () => (running ? elapsed + (Date.now() - startedAt) : elapsed);

  const render = () => {
    safeText(display, formatDuration(currentElapsed(), true));
  };

  const loop = () => {
    render();
    if (running) frame = window.requestAnimationFrame(loop);
  };

  startButton?.addEventListener('click', () => {
    if (running) {
      elapsed = currentElapsed();
      running = false;
      window.cancelAnimationFrame(frame);
      safeText(startButton, 'Start');
      safeText(status, 'Paused');
      render();
      return;
    }

    running = true;
    startedAt = Date.now();
    safeText(startButton, 'Pause');
    safeText(status, 'Running');
    loop();
  });

  lapButton?.addEventListener('click', () => {
    const lapTime = currentElapsed();
    if (!lapList || lapTime <= 0) return;
    const item = document.createElement('li');
    const lapNumber = lapList.children.length + 1;
    item.innerHTML = `<span>Lap ${lapNumber}</span><strong>${formatDuration(lapTime, true)}</strong>`;
    lapList.prepend(item);
  });

  resetButton?.addEventListener('click', () => {
    running = false;
    elapsed = 0;
    startedAt = 0;
    window.cancelAnimationFrame(frame);
    safeText(startButton, 'Start');
    safeText(status, 'Idle');
    if (lapList) lapList.innerHTML = '';
    render();
  });

  render();
}
