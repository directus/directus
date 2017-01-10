define([
  'app',
  'core/RightPane',
  'underscore'
], function(app, RightPane, _) {

  return RightPane.extend({

    template: 'modules/tables/table-right-pane',

    events: {
      'click #save_columns': 'updateVisibleColumns',
      'click .js-close': 'close',
      'change .js-spacing-adjust': 'updateSpacing'
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

      this.baseView.table.setSpacing(spacing);
    },

    serialize: function() {
      var collection = this.collection;
      var structure = collection.structure;
      var preferences = collection.preferences;
      var data = collection ? collection.toJSON() : {};
      var visibleColumns = preferences.get('columns_visible').split(',');
      var selectedSpacing = this.baseView.table.getSpacing();

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

      return data;
    }
  });
});
