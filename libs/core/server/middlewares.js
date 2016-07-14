import path from 'path';
import fs from 'mz/fs';
import mime from 'mime-types';


export const error = () => function* errorMiddleware(next) {
    try {
        yield next;
    } catch (err) {
        this.status = err.status || 500;
        this.body = err.stack;
        // this.app.emit('error', err, this);
    }
}

export const send = (root) => function* sendMiddleware(next){
    let ctx = this;

    let urlPath = this.path === '/' ? 'index.html' : this.path;
    let filePath = path.join(root, urlPath);
    console.log(this.method, this.path, filePath);
    try{
        let stat = yield fs.stat(filePath);
        this.set('Content-Length', stat.size);
        this.type = mime.lookup(filePath);
        this.body = fs.createReadStream(filePath);
    }catch(e){
        console.log('Not found')
        console.log(e.message);
        yield next;
    }
}

export const responseTime = () => function* responseTime(next) {
    let start = Date.now();
    yield next;
    var delta = Math.ceil(Date.now() - start);
    this.set('X-Response-Time', delta + 'ms');
}
