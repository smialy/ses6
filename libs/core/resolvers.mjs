import FS from 'fs';
import Util from 'util';

const statFile = Util.promisify(FS.stat);

export function createModulesResolver(modules) {
    const isRelative = path => path[0] === '.' && path[1] === '/';
    return {
        name: 'modules-resolve',
        async resolveId( id, importer, options ) {
            if ( /\0/.test( id ) ) return null;

            console.log({ id, importer })
            // const resolution = await this.resolve(id, importer, { skipSelf: true, ...options });
            if (isRelative(id) && importer) {
                return null;
            }
            if (id[0] === '/') {
                return id;
            }
            const module = await modules.findById(id);
            if (importer) {
                if (!module) {
                    const importerModule = modules.findByPath(importer);
                    const refs = await importerModule.resolve(id);
                    for (const ref of refs) {
                        modules.addModule(ref);
                    }
                }
                return {
                    id,
                    external: true,
                };
            }
            if (module) {
                return module.getMainFile();
            }
        },
        async load(id) {
            try {
                await statFile(id);
            } catch (e) {
                console.warn(`Problem with load: ${id}. I will try to build it`);
                try {
                    const module = modules.findById(id) || modules.findByPath(id);
                    if (module) {
                        await modules.runner.build(module);
                    } else {
                        console.warn(`Not found module for ${id}`);
                    }
                }catch(err) {
                    console.log({ err });
                }
            }
        }
    };
}
