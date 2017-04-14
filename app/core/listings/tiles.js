define(['app', 'underscore', 'backbone', 'core/listings/baseView', 'core/t'], function(app, _, Backbone, BaseView, __t) {

  return {
    id: 'tiles',

    icon: 'apps',

    uiNames: ['single_file'],

    View: BaseView.extend({

      template: 'core/listings/tiles',

      attributes: {
        class: 'view-tiles js-listing-view file-listing'
      },

      events: {
        'click .file': 'editItem'
      },

      fetchData: function () {
        return this.collection.fetch();
      },

      editItem: function (event) {
        var id = $(event.currentTarget).data('id');
      },

      serialize: function () {
        var titleColumn = this.getTitleColumn();
        var subTitleColumn = this.getSubTitleColumn();
        var typeColumn = this.getTypeColumn();
        var fileColumn = this.getFileColumn();
        var items = [];

        if (fileColumn) {
          items = this.collection.map(function(model) {
            var item = {};

            item.id = model.get('id');
            item.title = titleColumn ? model.get(titleColumn.id) : '';
            item.subtitle = subTitleColumn ? model.get(subTitleColumn.id) : '';
            item.type = typeColumn ? model.get(typeColumn.id) : '';
            item.thumb = model.has(fileColumn.id) ? model.get(fileColumn.id).get('thumbnail_url') : null;

            return item;
          });
        }

        return {
          items: items
        };
      },

      optionsStructure: function () {
        var options = {
          title: {},
          subtitle: {},
          type: {},
          file: {}
        };

        _.each(this.titleColumns(), function(column) {
          options.title[column.id] = app.capitalize(column.id);
          options.subtitle[column.id] = app.capitalize(column.id);
          options.type[column.id] = app.capitalize(column.id);
        });

        _.each(this.fileColumns(), function(column) {
          options.file[column.id] = app.capitalize(column.id);
        });

        return {
          columns: [
            {
              id: 'title_column',
              type: 'String',
              required: true,
              ui: 'select',
              options: {
                options: options.title
              }
            },
            {
              id: 'subtitle_column',
              type: 'String',
              required: true,
              ui: 'select',
              options: {
                options: options.subtitle
              }
            },
            {
              id: 'type_column',
              type: 'String',
              required: true,
              ui: 'select',
              options: {
                options: options.type
              }
            },
            {
              id: 'file_column',
              type: 'String',
              required: true,
              ui: 'select',
              options: {
                options: options.file
              }
            }
          ]
        };
      },

      getTitleColumn: function () {
        var viewOptions = this.getViewOptions();
        var column;

        if (viewOptions.title_column) {
          column = this.collection.structure.get(viewOptions.title_column);
        } else {
          column = _.first(this.titleColumns())
        }

        return column;
      },

      getSubTitleColumn: function () {
        var viewOptions = this.getViewOptions();
        var column;

        if (viewOptions.subtitle_column) {
          column = this.collection.structure.get(viewOptions.subtitle_column);
        } else {
          column = _.first(this.titleColumns())
        }

        return column;
      },

      getTypeColumn: function () {
        var viewOptions = this.getViewOptions();
        var column;

        if (viewOptions.type_column) {
          column = this.collection.structure.get(viewOptions.type_column);
        } else {
          column = _.first(this.titleColumns())
        }

        return column;
      },

      getFileColumn: function () {
        var viewOptions = this.getViewOptions();
        var column;

        if (viewOptions.file_column) {
          column = this.collection.structure.get(viewOptions.file_column);
        } else {
          column = _.first(this.fileColumns())
        }

        return column;
      },

      titleColumns: function () {
        return this.collection.structure.filter(function(model) {
          return _.contains(['VARCHAR'], model.get('type'));
        });
      },

      fileColumns: function () {
        return this.collection.structure.filter(function(model) {
          return _.contains(['single_file'], model.get('ui'));
        });
      },

      onEnable: function () {
        this.collection.on('sync', this.render, this);
        this.collection.preferences.on('sync', this.render, this);
      },

      onDisable: function () {
        this.collection.off('sync', this.render, this);
        this.collection.preferences.off('sync', this.render, this);
      },

      initialize: function () {
        //
      }
    })
  }
});
