
(async () => {
  const url = await System.resolve('@odss/bootstrap');
  const runner = await System.import(url);
  runner.boot({
    bundles: [
      '@odss/cdi.main',
      '@odss/shell',
      '@odss/dev.ui.core',
      '@odss/dev.ui.terminal',
      'atto.core.main',
      'atto.core.io',
      'atto.core.auth',
      'atto.ui.core',
      'atto.ui.main',
      'atto.apps.menu',
      // "atto.ui.login",
    ],
    properties: {
      'http.url': '',
      'loader.path': '/_dev/modules/',
    },
  });
})();
