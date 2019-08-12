import commander from 'commander';

import * as ui from './ui';
import * as consts from './consts';
import pkg from '../package.json';
import api from './api';
import { setupExceptionHandler } from './utils';


export default function run(argv){
    setupExceptionHandler();
    commander.parse(argv);
    if (argv.length == 2) {
      commander.outputHelp();
    }
}

commander.version(pkg.version)
    // .option('-hs --https', 'Replace git by https')
    .usage('[cmd]');


commander.on('--help', function() {
    ui.log(`
        Basic Examples:

        $ sosgi start

    `);
});

commander.command('server [dirs...]')
    .description('start development server')
    .option('-h, --host <host>', 'server host', 'localhost')
    .option('-p, --port <port>', 'server port', 8000)
    .option('-b, --bootstrap', 'run packages bootstrap', false)
    .option('-x, --proxy <url>', 'proxy url', false)
    .action((dirs, { host, port, proxy, bootstrap }) => {
        if (proxy) {
            ui.log(consts.PREFIX_MSG + `Start proxy to: ${proxy}`)
        }
        api.server({ host, port, dirs, proxy, bootstrap });
        ui.log(consts.PREFIX_MSG + `Start dev server: http://${host}:${port}/`);
    });

commander.command('build [dirs...]')
    .description('build app')
    .action(dirs =>
        api.build({
            dirs,
        })
    );


commander.command('*')
    .action(() => {
        ui.log(consts.PREFIX_MSG + '\nCommand not found');
        commander.outputHelp();
        process.exit(consts.ERROR_EXIT);
    });
