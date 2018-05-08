import Router from 'koa-router';


export default function apiMiddleware(config) {
    let api = new Router({
        prefix: '/api'
    });

    api.get('/bundles/list', async function(ctx, next) {
        ctx.set('Content-Type', 'application/json');
        ctx.body = JSON.stringify([

        ]);
    });

    api.get('/auth/user', async function(ctx, next) {
        ctx.set('Content-Type', 'application/json');
        ctx.body = JSON.stringify({
            id:1,
            login:'user',
            name:'User'
        });
    });

    return api;
}
