define([
  "app",
  "backbone"
],

function(app, Backbone) {

  "use strict";

  var TableSimple = Backbone.Layout.extend({

    events: {
      'click td' : function(e) {
        var id = $(e.target).closest('tr').attr('data-id');
        var route = Backbone.history.fragment.split('/');
        route.push(id);
        app.router.go(route);
      }
    },

    serialize: function() {
      var rows = this.collection.getRows();

      var bookmarks = app.getBookmarks();

      // Check permissions
      // @todo: filter this on the backend and get rid of this
      rows = _.filter(rows, function(row) {
        var privileges = app.schemaManager.getPrivileges(row.table_name);

        // filter out tables without privileges
        if (typeof privileges === "undefined" || privileges === undefined || privileges === null) return false;
        if (privileges.get('permissions') === null) return false;

        var permissions = privileges.get('permissions').split(',');

        // only return tables with view permissions and not hidden
        return _.contains(permissions, 'view') && privileges.get('unlisted') != 1;
      });
      return {rows: rows, columns: this.collection.getColumns()};
    }

  });

  return TableSimple;

});