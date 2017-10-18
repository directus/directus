define([
  'app',
  'backbone',
  'underscore'
],

function(app, Backbone, _) {

  'use strict';

  var TableSimple = Backbone.Layout.extend({

    events: {
      'click td' : function(e) {
        var id = $(e.target).closest('tr').attr('data-id');
        var route = Backbone.history.fragment.split('/');
        route.push(id);
        app.router.go(route);
      }
    },

    flashItem: function(entryID, bodyScrollTop) {
      document.body.scrollTop = parseInt(bodyScrollTop, 10) || 0;
      if (entryID) {
        this.$el.find('tr[data-id="' + entryID + '"]').flashRow();
      }
    },

    serialize: function() {
      var columns = this.collection.getColumns((this.columns));
      var models = this.collection.getRowsModel();
      var rows;

      // Check permissions
      // @todo: filter this on the backend and get rid of this
      models = _.filter(models, function(model) {
        var privileges = app.schemaManager.getPrivileges(model.get('table_name'));

        if (typeof privileges === 'undefined' || privileges === null) {
          return false;
        }

        // only return tables with view permissions and not hidden
        return privileges.get('allow_view') > 0  && privileges.get('nav_listed') > 0;
      });

      rows = _.map(models, function(model) {
        // Clone the model
        // prevent the table name being override for future reference
        model = model.clone();
        var id = model.get('table_name');

        model.set('table_name', app.capitalize(model.get('table_name')));

        return {model: model, id: id};
      });

      return {rows: rows, columns: columns};
    },

    initialize: function(options) {
      this.listenTo(app.router.v.main, 'flashItem', this.flashItem);
      this.columns = options.columns || false;
      // TODO: Add table row view to add or remove one row
      // instead of render the whole table again
      this.listenTo(this.collection, 'add remove', this.render);
    }
  });

  return TableSimple;

});
