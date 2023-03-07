import { boot } from '/-/package/@odss/core';
(async function() {
    const res = await fetch('/-/config.json');
    const { resolverPrefix, properties, bundles } = await res.json();
    await boot({
        properties: {
            ...properties,
            loader: {
                resolver: id => `${resolverPrefix}${id}`,
            }
        },
        bundles,
    });
})();

window.addEventListener('visibilitychange', () => {
    if(!document.hidden && shouldReload) {
        shouldReload = false;
        console.log('Reload app');
        location.reload();
    }
});
let shouldReload = false;
const ws = new WebSocket(`ws://${location.host}/`);
ws.addEventListener('open', () => console.log('Connection to dev server is ready'));
ws.addEventListener('close', () => console.log('Connection to dev server is closed'));
ws.addEventListener('message', ({ data = "{}" }) => {
    try {
        const { cmd } = JSON.parse(data);
        if (cmd === 'update') {
            if (document.hidden) {
                shouldReload = true;
            } else {
                console.log('Reload app');
                location.reload();
            }
        }
    } catch(err) {
        console.error(err);
    }
});