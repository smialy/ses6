(function () {
  const systemJSPrototype = System.constructor.prototype;

  // const SystemImport = systemJSPrototype.import;
  // systemJSPrototype.import = function (id, parentUrl) {
  //     return SystemImport.call(this, id, parentUrl).then(result => {
  //         return result;
  //     });
  // };

  const systemResolve = systemJSPrototype.resolve;
  const host = `${location.protocol}//${location.host}`;
  systemJSPrototype.resolve = async function (id, parentUrl) {
    try {
      return await systemResolve.call(this, id, parentUrl);
    } catch (e) { }
    return `${host}/_dev/modules/${id}`;
  };
}());
