
export function log(...args){
    process.stdout.write(args.join('\n')+'\n', 'utf8');
}


export function error(...args){
    process.stderr.write(args.join('\n')+'\n', 'utf8');
}
