import * as babel from "babel-core";

export default filePath => {
    return new Promise((resolve, reject) => {
        babel.transformFile(filePath, function(err, result){
            if(err){
                reject(err);
            }else{
                resolve(result.code);
            }
        });
    });
}
