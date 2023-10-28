import { boot } from '@odss/core';

const DEFAULT_BUNDLES = [
    "@odss/shell.core",
    "@odss/terminal",
    '@odss/dev',
];

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
        bundles: [...DEFAULT_BUNDLES, ...bundles],
    });
})();

