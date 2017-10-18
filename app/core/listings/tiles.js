define([
  'app',
  'underscore',
  'backbone',
  'core/listings/baseView',
  'helpers/file',
  'helpers/table'
], function(app, _, Backbone, BaseView, FileHelper, TableHelpers) {

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

      // TODO: Add this method into base view so any child can inherit it
      // or as a mixins so any object can use it.
      onScroll: function ($el) {
        var self = this;

        if (TableHelpers.hitBottom($el)) {
          if (this.collection.canFetchMore()) {
            this.$('.loading-more').show();
            this.collection.fetchNext().then(function () {
              self.$('.loading-more').hide();
              // @TODO: should add one item at a time for performance
              self.render();
            });
          }
        }
      },

      editItem: function (event) {
        var id = $(event.currentTarget).data('id');
        var route = Backbone.history.fragment.split('/');

        route.push(id);
        app.router.go(route);
      },

      serialize: function () {
        var titleColumn = this.getTitleColumn();
        var subTitleColumn = this.getSubTitleColumn();
        var typeColumn = this.getTypeColumn();
        var fileColumn = this.getFileColumn();
        var items = [];

        if (fileColumn) {
          items = this.collection.map(function (model) {
            var item = {};

            item.id = model.get('id');
            item.titleColumn = titleColumn ? titleColumn.id : null;
            item.subtitleColumn = subTitleColumn ? subTitleColumn.id : null;
            item.typeColumn = typeColumn ? typeColumn.id : null;
            item.thumb = model.has(fileColumn.id) ? model.get(fileColumn.id).get('thumbnail_url') : null;
            item.model = model;

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
              ui: 'dropdown',
              options: {
                options: options.title
              }
            },
            {
              id: 'subtitle_column',
              type: 'String',
              required: true,
              ui: 'dropdown',
              options: {
                options: options.subtitle
              }
            },
            {
              id: 'type_column',
              type: 'String',
              required: true,
              ui: 'dropdown',
              options: {
                options: options.type
              }
            },
            {
              id: 'file_column',
              type: 'String',
              required: true,
              ui: 'dropdown',
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

      bindEvents: function () {
        this.collection.on('sync', this.render, this);
        this.collection.preferences.on('sync', this.render, this);
        this.on('scroll', _.throttle(this.onScroll, 200), this);
      },

      unbindEvents: function () {
        this.collection.off('sync', this.render, this);
        this.collection.preferences.off('sync', this.render, this);
        this.off('scroll', _.throttle(this.onScroll, 200), this);
      },

      afterRender: function () {
        // Show fallback image if file missing
        FileHelper.hideOnImageError(this.$('.js-image img'));
      },

      initialize: function () {
        //
      }
    })
  }
});
