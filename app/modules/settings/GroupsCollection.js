define([
  'modules/settings/GroupsModel',
  'core/entries/EntriesCollection'
], function (GroupsModel, EntriesCollection) {

  'use strict';

  return EntriesCollection.extend({

    model: GroupsModel,

    fetch: function (options) {
      var _fetch = EntriesCollection.prototype.fetch;

      options = options || {};

      if (!options.data) {
        options.data = {};
      }

      // Include users relational columns
      options.data['depth'] = 3;

      return _fetch.apply(this, [options]);
    }
  });
});
