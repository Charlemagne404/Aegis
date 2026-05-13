(() => {
  try {
    const savedTheme = localStorage.getItem('aegis-theme');
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    document.documentElement.dataset.theme = savedTheme || (prefersLight ? 'light' : 'dark');
  } catch {
    document.documentElement.dataset.theme = 'dark';
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const requestedTool = params.get('tool') || window.location.hash.replace('#', '');
    document.documentElement.dataset.view = requestedTool ? 'tool' : 'home';
  } catch {
    document.documentElement.dataset.view = 'home';
  }
})();
