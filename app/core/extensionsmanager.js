define(function(require, exports, module) {

  "use strict";

  var Extensions = function Extensions() {
    console.log('extensions begin');
  };

  Extensions.prototype.register = function(sources) {
    this.external = sources;
  };

  Extensions.prototype.get = function(id, callback) {
    var path = this.external[id];

    var errback = function(err) {
      callback(err);
    };

    require([path], function(module) {
      callback(null, module);
    }, errback);

  };


  module.exports = Extensions;

});