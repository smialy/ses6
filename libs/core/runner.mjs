import CP from 'child_process';
import Util from 'util';

const exec = Util.promisify(CP.exec);

export class Runner {
    constructor() {
        this.tasks = [];
        this.running = false;
    }
    build({ root, pkg: { name, scripts = {}} }) {
        return new Promise((resolve, reject) => {
            const task = this.tasks.find(task => task.name === name);
            if (task) {
                resolve({ skip: true });
                return;
            }
            let added = false;
            const cmds = ['build:dev', 'build'];
            for(const cmd of cmds) {
                if (scripts[cmd]) {
                    this.tasks.push({ root, name, cmd, resolve });
                    this.next();
                    added = true;
                    break;
                }
            }
            if (!added) {
                console.log(`Missing build script: "${cmds}" for ${name}`);
                resolve({ skip: false, missing: true, name });
            }
        });
    }
    async next() {
        if (!this.tasks.length) {
            return;
        }
        if (!this.running){
            this.running = true;
            const { root, name, cmd, resolve } = this.tasks.shift();
            try {
                console.log(`Build: ${name} (${cmd})`);
                const result = await runCommand(root, `npm run ${cmd}`);
                console.log(result);
                console.log(`Build: ${name} finished`);
            } finally {
                resolve({ root, name });
                this.running = false;
                this.next();
            }
        }
    }
}

async function runCommand(baseDir, command) {
    const { error, stdout, stderr } = await exec(command, {
        cwd: baseDir,
        timeout: 10000,
    });
    if (error) {
        throw new Error(`Problem with command: "${command}" in: "${baseDir}" ${error}`);
    }
    if (stderr) {
        return stderr;
    }

    return stdout

}
