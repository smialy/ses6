import commander from 'commander';
import path from 'path';

import * as ui from './ui';
import * as consts from './consts';
import pkg from '../package.json';
import api from './api';
import {setupExceptionHandler} from './utils';

export default function run(argv){
    setupExceptionHandler();
    commander.parse(argv);
    if (argv.length == 2) {
      commander.outputHelp();
    }
}

commander.version(pkg.version)
    .option('-hs --https', 'Replace git by https')
    .usage('[cmd]');


commander.on('--help', function() {
    ui.log(`
        Basic Examples:

        $ sosgi start

    `);
});

commander.command('init [dir]')
    .description('init workspace')
    .action(dir => {
        ui.log(consts.PREFIX_MSG + 'Init workspace');
        api.init({
            dir
        });
    });

commander.command('server [dir]')
    .description('start development server')
    .option('-h --host <host>', 'server host')
    .option('-p --port <port>', 'server port')
    .action((dir, options) => {
        let port = options.port || 8000;
        let host = options.host || 'localhost';

        ui.log(consts.PREFIX_MSG + `Start dev server: http://${host}:${port}/`);
        api.server({
            dir,
            host,
            port
        });
    });


commander.command('install [location...]')
    .description('install bundles')
    .option('-e --edit', 'edit, git protocol')
    .action((locations, options) => {
        ui.log(consts.PREFIX_MSG + 'install bundles');
        api.install({
            edit: !!options.edit,
            locations
        }).catch(err => ui.error(err));
    });

commander.command('*')
    .action(() => {
        ui.log(consts.PREFIX_MSG + '\nCommand not found');
        commander.outputHelp();
        process.exit(consts.ERROR_EXIT);
    });
