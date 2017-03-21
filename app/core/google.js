define(['async'], function(async) {
  return {
    load: function (module, version, settings) {
      require(['async!https://www.google.com/jsapi'], function () {
        google.load(module, version, settings);
      });
    }
  }
});
