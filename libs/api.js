import fs from 'mz/fs';
import co from 'co';
import path from 'path';
import * as ui from './ui';
import server from './core/server';
import {SOSGI_DIR} from './consts';


let api = {
    init: (config) => {
        let root = path.join(config.root, SOSGI_DIR);
        co(async function(){
            if(await fs.exists(root) == false){
                await fs.mkdir(root);
            }
        });
    },
    server: config => server(config),
    install: config => console.log('install', config.locations)
};
export default api;
