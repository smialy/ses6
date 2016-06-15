import co from 'co';
import {assert} from 'chai';
import VFS from '../libs/vfs';

const ROOT_TMP = `${__dirname}/_tmp/`;

describe('VFS', function() {

    before(function() {
        // runs before all tests in this block
    });

    after(function() {
        // runs after all tests in this block
    });

    beforeEach(function() {
        // runs before each test in this block
    });

    afterEach(function() {
        // runs after each test in this block
    });
    it('should throw error for undefined root', () => {
        assert.throws(() => {
            var fs = new VFS();
        });
    });
    describe('join()', () => {
        it('empty', () => {
            var fs = new VFS('./a');
            assert.equal(fs.join(), 'a');
        });
        it('single', () => {
            let fs = new VFS('./a');
            assert.equal(fs.join('b'), 'a/b');
        });
        it('double', () => {
            var fs = new VFS('./a');
            assert.equal(fs.join('b/c'), 'a/b/c');
        });
    });
    describe('exists()', () => {
        ait('should not exists', function* (){
            var fs = new VFS('_tmp');
            assert.isFalse(yield fs.exists());
        });
        ait('should exists', function* (){
            var fs = new VFS(ROOT_TMP);
            assert.isTrue(yield fs.exists());
        });
    });
    describe('read()', () => {
        ait('should read text file', function* (){
            let fs = new VFS(ROOT_TMP);
            let data = yield fs.read('data.txt');
            assert.equal('foo bar', data.trim());
        });
    });
    describe('write()', () => {
        ait('should write text file', function* (){
            let fs = new VFS(ROOT_TMP);
            yield fs.write('out.txt', 'bar foo');
            let data = yield fs.read('out.txt');
            assert.equal('bar foo', data.trim());
            yield fs.unlink('out.txt');
        });
    });
    describe('mkdir()', () =>{
        ait('should create directory', function* (){
            let fs = new VFS(ROOT_TMP);
            if(yield fs.exists('dir')){
                yield fs.rmdir('dir');
            }
            assert.isFalse(yield fs.exists('dir'));
            yield fs.mkdir('dir');
            assert.isTrue(yield fs.exists('dir'));
            yield fs.rmdir('dir');
        });
    });
});

function ait(name, wrapper){
    it(name, done => {
        co(wrapper).then(done).catch(done);
    });
}
