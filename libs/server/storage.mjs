import path from 'path';
import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises';
import { exists } from '../utils/files.mjs';

export class FileStorage {

    constructor(root) {
        this.root = root;
    }
    async checkRoot() {
        if (!await exists(this.root)) {
            await mkdir(this.root)
        }
    }
    async has(key) {
        return exists(path.join(this.root, `${key}.json`));
    }
    async write(key, data) {
        await this.checkRoot();
        const payload = JSON.stringify(data);
        const filePath = path.join(this.root, `${key}.json`);
        await writeFile(filePath, payload);
    }
    async read(key) {
        await this.checkRoot();
        const filePath = path.join(this.root, `${key}.json`);
        const fexists = await exists(filePath);
        if (fexists) {
            const payload = await readFile(filePath);
            return JSON.parse(payload);
        }
    }
    async remove(key) {
        await unlink(path.join(this.root, `${key}.json`));
    }
}