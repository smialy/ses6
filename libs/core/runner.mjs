import CP from 'child_process';
import Util from 'util';

const exec = Util.promisify(CP.exec);

export class Runner {
    constructor() {
        this.tasks = [];
        this.running = false;
    }
    build({ root, pkg: { name, scripts = {}} }) {
        console.log('build', { name, tasks: this.tasks });
        return new Promise((resolve, reject) => {
            for(const cmd of ['build:dev', 'build']) {
                if (scripts[cmd]) {
                    this.tasks.push({ root, name, cmd, resolve });
                    this.next();
                    break;
                } else {
                    reject(`Missing build script "build:dev" or "build" for ${name}`)
                }
            }
        });
    }
    async next() {
        if (!this.running && this.tasks.length){
            this.running = true;
            const { root, name, cmd, resolve } = this.tasks.pop();
            console.log(`Build: ${name} (${cmd})`);
            await runCommand(root, `npm run ${cmd}`);
            console.log(`Build: ${name} finished`);
            this.running = false;
            this.next();
            resolve({ root, name });
        }
    }
}

async function runCommand(baseDir, command) {
    const { error, stdout, stderr } = await exec(command, {
        cwd: baseDir,
    });
    console.log(stdout);
    if (stderr) {
        console.warn(stderr);
    }
    if (error) {
        throw new Error(`Problem with command: "${command}" in: "${baseDir}" ${error}`);
    }
}
