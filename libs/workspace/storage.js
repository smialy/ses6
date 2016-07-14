import path from 'path';
import sqlite3 from 'sqlite3';

NAME = 'db.sqlite3'

export default class Storage{
    constructor(root){
        this.db = new sqlite3.Database(path.join(root, NAME));
    }
    create(){
        this.db.serialize(() => {
            this.db.run("CREATE TABLE bundles (id PRIMARY KEY, endpoint TEXT, name TEXT, path TEXT, version TEXT)");
        });
    }
    load(){
        return new Promise((resolve, reject) => {
            this.db.all("SELECT * FROM bundles", function(err, rows) {
                if(err){
                    reject(err);
                }else{
                    resolve(rows);
                }
            });
        });
    }
    addBundle({endpoint, name, path, version}){
        var stmt = thsi.db.prepare("INSERT INTO bundles VALUES (?, ?, ?, ?)");
        for (var i = 0; i < 10; i++) {
            stmt.run(endpoint, name, path, version);
        }
        stmt.finalize(;
    }
}
