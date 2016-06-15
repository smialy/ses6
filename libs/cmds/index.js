import init from './init';
import install from './install';
import server from './server';

const cmds = {
    init: init,
    server: server,
    install: install
}

export default function runCmd(args){

    if(!args.length){
        used();
    }else{
        if(typeof args === 'string'){
            args = args.split(' ');
        }
        cmds[args[0]](args.splice(1));
    }
}

function used(){

}
