System.import('odss-bootstrap').then(runner =>{
    runner({
        bundles: [
            'odss.shell', 
            'odss.dev.ui.core',
            'odss.dev.ui.terminal'
        ]
    });
});
