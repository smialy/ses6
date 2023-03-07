import Path from 'path';

import transformer from './transform.mjs';
import * as files from '../utils/files.mjs';
import { RESOURCES_ROOT } from '../consts.mjs';

export default async function build({ options, root, modules }) {
    const toTransform = modules.getModules();
    const { path, format } = options;
    const writer = CodeWriterFactory.create(format, {
        path: root,
    });

    const getPath = module => {
        return Path.join(path, module.id, module.file);
    };
    options.path = getPath;

    const imported = new Set();
    const transform = transformer(modules, options);
    while(toTransform.length) {
        const module = toTransform.shift();
        if (['@sui/themes', '@odss/shell'].includes(module.id)) {
            continue;
        }
        const { code, imports } = await transform(module.id);
        for (const import_ of imports) {
            if (!imported.has(import_)) {
                imported.add(import_);
                // toTransform.push([import_, '0.0.0']);
            }
        }
        await writer.add(getPath(module), code);
    }
    await writer.finish();
}

class CodeWriterFactory {
    static create(format, options) {
        switch (format) {
            case 'system': return new SystemCodeWriter(options);
            case 'esm': return new EsmCodeWriter(options);
        }
        throw new TypeError(`Unknown format: ${format}`);
    }
}

class CodeWriter {
    async begin() { }
    async add(name, code) { }
    async finish() { }
}

class FileCodeWriter extends CodeWriter {
    constructor({ path }) {
        super();
        this.path = path;
    }
    async begin() {
        if (await files.exists(this.path)) {
            await files.rmdir(this.path);
        }
        await files.mkdir(this.path, { recursive: true });
    }
    async writeFile(name, content) {
        const filePath = Path.join(this.path, name);
        const dirPath = Path.dirname(filePath);
        await files.mkdir(dirPath, { recursive: true });
        await files.writeFile(filePath, content);
    }
}

class SystemCodeWriter extends FileCodeWriter {
    constructor(path) {
        super(path);
        this.buff = [];
    }
    async begin() {
        super.begin();
        await files.copyFile(
            Path.join(RESOURCES_ROOT, 'system', 's.js'),
            Path.join(this.path, 'system.js')
        );
        await files.copyFile(
            Path.join(RESOURCES_ROOT, 'system', 'named-register.js'),
            Path.join(this.path, 'named-register.js')
        );
    }
    async add(name, code) {
        if (name.endsWith('.html')) {
            await this.writeFile(name, code);
        } else {
            this.buff.push(code);
        }
    }

    async finish() {
        const content = this.buff.join('\n');
        await this.writeFile('main.js', content);
    }
}

class EsmCodeWriter extends FileCodeWriter {
    async add(name, code) {
        await this.writeFile(name, code);
    }
}