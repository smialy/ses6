import co from 'co';
import { assert } from 'chai';
import VFS from '../libs/vfs';

const ROOT_TMP = `${__dirname}/_tmp/`;

describe('VFS', () => {
  before(() => {
    // runs before all tests in this block
  });

  after(() => {
    // runs after all tests in this block
  });

  beforeEach(() => {
    // runs before each test in this block
  });

  afterEach(() => {
    // runs after each test in this block
  });
  it('should throw error for undefined root', () => {
    assert.throws(() => {
      const fs = new VFS();
    });
  });
  describe('join()', () => {
    it('empty', () => {
      const fs = new VFS('./a');
      assert.equal(fs.join(), 'a');
    });
    it('single', () => {
      const fs = new VFS('./a');
      assert.equal(fs.join('b'), 'a/b');
    });
    it('double', () => {
      const fs = new VFS('./a');
      assert.equal(fs.join('b/c'), 'a/b/c');
    });
  });
  describe('exists()', () => {
    ait('should not exists', function* () {
      const fs = new VFS('_tmp');
      assert.isFalse(yield fs.exists());
    });
    ait('should exists', function* () {
      const fs = new VFS(ROOT_TMP);
      assert.isTrue(yield fs.exists());
    });
  });
  describe('read()', () => {
    ait('should read text file', function* () {
      const fs = new VFS(ROOT_TMP);
      const data = yield fs.read('data.txt');
      assert.equal('foo bar', data.trim());
    });
  });
  describe('write()', () => {
    ait('should write text file', function* () {
      const fs = new VFS(ROOT_TMP);
      yield fs.write('out.txt', 'bar foo');
      const data = yield fs.read('out.txt');
      assert.equal('bar foo', data.trim());
      yield fs.unlink('out.txt');
    });
  });
  describe('mkdir()', () => {
    ait('should create directory', function* () {
      const fs = new VFS(ROOT_TMP);
      if (yield fs.exists('dir')) {
        yield fs.rmdir('dir');
      }
      assert.isFalse(yield fs.exists('dir'));
      yield fs.mkdir('dir');
      assert.isTrue(yield fs.exists('dir'));
      yield fs.rmdir('dir');
    });
  });
});

function ait(name, wrapper) {
  it(name, (done) => {
    co(wrapper).then(done).catch(done);
  });
}
