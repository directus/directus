define([
  'app',
  'underscore',
  'utils',
  'core/t',
  'core/notification',
  'backbone',
  'core/edit',
  'schema/FakeTableModel',
  'core/RightPane',
  'core/ListViewManager',
  'dragula'
], function(app, _, Utils, __t, Notification, Backbone, EditView, FakeTableModel, RightPane, ListViewManager, Dragula) {

  return RightPane.extend({

    template: 'modules/tables/table-right-pane',

    events: {
      'click .tiles .tile': 'changeView',
      'click .js-column': 'updateVisibleColumns',
      'click .js-item-numbers': 'toggleItemNumbers',
      'click .js-last-updated': 'toggleLastUpdated',
      'click .js-comments-count': 'toggleCommentsCount',
      'click .js-revisions-count': 'toggleRevisionsCount',
      'click .js-show-footer': 'toggleFooter',
      'click .js-close': 'onClose'
    },

    changeView: function(event) {
      var viewId = $(event.currentTarget).data('view');
      var view = ListViewManager.get(viewId);

      if (!this.supportsView(viewId)) {
        var types = view.dataTypes || [];
        var uis = view.uiNames || [];

        return Notification.warning(__t('view_x_requires_y', {
          viewId: viewId,
          types: types.concat(uis).join(',').toUpperCase()
        }));
      }

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

    toggleItemNumbers: function (event) {
      var checked = $(event.currentTarget).is(':checked');

      this.baseView.trigger('rightPane:input:change', 'item_numbers', checked);
    },

    toggleLastUpdated: function (event) {
      var checked = $(event.currentTarget).is(':checked');

      this.baseView.trigger('rightPane:input:change', 'last_updated', checked);
    },

    toggleCommentsCount: function (event) {
      var checked = $(event.currentTarget).is(':checked');

      this.baseView.trigger('rightPane:input:change', 'comments_count', checked);
    },

    toggleRevisionsCount: function (event) {
      var checked = $(event.currentTarget).is(':checked');

      this.baseView.trigger('rightPane:input:change', 'revisions_count', checked);
    },

    toggleFooter: function (event) {
      var checked = $(event.currentTarget).is(':checked');

      this.baseView.trigger('rightPane:input:change', 'show_footer', checked);
    },

    onClose: function () {
      this.close();
      setTimeout(_.bind(function () {
        this.trigger('rightPane:toggle', this);
      }, this.baseView), 200);
    },

    beforeRender: function() {
      var view = this.baseView.table;

      if (!view.optionsStructure) {
        return;
      }

      var options = _.result(view, 'getViewOptions');
      var model = new Backbone.Model(options);
      var table = new FakeTableModel(_.result(view, 'optionsStructure'), {parse: true});

      this.editView = new EditView({
        model: model,
        structure: table.columns,
        events: {
          'change input[type=text], select, textarea': _.bind(this.onInputChange, this),
          'change input[type=checkbox]': _.bind(this.onCheckboxChange, this)
        }
      });

      this.insertView('.options', this.editView);
    },

    triggerChange: function (name, value) {
      this.trigger('input:change', name, value);
    },

    onInputChange: function (event) {
      var element = $(event.currentTarget).get(0);

      this.triggerChange(element.name, element.value);
    },

    onCheckboxChange: function (event) {
      var $checkbox = $(event.currentTarget);
      var element = $checkbox.siblings('input[type=hidden]').get(0);

      this.triggerChange(element.name, element.value);
    },

    serialize: function() {
      var collection = this.collection;
      var structure = collection.structure;
      var preferences = collection.preferences;
      var data = collection ? collection.toJSON() : {};
      // TODO: Add getVisibleColumns method to prefereces model
      var visibleColumns = Utils.parseCSV(preferences.get('columns_visible'));
      var selectedSpacing = this.baseView.getSpacing();
      var viewOptions = this.baseView.table.getViewOptions();

      data.spacings = _.map(app.config.get('spacings'), function(value) {
        return {
          name: value,
          selected: value === selectedSpacing
        }
      });

      data.viewOptions = viewOptions;

      data.columns = structure.chain()
        .filter(function(model) {
          return model.attributes.ui != 'section_break' && !model.get('hidden_input');
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
        data.isSupported = this.supportsView(data.id);

        return data;
      }, this));

      data.viewId = this.state.viewId;
      data.isTableView = data.viewId === 'table';

      return data;
    },

    supportsView: function(viewId) {
      var view = ListViewManager.get(viewId);
      var supported = true;

      if (view.dataTypes) {
        supported = this.viewSupport(view.dataTypes, 'type');
      }

      if (view.uiNames) {
        supported = this.viewSupport(view.uiNames, 'ui');
      }

      return  supported;
    },

    viewSupport: function (list, name) {
      var collection = this.collection;
      var structure = collection.structure;

      if (!collection || !structure) {
        return false;
      }

      return !list || _.some(list, function(type) {
        var hasType = false;
        structure.each(function(column) {
          if (type.toLowerCase() == (column.get(name) || '').toLocaleLowerCase()) {
            hasType = true;
          }
        });

        return hasType;
      });
    },

    initialize: function(options) {
      this.state = {
        viewId: options.listView || 'table'
      };

      this.baseView.on('view:changed', function (viewId) {
        this.$('.tiles .tile.active').removeClass('active');
        this.$('#' + viewId + '-view').addClass('active');
      }, this);

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
