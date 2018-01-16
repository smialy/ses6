import path from 'path';
import chalk from 'chalk';

export const ROOT = path.dirname(path.dirname(import.meta.url.substr(7)))

export const RESOURCES_ROOT = path.join(ROOT, 'libs', '_res');
console.log(RESOURCES_ROOT)
let SOSGI_ROOT_PATH = '';
if (process.env.SOSGI_HOME){
    SOSGI_ROOT_PATH = process.env.SOSGI_HOME;
}


const NAME = 'sOSGi';
export const SOSGI_DIR = '.sosgi';
export const BUNDLES_DIR = 'packages';
export const PACKAGE_FILE = 'package.json';


export const PREFIX_MSG = chalk.green(`[${NAME}] `);
export const PREFIX_MSG_ERR = chalk.red(`[${NAME}][ERROR] `);
export const PREFIX_MSG_WARNING = chalk.yellow(`[${NAME}][WARN] `);
export const PREFIX_MSG_SUCCESS = chalk.cyan(`[${NAME}] `);

export const ERROR_EXIT = 1;
export const SUCCESS_EXIT = 0;

export const SYSTEMJS_GIT = 'https://github.com/systemjs/systemjs.git';
export const SYSTEMJS_LOADER_GIT = 'https://github.com/ModuleLoader/es6-module-loader.git';
