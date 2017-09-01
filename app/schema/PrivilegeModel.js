define(['app', 'backbone'] ,function(app, Backbone) {
  'use strict';

  return Backbone.Model.extend({

    url: function () {
      var url = app.API_URL + 'tables/directus_privileges/rows';

      if (!this.isNew()) {
        url += '/' + this.id;
      }

      return url;
    },

    parse: function(result) {
      return result.data ? result.data : result;
    },

    canView: function () {
      return this.can('view');
    },

    canAdd: function () {
      return this.can('add');
    },

    canEdit: function () {
      return this.can('edit');
    },

    canDelete: function () {
      return this.can('delete');
    },

    can: function (permission) {
      if (permission.indexOf('allow_') !== 0) {
        permission = 'allow_' + permission;
      }

      return this.get(permission) > 0;
    }
  });

});
