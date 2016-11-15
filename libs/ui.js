
export function log(...args){
    process.stdout.write(args.join('\n')+'\n', 'utf8');
}


export function error(...args){
    args = args.map(arg => arg.stack ? arg.stack : arg.toStrin());
    process.stderr.write(args.join('\n')+'\n', 'utf8');
}
