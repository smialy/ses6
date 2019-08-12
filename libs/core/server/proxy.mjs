import http from 'http';
import url from 'url';
import buddy from 'co-body';


export default (proxyUrl, options={}) => {
    const proxy = new url.URL(proxyUrl)

    return (ctx, next) => {
        if(ctx.path.indexOf(proxy.pathname) !== 0){
            return next();
        }
        const options = {
            protocol: proxy.protocol,
            hostname: proxy.hostname,
            port: proxy.port,
            path: ctx.path,
            method: ctx.method,
            headers: ctx.headers
        };
        return new Promise((resolve, reject) => {
            const req = http.request(options, res => {
                res.setEncoding('utf8');
                Object.keys(res.headers).forEach(
                    h => ctx.set(h, res.headers[h])
                );
                let body = '';
                res.on('data', chunk => {
                    body += chunk;
                });
                res.on('end', () => {
                    ctx.status = res.statusCode;
                    ctx.body = body;
                    resolve();
                });
            });
            req.on('error', e => {
                console.error(`problem with request: ${e.message}`);
                reject(e);
            });
            if(ctx.method === 'POST' || ctx.method === 'PUT'){
                buddy.text(ctx).then(data => {
                    req.write(data);
                    req.end();
                });
            }else{
                req.end();
            }
        });
    };
};
