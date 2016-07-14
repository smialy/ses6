import {rollup} from 'rollup';


export default function(resolver, name) {
    return function *(){
        let bundleRollup = yield rollup({
            entry: name,
            plugins: [
                resolver.id()
            ]
        });
        return bundleRollup.generate({
            moduleName: name,
            format: 'iife'
        }).code;
    };
}
