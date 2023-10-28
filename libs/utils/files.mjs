import Path from 'path';
import { opendir, readFile, access, constants } from 'node:fs/promises';

export function join(...parts) {
    return parts.join(Path.sep);
}

export const exists = async (path) => {
    try {
        await access(path, constants.R_OK);
        return true;
    } catch(err) {
    }
    return false;
}

export async function readJsonFile(filePath) {
    const content = await readFile(filePath, 'utf8',);
    return JSON.parse(content);
}

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