import koa from 'koa';

export default function runner(opts){

    const app = koa();
    app.use(function *(next){
        console.log(this.path)
        console.log(process.cwd());
        yield next;
    });
    app.listen(8000);

}
