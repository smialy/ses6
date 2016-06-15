import fs from 'fs';
import * as ui from './ui';
import server from './server';
import {ROOT_SOSGI} from './consts';


let api = {
    init: () => {
        fs.stat(ROOT_SOSGI, err => {
            if(err){
                fs.mkdir(ROOT_SOSGI, err => ui.error(`Not create folder ${err}`));
            }
        });
    },
    server: (root) => {
        server(root);
    },
    install: () => {}
};
export default api;
