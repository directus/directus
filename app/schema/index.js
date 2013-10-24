define(function(require, exports, module) {
  "use strict";

  module.exports = {
    activity: require('./static/activity'),
    groups: require('./static/groups'),
    media: require('./static/media'),
    messages: require('./static/messages'),
    settingsGlobal: require('./static/settings.global'),
    settingsMedia: require('./static/settings.media'),
    users: require('./static/users')
  }

});