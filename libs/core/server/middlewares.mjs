import path from 'path';
import fs from 'mz/fs';
import mime from 'mime-types';


export async function error(ctx, next) {
    try {
        await next();
    } catch (err) {
        ctx.status = err.status || 500;
        ctx.body = err.stack;
        // ctx.app.emit('error', err, ctx);
    }
}

export const send = root => async function(ctx, next) {
    let urlPath = ctx.path === '/' ? 'index.html' : ctx.path;
    let filePath = path.join(root, urlPath);
    if(await fs.exists(filePath)){
        try{
            let stat = await fs.stat(filePath);
            ctx.set('Content-Length', stat.size);
            ctx.type = mime.lookup(filePath);
            ctx.body = fs.createReadStream(filePath);
        }catch(e){
            console.log(e.message);
            await next();
        }
    }else{
        await next();
    }
}

export async function responseTime(ctx, next) {
    let start = Date.now();
    await next();
    var delta = Math.ceil(Date.now() - start);
    ctx.set('X-Response-Time', delta + 'ms');
}

export async function cors(ctx, next){
    ctx.set('Access-Control-Allow-Origin', '*');
    await next();
}
