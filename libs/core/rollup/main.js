import path from 'path';
import fs from 'mz/fs';
import {rollup} from 'rollup';
import co from 'co';



export default function(resolver, name) {
    return function *(){
        let bundleRollup = yield rollup({
            entry: name,
            plugins: [
                resolver.id(),
                resolver.memory()
            ]
        });
        return bundleRollup.generate({
            moduleName: name,
            format: 'iife'
        }).code;
    };
}
