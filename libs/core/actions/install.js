import path from 'path';
import {BUNDLES_DIR} from '../../consts'
import getEndpoint from '../endpoints';


export default function installPackage(workspace){

    let locations = workspace.config.locations.map(location => new Location(location));
    for(let location of locations){
        install(workspace, location);
    }
}

function install(workspace, location){
    let root = path.join(config.root, BUNDLES_DIR);
    let endpoint = getEndpoint(location, config);
    endpoint.download(path.join(root, location.fspath()));
}

class Location{
    constructor(location){
        [this.endpoint, this.path, this.version] = parseLocation(location);
    }
    fspath(){
        let root = path.join(this.endpoint, this.path);
        return `${root}@${this.version}`;
    }
}

function parseLocation(location, endpoint='github'){
    let version = 'master';
    let index = location.indexOf(':');
    if(index !== -1){
        endpoint = location.substr(0, index);
        location = location.substr(index+1);
    }
    index = location.lastIndexOf('@');
    if(index !== -1){
        version = location.substr(index);
        location = location.substr(0, index);
    }
    return [endpoint, location, version];
}
