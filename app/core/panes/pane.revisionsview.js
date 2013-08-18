define([
  "app"
],

function(app) {

  var RevisionsModel = Backbone.Model.extend({
    parse: function(row) {
      row.datetime = new Date(row.datetime);
      return row;
    }
  });

  var RevisionsCollection = Backbone.Collection.extend({
    model: RevisionsModel
  });


  var PaneRevisionsView = Backbone.Layout.extend({

    template: 'module-revisions',

    attributes: {'class': 'directus-module'},

    events: {
      'click .directus-module-header': function() { this.$el.find('.directus-module-section').toggleClass('collapsed'); }

    },

    serialize: function() {
      var items = this.collection.map(function(model) {
        var data = model.toJSON();
        data.pastTense = app.actionMap[data.action];
        return data;
      });
      return {items: items, length: this.collection.length};
    },

    initialize: function(options) {
      this.collection = new RevisionsCollection();
      this.collection.url = options.baseURL + '/revisions';
      this.collection.fetch();
      this.collection.on('sync', this.render, this);
    }

  });

  return PaneRevisionsView;
});