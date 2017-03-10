define([
  'modules/settings/GroupsModel',
  'core/entries/EntriesCollection'
], function (GroupsModel, EntriesCollection) {

  'use strict';

  return EntriesCollection.extend({
    model: GroupsModel
  });
});
