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

commander.command('init')
    .description('init workspace')
    .action(() => {
        ui.log(consts.PREFIX_MSG + 'Init workspace');
        api.init();
    });

commander.command('server [dir]')
    .description('start development server')
    .action((dir) => {
        ui.log(consts.PREFIX_MSG + 'Start dev server');
        api.server(dir && path.resolve(dir) || process.cwd());
    });


commander.command('install [location...]')
    .description('install bundles')
    .action((locations) => {
        ui.log(consts.PREFIX_MSG + 'install bundles');
        api.install(locations);
    });

commander.command('*')
    .action(() => {
        ui.log(consts.PREFIX_MSG + '\nCommand not found');
        commander.outputHelp();
        process.exit(consts.ERROR_EXIT);
    });
