import GitEndpoint from './git';

export default class GithubEndpoint extends GitEndpoint{
    getUrl(){
        let path = this.location.path;
        if(this.config.edit){
            return `git@github.com:${path}.git`;
        }
        return `https://github.com/${path}.git`;
    }
}
