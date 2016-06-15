import fs from 'fs';


export default filePath => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (err, data) => {
            if(err){
                reject(err);
            }else{
                resolve(data);
            }
        });
    });
}
