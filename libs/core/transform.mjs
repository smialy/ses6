
import { rollup } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';

import { createModulesResolver } from './resolvers.mjs';

export default function rollupTransformer(modules, options) {
    return async name => {
        const { format, path, compress } = options;
        const modern = true;
        const bundleRollup = await rollup({
            input: name,
            plugins: [
                createModulesResolver(modules),
                nodeResolve(),
                replace({
                    values: {
                        'process.env.NODE_ENV': JSON.stringify('production'),
                        __buildDate__: () => JSON.stringify(new Date()),
                        __buildVersion: '1.0.0',
                    },
                    preventAssignment: true,
                }),
                compress ? terser({
                    compress: {
                        keep_classnames: true,
                        keep_infinity: true,
                        pure_getters: true,
                    },
                    format: {
                        comments: /^ Generated at: .+?$/,
                        preserve_annotations: true,
                        wrap_func_args: false,

                    },
                    module: modern,
                    keep_fnames: true,
                    ecma: modern ? 2017 : 5,
                }) : null,
                // classApiPlugin({
                //     include: '/**/*.js'
                // }),
            ].filter(Boolean)
        });
        let { output } = await bundleRollup.generate({
            name,
            paths(id) {
                const type = typeof path;
                if (type === 'string') {
                    return `${path}${id}`;
                } else if (type === 'function') {
                    const module  = modules.findById(id);
                    if (module) {
                        return path(module);
                    }
                }
                return id;
            },
            format,
        });
        return output[0];
    }
}
