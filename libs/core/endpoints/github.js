import GitEndpoint from './git';

export default class GithubEndpoint extends GitEndpoint{
    constructor(location, config={}){
        super(location, config);
    }
    getUrl(){
        let path = this.location.path;
        return `git@github.com:${path}.git`;
    }
}
