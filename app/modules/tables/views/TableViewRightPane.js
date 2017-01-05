define([
  'core/RightPane',
  'underscore'
], function(RightPane, _) {

  return RightPane.extend({

    template: 'modules/tables/table-right-pane',

    events: {
      'click #save_columns': 'updateVisibleColumns'
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
          var isVisible = _.contains(visibleColumns, model.id);
          var isForeign = _.contains(['MANYTOMANY', 'ONETOMANY'], model.getRelationshipType());

          return {
            id: model.id,
            name: model.get('column_name'),
            visible: isVisible,
            disabled: isForeign,
            isForeign: isForeign
          };
        }, this)
        .value();

      return data;
    }
  });
});
