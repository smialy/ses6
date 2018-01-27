import Fs from 'fs';
import Path from 'path';
import Util from 'util';


export function join(...parts){
    return parts.join(Path.sep);
}

export async function readJson(path){
    const data = await read(path);
    return JSON.parse(data);
}

export const read = Util.promisify(Fs.readFile);
export const stat = Util.promisify(Fs.stat);
export const exists = Util.promisify(Fs.exists);