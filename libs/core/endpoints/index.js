import GitEndpoint from './git';
import GithubEndpoint from './github';


const endpoints = {
    git: (location, config) => new GitEndpoint(location, config),
    github: (location, config) => new GithubEndpoint(location, config)
};

export default function getEndpoint(location, config){
    let factory = endpoints[location.endpoint];
    return factory(location, config);
}
