define(['app', 'underscore', 'backbone', 'core/listings/baseView'], function(app, _, Backbone, BaseView) {

  return {
    id: 'tiles',

    icon: 'apps',

    View: BaseView.extend({

      template: 'core/listings/tiles',

      attributes: {
        class: 'view-tiles js-listing-view file-listing'
      },

      serialize: function() {
        var titleColumn = this.getTitleColumn();
        var items = this.collection.map(function(model) {
          var item = {};

          item.id = model.get('id');
          item.title = model.get(titleColumn.id);

          return item;
        });

        return {
          items: items
        };
      },

      optionsStructure: function() {
        var options = {
          title: {}
        };

        _.each(this.titleColumns(), function(column) {
          options.title[column.id] = column.id;
        });

        return [
          {
            id: 'title_column',
            type: 'String',
            required: true,
            ui: 'select',
            options: {
              options: options.title
            }
          }
        ]
      },

      getTitleColumn: function() {
        var viewOptions = this.getViewOptions();
        var column;

        if (viewOptions.title_column) {
          column = this.collection.structure.get(viewOptions.title_column);
        } else {
          column = _.first(this.titleColumns())
        }

        return column;
      },

      titleColumns: function() {
        return this.collection.structure.filter(function(model) {
          return _.contains(['VARCHAR'], model.get('type'));
        });
      },

      onEnable: function() {
        this.collection.on('sync', this.render, this);
        this.collection.preferences.on('sync', this.render, this);
      },

      onDisable: function() {
        this.collection.off('sync', this.render, this);
        this.collection.preferences.off('sync', this.render, this);
      },

      initialize: function() {
        //
      }
    })
  }
});
