define([
  'app',
  'underscore',
  'backbone',
  'core/edit',
  'schema/ColumnsCollection',
  'core/RightPane',
  'core/ListViewManager',
  'dragula'
], function(app, _, Backbone, EditView, Structure, RightPane, ListViewManager, Dragula) {

  return RightPane.extend({

    template: 'modules/tables/table-right-pane',

    events: {
      'click .tiles .tile': 'changeView',
      'click .js-column': 'updateVisibleColumns',
      'click .js-close': 'close',
      'change .js-spacing-adjust': 'updateSpacing'
    },

    changeView: function(event) {
      var viewId = $(event.currentTarget).data('view');

      if (!this.supportsView(viewId, this.collection)) {
        return;
      }

      this.$('.tiles .tile.active').removeClass('active');
      this.$('#' + viewId + '-view').addClass('active');

      if (viewId !== this.state.viewId) {
        this.state.viewId = viewId;
        this.trigger('view:change', viewId);
      }
    },

    updateVisibleColumns: function(event) {
      var collection = this.collection;
      var preferences = collection.preferences;

      var $inputs = this.$('#reorder-columns input:checked');
      var columns = _.map($inputs, function(input) {
        return $(input).data('name');
      });

      preferences.save({'columns_visible': columns.join(',')},{
        success: function() {
          collection.trigger('visibility');
        }
      });

      collection.filters.columns_visible = columns;
      collection.fetch();
    },

    updateSpacing: function(event) {
      var spacing = $(event.currentTarget).val();
      this.trigger('spacing:change', spacing);
    },

    beforeRender: function() {
      var view = this.baseView.table;

      if (!view.optionsStructure) {
        return;
      }

      var options = _.result(view, 'getViewOptions');
      var model = new Backbone.Model(options);
      var structure = new Structure(_.result(view, 'optionsStructure'), {parse: true});

      this.editView = new EditView({
        model: model,
        structure: structure,
        events: {
          'change input, select, textarea': _.bind(this.onInputChange, this)
        }
      });

      this.insertView('.options', this.editView);
    },

    onInputChange: function(event) {
      var element = $(event.currentTarget).get(0);

      this.trigger('input:change', element.name, element.value);
    },

    serialize: function() {
      var collection = this.collection;
      var structure = collection.structure;
      var preferences = collection.preferences;
      var data = collection ? collection.toJSON() : {};
      var visibleColumns = preferences.get('columns_visible').split(',');
      var selectedSpacing = this.baseView.getSpacing();

      data.spacings = _.map(app.config.get('spacings'), function(value) {
        return {
          name: value,
          selected: value === selectedSpacing
        }
      });

      data.columns = structure.chain()
        .filter(function(model) {
          return !model.get('system') && !model.get('hidden_list') && !model.get('hidden_input');
        })
        .map(function(model) {
          var sort, isVisible;
          var index = _.indexOf(visibleColumns, model.id);
          var isForeign = _.contains(['MANYTOMANY', 'ONETOMANY'], model.getRelationshipType());

          isVisible = index >= 0;
          sort = index >= 0 ? index : 9999;

          return {
            id: model.id,
            name: model.get('column_name'),
            sort: sort,
            visible: isVisible,
            disabled: isForeign,
            isForeign: isForeign
          };
        }, this)
        .sortBy(function(column) {
          return column.sort;
        })
        .value();

      data.views = _.map(ListViewManager.getViews(), _.bind(function(view) {
        var data = _.omit(view, 'View');
        data.isActive = data.id === this.state.viewId;

        return data;
      }, this));

      data.viewId = this.state.viewId;

      return data;
    },

    supportsView: function(viewId, collection) {
      collection = collection || this.collection;
      var structure = collection.structure;
      var view;

      if (!collection || !structure) {
        return false;
      }

      view = ListViewManager.get(viewId);

      return !view.dataTypes || _.some(view.dataTypes, function(type) {
        var hasType = false;
        structure.each(function(column) {
          if (type.toLowerCase() == (column.get('type') || '').toLocaleLowerCase()) {
            hasType = true;
          }
        });

        return hasType;
      });
    },

    initialize: function(options) {
      this.state = {
        viewId: options.listView || this.collection.table.get('list_view') || 'table'
      };

      var drag = Dragula({
        isContainer: function (el) {
          return el.classList.contains('reorder-columns');
        },
        moves: function (el, source, handle, sibling) {
          return true; // elements are always draggable by default
          // return handle.classList.contains('reorder-handle');
        },
        accepts: function (el, target, source, sibling) {
          return true; // elements can be dropped in any of the `containers` by default
        },
        invalid: function (el, handle) {
          return false; // don't prevent any drags from initiating by default
        },
        direction: 'vertical',             // Y axis is considered when determining where an element would be dropped
        copy: false,                       // elements are moved by default, not copied
        copySortSource: false,             // elements in copy-source containers can be reordered
        revertOnSpill: false,              // spilling will put the element back where it was dragged from, if this is true
        removeOnSpill: false,              // spilling will `.remove` the element, if this is true
        mirrorContainer: this.$('.reorder-columns')[0],    // set the element that gets mirror elements appended
        ignoreInputTextSelection: true     // allows users to select input text, see details below
      });

      drag.on('drop', _.bind(this.updateVisibleColumns, this));
    }
  });
});
