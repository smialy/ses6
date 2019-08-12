import Fs from 'fs';
import Path from 'path';
import Util from 'util';


export function join(...parts){
    return parts.join(Path.sep);
}

export async function readJson(path){
    const data = await readFile(path);
    return JSON.parse(data);
}

export const readFile = Util.promisify(Fs.readFile);
export const readDir = Util.promisify(Fs.readdir);
export const stat = Util.promisify(Fs.stat);
export const exists = Util.promisify(Fs.exists);