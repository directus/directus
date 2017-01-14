define(function(require, exports, module) {
  var Directus = {};

  Directus.Modal = {
    Container: require('core/ModalContainer'),
    User: require('core/modals/user'),
    File: require('core/modals/file'),
    Prompt: require('core/modals/prompt')
  };

  module.exports = Directus;
});
