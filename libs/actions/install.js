import path from 'path';
import co from 'co';
import fs from 'mz/fs';

import {BUNDLES_DIR} from '../consts'
import getEndpoint from '../core/endpoints';
import {parseLocation} from '../utils';


export default function installPackage(workspace, locations){
    locations = prepareLocations(workspace, locations);
    console.log(locations)
    return Promise.all(
        locations.map(location => install(location, workspace.config))
    );
}

function install(location, config={}){
    let root = path.join(config.root, BUNDLES_DIR);
    let endpoint = getEndpoint(location, config);
    return endpoint.download(path.join(root, location.fspath()));
}

function prepareLocations(workspace, urls){
    if(!urls.length){
        urls = workspace.package.locations;
    }
    return urls.map(url => parseLocation(url));
}
