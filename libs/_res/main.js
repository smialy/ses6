
(async () => {
    const runner = await System.import('odss-bootstrap')
    runner.boot({
        bundles: [
            'odss.cdi',
            "odss.shell",
            "odss.dev.ui.core",
            "odss.dev.ui.terminal",
            'atto.core.main',
            'atto.core.io',
            'atto.core.auth',
            "atto.ui.core",
            "atto.ui.main",
            // "atto.ui.login",
        ],
        properties: {
            'http.url': ''
        }
    });
})();
