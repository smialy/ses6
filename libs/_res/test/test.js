import a from './a';
console.log(a());
(
    async () => {
    const a = await import('./a.js');
    console.log(a)
})();