define(function(require, exports, module) {
  "use strict";

  module.exports = {
    activity: require('./activity'),
    groups: require('./groups'),
    media: require('./media'),
    messages: require('./messages'),
    settingsGlobal: require('./settings.global'),
    settingsMedia: require('./settings.media'),
    users: require('./users')
  }

});