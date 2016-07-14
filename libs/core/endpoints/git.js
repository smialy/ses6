import git from 'nodegit';

export default class GitEndpoint{
    constructor(location, config={}){
        this.location = location;
        this.config = config;
    }
    download(dest){
        return git.Clone(this.getUrl(), dest, getCloneOptions()).then(repo => {
            return repo.checkoutBranch(this.location.version);
        }).catch(e => console.log(e));
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
