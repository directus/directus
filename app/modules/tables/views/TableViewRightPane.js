define([
  'app',
  'core/RightPane',
  'underscore'
], function(app, RightPane, _) {

  return RightPane.extend({

    state: {
      open: false
    },

    template: 'modules/tables/table-right-pane',

    events: {
      'click #save_columns': 'updateVisibleColumns',
      'click .js-close': 'close'
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

    close: function() {
      this.state.open = false;
      $('body').removeClass('right-sidebar-open');
      this.trigger('close');
    },

    open: function() {
      this.state.open = true;
      $('body').addClass('right-sidebar-open');
      this.trigger('open');
    },

    isOpen: function() {
      return this.state.open;
    },

    toggle: function() {
      if (this.isOpen()) {
        this.close();
      } else {
        this.open();
      }
    },

    serialize: function() {
      var collection = this.collection;
      var structure = collection.structure;
      var preferences = collection.preferences;
      var data = collection ? collection.toJSON() : {};
      var visibleColumns = preferences.get('columns_visible').split(',');

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

      return data;
    }
  });
});
