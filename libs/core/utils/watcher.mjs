import chokidar from 'chokidar';

import { Events } from '../utils/events';

export const FileChangeEvent = {
	UPDATED: 'update',
	ADDED: 'added',
	REMOVED: 'removed',
};

const IGNORED = [/\/node_modules\//, /\/.git\//, /\/.history\//];

export class WatcherService {
    constructor() {
        this._watchers = new Map();
    }
    setRoots(paths) {
        this.close();
        for(const path of paths) {
            this._watch(path);
        }
    }
    _watch(path) {
        if (this._watchers.has(path)) {
            console.warn(`Path: ${path} already has fs watcher`);
            this._watchers.get(path).close();

        }
        // console.log(`Watch: ${path}`);
        const watcher = chokidar.watch(path, {
            ignored: IGNORED,
        });
        watcher.on('all', (type, path) => {
            let name = '';
            switch (type) {
                case 'change':
                    name = FileChangeEvent.UPDATED;
                    break;
                case 'add':
                case 'addDir':
                    name = FileChangeEvent.ADDED;
                    break;
                case 'unlink':
                case 'unlinkDir':
                    name = FileChangeEvent.REMOVED;
                    break;
                default:
                    return;
            }
            // console.log(`Watcher::watch(${type}, ${path}`);
            if (name) {
                this._events.emit({
                    name,
                    path,
                });
            }
        });

        this._watchers.set(path, watcher);
    }
    listen(callback) {
        if(!this._events) {
            this._events = new Events();
        }
        return this._events.listen(callback);
    }
    close() {
        if (this._watchers.size) {
            for(const watcher of this._watchers.values()) {
                watcher.close();
            }
            this._watchers.clear();
        }
    }
}