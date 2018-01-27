
(async () => {
    const runner = await System.import('odss-bootstrap')
    runner.boot({
        bundles: [
            'odss.cdi',
            'atto.core.io',
            'atto.core.main',
            'atto.core.auth',
            "atto.core.ui",
            // "atto.ui.login",
            // "atto.ui.main"
        ],
        properties: {
            'http.url': ''
        }
    });
})();
