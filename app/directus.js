define(function(require, exports, module) {
  'use strict';

  var Directus = {};

  Directus.Modal = {
    Container: require('core/ModalContainer'),
    User: require('core/modals/user'),
    File: require('core/modals/file'),
    Prompt: require('core/modals/prompt')
  };

  Directus.Logger = require('core/logger');

  module.exports = Directus;
});
