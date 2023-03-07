import path from 'path';
import chalk from 'chalk';


const NAME = 'sjs';

export const ROOT = path.dirname(path.dirname(import.meta.url.substr(7)))
export const RESOURCES_ROOT = path.join(ROOT, 'libs', '_res');

export const INTERNAL_MODULES = [
    `@odss/core`,
];

export const BUNDLES_DIR = 'packages';
export const PACKAGE_FILE = 'package.json';

export const PREFIX_MSG = chalk.green(`[${NAME}] `);
export const PREFIX_MSG_ERR = chalk.red(`[${NAME}][ERROR] `);
export const PREFIX_MSG_WARNING = chalk.yellow(`[${NAME}][WARN] `);
export const PREFIX_MSG_SUCCESS = chalk.cyan(`[${NAME}] `);

export const ERROR_EXIT = 1;
export const SUCCESS_EXIT = 0;
