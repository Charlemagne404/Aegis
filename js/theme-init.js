(() => {
  try {
    const savedTheme = localStorage.getItem('aegis-theme');
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    document.documentElement.dataset.theme = savedTheme || (prefersLight ? 'light' : 'dark');
  } catch {
    document.documentElement.dataset.theme = 'dark';
  }
})();
