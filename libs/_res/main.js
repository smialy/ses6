
(async () => {
    const runner = await System.import('odss-bootstrap')
    runner.boot({
        bundles: [
            'odss.cdi',
            'odss.cdi.test',
            'odss.shell', 
            'odss.dev.ui.core',
            'odss.dev.ui.terminal'
        ]
    });
})();
