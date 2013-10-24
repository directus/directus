define(function(require, exports, module) {

  "use strict";

  module.exports = {

    //  Data Model

    ColumnModel: require('./column.model'),

    ColumnsCollection: require('./columns.collection'),

    TableModel: require('./table.model'),

    UIModel: require('./ui.model'),

    // Fixed Schemas

    Fixed: {

      activity: require('./fixed/activity'),

      groups: require('./fixed/groups'),

      media: require('./fixed/media'),

      messages: require('./fixed/messages'),

      settingsGlobal: require('./fixed/settings.global'),

      settingsMedia: require('./fixed/settings.media'),

      users: require('./fixed/users')

    }
  }

});