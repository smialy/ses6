// import git from 'nodegit';
import Endpoint from './base';


export default class GitEndpoint extends Endpoint{


    download(dest){
        return git.Clone(this.getUrl(), dest, getCloneOptions()).then(repo => {
            return repo.checkoutBranch(this.location.version);
        });
    }
    getUrl(){
        return this.location.path;
    }
}

function getCloneOptions(){
    return {
        fetchOpts: {
            callbacks: {
                certificateCheck: function() { return 1; },
                credentials: function(url, userName) {
                    return git.Cred.sshKeyFromAgent(userName);
                }
            }
        }
    };
}
