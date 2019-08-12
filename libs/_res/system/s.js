/*
* SJS 3.1.6
* Minimal SystemJS Build
*/
(function () {
  const hasSelf = typeof self !== 'undefined';

  const envGlobal = hasSelf ? self : global;

  let baseUrl;
  if (typeof location !== 'undefined') {
    baseUrl = location.href.split('#')[0].split('?')[0];
    const lastSepIndex = baseUrl.lastIndexOf('/');
    if (lastSepIndex !== -1) { baseUrl = baseUrl.slice(0, lastSepIndex + 1); }
  }

  const backslashRegEx = /\\/g;
  function resolveIfNotPlainOrUrl(relUrl, parentUrl) {
    if (relUrl.indexOf('\\') !== -1) { relUrl = relUrl.replace(backslashRegEx, '/'); }
    // protocol-relative
    if (relUrl[0] === '/' && relUrl[1] === '/') {
      return parentUrl.slice(0, parentUrl.indexOf(':') + 1) + relUrl;
    }
    // relative-url
    if (relUrl[0] === '.' && (relUrl[1] === '/' || relUrl[1] === '.' && (relUrl[2] === '/' || relUrl.length === 2 && (relUrl += '/'))
        || relUrl.length === 1 && (relUrl += '/'))
        || relUrl[0] === '/') {
      const parentProtocol = parentUrl.slice(0, parentUrl.indexOf(':') + 1);
      // Disabled, but these cases will give inconsistent results for deep backtracking
      // if (parentUrl[parentProtocol.length] !== '/')
      //  throw new Error('Cannot resolve');
      // read pathname from parent URL
      // pathname taken to be part after leading "/"
      let pathname;
      if (parentUrl[parentProtocol.length + 1] === '/') {
        // resolving to a :// so we need to read out the auth and host
        if (parentProtocol !== 'file:') {
          pathname = parentUrl.slice(parentProtocol.length + 2);
          pathname = pathname.slice(pathname.indexOf('/') + 1);
        } else {
          pathname = parentUrl.slice(8);
        }
      } else {
        // resolving to :/ so pathname is the /... part
        pathname = parentUrl.slice(parentProtocol.length + (parentUrl[parentProtocol.length] === '/'));
      }

      if (relUrl[0] === '/') { return parentUrl.slice(0, parentUrl.length - pathname.length - 1) + relUrl; }

      // join together and split for removal of .. and . segments
      // looping the string instead of anything fancy for perf reasons
      // '../../../../../z' resolved to 'x/y' is just 'z'
      const segmented = pathname.slice(0, pathname.lastIndexOf('/') + 1) + relUrl;

      const output = [];
      let segmentIndex = -1;
      for (let i = 0; i < segmented.length; i++) {
        // busy reading a segment - only terminate on '/'
        if (segmentIndex !== -1) {
          if (segmented[i] === '/') {
            output.push(segmented.slice(segmentIndex, i + 1));
            segmentIndex = -1;
          }
        }

        // new segment - check if it is relative
        else if (segmented[i] === '.') {
          // ../ segment
          if (segmented[i + 1] === '.' && (segmented[i + 2] === '/' || i + 2 === segmented.length)) {
            output.pop();
            i += 2;
          }
          // ./ segment
          else if (segmented[i + 1] === '/' || i + 1 === segmented.length) {
            i += 1;
          } else {
            // the start of a new segment as below
            segmentIndex = i;
          }
        }
        // it is the start of a new segment
        else {
          segmentIndex = i;
        }
      }
      // finish reading out the last segment
      if (segmentIndex !== -1) { output.push(segmented.slice(segmentIndex)); }
      return parentUrl.slice(0, parentUrl.length - pathname.length) + output.join('');
    }
  }

  /*
   * SystemJS Core
   *
   * Provides
   * - System.import
   * - System.register support for
   *     live bindings, function hoisting through circular references,
   *     reexports, dynamic import, import.meta.url, top-level await
   * - System.getRegister to get the registration
   * - Symbol.toStringTag support in Module objects
   * - Hookable System.createContext to customize import.meta
   * - System.onload(id, err?) handler for tracing / hot-reloading
   *
   * Core comes with no System.prototype.resolve or
   * System.prototype.instantiate implementations
   */

  const hasSymbol = typeof Symbol !== 'undefined';
  const toStringTag = hasSymbol && Symbol.toStringTag;
  const REGISTRY = hasSymbol ? Symbol() : '@';

  function SystemJS() {
    this[REGISTRY] = {};
  }

  const systemJSPrototype = SystemJS.prototype;
  systemJSPrototype.import = function (id, parentUrl) {
    const loader = this;
    return Promise.resolve(loader.resolve(id, parentUrl))
      .then((id) => {
        const load = getOrCreateLoad(loader, id);
        return load.C || topLevelLoad(loader, load);
      });
  };

  // Hookable createContext function -> allowing eg custom import meta
  systemJSPrototype.createContext = function (parentId) {
    return {
      url: parentId,
    };
  };

  let lastRegister;
  systemJSPrototype.register = function (deps, declare) {
    lastRegister = [deps, declare];
  };

  /*
   * getRegister provides the last anonymous System.register call
   */
  systemJSPrototype.getRegister = function () {
    const _lastRegister = lastRegister;
    lastRegister = undefined;
    return _lastRegister;
  };

  function getOrCreateLoad(loader, id, firstParentUrl) {
    let load = loader[REGISTRY][id];
    if (load) { return load; }

    const importerSetters = [];
    const ns = Object.create(null);
    if (toStringTag) { Object.defineProperty(ns, toStringTag, { value: 'Module' }); }

    const instantiatePromise = Promise.resolve()
      .then(() => loader.instantiate(id, firstParentUrl))
      .then((registration) => {
        if (!registration) { throw new Error(`Module ${id} did not instantiate`); }
        function _export(name, value) {
        // note if we have hoisted exports (including reexports)
          load.h = true;
          let changed = false;
          if (typeof name !== 'object') {
            if (!(name in ns) || ns[name] !== value) {
              ns[name] = value;
              changed = true;
            }
          } else {
            for (const p in name) {
              const value = name[p];
              if (!(p in ns) || ns[p] !== value) {
                ns[p] = value;
                changed = true;
              }
            }
          }
          if (changed) {
            for (let i = 0; i < importerSetters.length; i++) { importerSetters[i](ns); }
          }
          return value;
        }
        const declared = registration[1](_export, registration[1].length === 2 ? {
          import(importId) {
            return loader.import(importId, id);
          },
          meta: loader.createContext(id),
        } : undefined);
        load.e = declared.execute || function () {};
        return [registration[0], declared.setters || []];
      });

    const linkPromise = instantiatePromise
      .then(instantiation => Promise.all(instantiation[0].map((dep, i) => {
        const setter = instantiation[1][i];
        return Promise.resolve(loader.resolve(dep, id))
          .then((depId) => {
            const depLoad = getOrCreateLoad(loader, depId, id);
            // depLoad.I may be undefined for already-evaluated
            return Promise.resolve(depLoad.I)
              .then(() => {
                if (setter) {
                  depLoad.i.push(setter);
                  // only run early setters when there are hoisted exports of that module
                  // the timing works here as pending hoisted export calls will trigger through importerSetters
                  if (depLoad.h || !depLoad.I) { setter(depLoad.n); }
                }
                return depLoad;
              });
          });
      }))
        .then((depLoads) => {
          load.d = depLoads;
        }));

    linkPromise.catch((err) => {
      load.e = null;
      load.er = err;
    });

    // Captial letter = a promise function
    return load = loader[REGISTRY][id] = {
      id,
      // importerSetters, the setters functions registered to this dependency
      // we retain this to add more later
      i: importerSetters,
      // module namespace object
      n: ns,

      // instantiate
      I: instantiatePromise,
      // link
      L: linkPromise,
      // whether it has hoisted exports
      h: false,

      // On instantiate completion we have populated:
      // dependency load records
      d: undefined,
      // execution function
      // set to NULL immediately after execution (or on any failure) to indicate execution has happened
      // in such a case, pC should be used, and pLo, pLi will be emptied
      e: undefined,

      // On execution we have populated:
      // the execution error if any
      er: undefined,
      // in the case of TLA, the execution promise
      E: undefined,

      // On execution, pLi, pLo, e cleared

      // Promise for top-level completion
      C: undefined,
    };
  }

  function instantiateAll(loader, load, loaded) {
    if (!loaded[load.id]) {
      loaded[load.id] = true;
      // load.L may be undefined for already-instantiated
      return Promise.resolve(load.L)
        .then(() => Promise.all(load.d.map(dep => instantiateAll(loader, dep, loaded))));
    }
  }

  function topLevelLoad(loader, load) {
    return load.C = instantiateAll(loader, load, {})
      .then(() => postOrderExec(loader, load, {}))
      .then(() => load.n);
  }

  // the closest we can get to call(undefined)
  const nullContext = Object.freeze(Object.create(null));

  // returns a promise if and only if a top-level await subgraph
  // throws on sync errors
  function postOrderExec(loader, load, seen) {
    if (seen[load.id]) { return; }
    seen[load.id] = true;

    if (!load.e) {
      if (load.er) { throw load.er; }
      if (load.E) { return load.E; }
      return;
    }

    // deps execute first, unless circular
    let depLoadPromises;
    load.d.forEach((depLoad) => {
      {
        const depLoadPromise = postOrderExec(loader, depLoad, seen);
        if (depLoadPromise) { (depLoadPromises = depLoadPromises || []).push(depLoadPromise); }
      }
    });
    if (depLoadPromises) {
      return Promise.all(depLoadPromises).then(doExec);
    }

    return doExec();

    function doExec() {
      try {
        let execPromise = load.e.call(nullContext);
        if (execPromise) {
          execPromise = execPromise.then(() => {
            load.C = load.n;
            load.E = null;
          });
          return load.E = load.E || execPromise;
        }
        // (should be a promise, but a minify optimization to leave out Promise.resolve)
        load.C = load.n;
      } catch (err) {
        load.er = err;
        throw err;
      } finally {
        load.L = load.I = undefined;
        load.e = null;
      }
    }
  }

  envGlobal.System = new SystemJS();

  /*
   * Supports loading System.register via script tag injection
   */

  let err;
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (e) => {
      err = e.error;
    });
  }

  const systemRegister = systemJSPrototype.register;
  systemJSPrototype.register = function (deps, declare) {
    err = undefined;
    systemRegister.call(this, deps, declare);
  };

  systemJSPrototype.instantiate = function (url, firstParentUrl) {
    const loader = this;
    return new Promise(((resolve, reject) => {
      const script = document.createElement('script');
      script.charset = 'utf-8';
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.addEventListener('error', () => {
        reject(new Error(`Error loading ${url}${firstParentUrl ? ` from ${firstParentUrl}` : ''}`));
      });
      script.addEventListener('load', () => {
        document.head.removeChild(script);
        // Note URL normalization issues are going to be a careful concern here
        if (err) {
          reject(err);
          return err = undefined;
        }
        resolve(loader.getRegister());
      });
      script.src = url;
      document.head.appendChild(script);
    }));
  };

  /*
   * Supports loading System.register in workers
   */

  if (hasSelf && typeof importScripts === 'function') {
    systemJSPrototype.instantiate = function (url) {
      const loader = this;
      return new Promise(((resolve, reject) => {
        try {
          importScripts(url);
        } catch (e) {
          reject(e);
        }
        resolve(loader.getRegister());
      }));
    };
  }

  systemJSPrototype.resolve = function (id, parentUrl) {
    const resolved = resolveIfNotPlainOrUrl(id, parentUrl || baseUrl);
    if (!resolved) {
      if (id.indexOf(':') !== -1) { return Promise.resolve(id); }
      throw new Error(`Cannot resolve "${id}${parentUrl ? `" from ${parentUrl}` : '"'}`);
    }
    return Promise.resolve(resolved);
  };
}());
