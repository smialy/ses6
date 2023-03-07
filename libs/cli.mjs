import Path from 'path';
import { program } from 'commander';
import deepmerge from 'deepmerge';

import { Modules } from './core/modules.mjs';
import build from './core/build.mjs';
import server from './server/index.mjs';
import * as ui from './ui.mjs';
import * as consts from './consts.mjs';
import { setupExceptionHandler } from './utils/errors.mjs';
import { readJsonFile } from './utils/files.mjs';

export function run(argv) {
    setupExceptionHandler();
    program.parse(argv);
    if (argv.length == 2) {
        program.outputHelp();
    }
}

program.on('--help', function() {
    ui.log(`
        Basic Examples:

        $ sbundle server

    `);
});

program.command('server [dirs...]')
    .description('start development server')
    .option('--cwd <cwd>', 'CWD', process.cwd())
    .option('--compress', 'compress files')
    .option('-h, --host <host>', 'server host', 'localhost')
    .option('-p, --port <port>', 'server port', 8765)
    .option('-b, --bootstrap', 'run packages bootstrap')
    .option('-x, --proxy <url>', 'proxy url')
    .option('-w, --watch', 'build watch')
    .option('-c, --config <path>', 'path to config')
    .option('--cache', 'enable cache to generated files')

    .action(async (dirs, options) => {
        API.server({ dirs, ...options });
        // ui.log(consts.PREFIX_MSG + `Start dev server: http://${host}:${port}/`);
    });

program.command('build [dirs...]')
    .description('build app')
    .option('--cwd <cwd>', 'CWD', process.cwd())
    .option('--compress', 'compress files', false)
    .option('-p, --path <path>', 'url path', 'dist/ajax/libs/')
    .option('-c, --config <path>', 'path to config', '')
    .option('-f, --format <format>', 'bundle format [esm, system]', 'esm')
    .action((dirs, options) =>
        API.build({
            dirs,
            ...options,
        })
    );

program.command('*')
    .action(() => {
        ui.log(consts.PREFIX_MSG + '\nCommand not found');
        program.outputHelp();
        process.exit(consts.ERROR_EXIT);
    });

const API = {
    async server(options) {
        await server(await init(options));
    },
    async build(options) {
        await build(await init(options));
    },
};

async function init(options) {
    let root = options.cwd;
    if (options.config) {
        root = Path.dirname(Path.resolve(options.config));
        const fileConfig = await readJsonFile(options.config);
        options = deepmerge.all([{ bundles: [], properties: [] }, fileConfig, options]);
    } else {
        options = deepmerge.all([{ bundles: [], properties: [] }, options]);
    }
    const dirs = options.dirs.map(dir => Path.resolve(root, dir));
    const modules = new Modules([root, ...dirs]);
    await modules.load();
    return { modules, root, options };
}

run(process.argv);
