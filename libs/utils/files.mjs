import Fs from 'fs';
import Path from 'path';
import Util from 'util';
import rmdir_ from 'rmdir';
import { opendir, readFile } from 'node:fs/promises';


export function join(...parts) {
    return parts.join(Path.sep);
}

export async function readJsonFile(filePath) {
    const content = await readFile(filePath, 'utf8',);
    return JSON.parse(content);
}

export const writeFile = Util.promisify(Fs.writeFile);
export const copyFile = Util.promisify(Fs.copyFile);
export const unlink = Fs.unlink;

export const readdir = Util.promisify(Fs.readdir);
export const mkdir = Util.promisify(Fs.mkdir);
export const rmdir = Util.promisify(rmdir_);
export const stat = Util.promisify(Fs.stat);
export const exists = Util.promisify(Fs.exists);

const walkOptions = {
    deepFilter() {
        return true;
    },
    entryFilter() {
        return true;
    }
};

// make it parallel
export async function* walk(paths, options) {
    const { deepFilter, entryFilter } = { ...walkOptions, ...options };
    const buff = [...paths];
    const visited = [];
    while (buff.length) {
        const path = buff.pop();
        const dir = await opendir(path);
        for await (const dirent of dir) {
            if (entryFilter(dirent)) {
                yield Path.join(path, dirent.name);
            }
            if (dirent.isDirectory() && !dirent.name.startsWith('.')) {
                if (deepFilter(dirent)) {
                    const pathToVisit = Path.join(path, dirent.name);
                    if (!visited.includes(pathToVisit)) {
                        buff.push(pathToVisit);
                        visited.push(pathToVisit);
                    }
                }
            }
        }
    }
}