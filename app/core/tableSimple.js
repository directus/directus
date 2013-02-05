define([
  "app",
  "backbone"
],

function(app, Backbone) {

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
      return {rows: this.collection.getRows(), columns: this.collection.getColumns()};
    }

  });

  return TableSimple;

});