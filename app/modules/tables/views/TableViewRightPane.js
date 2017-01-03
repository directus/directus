define([
  'core/RightPane',
  'underscore'
], function(RightPane, _) {
  return RightPane.extend({
    template: 'modules/tables/table-right-pane',

    serialize: function() {
      var collection = this.collection;
      var table = collection.table;
      var data = collection ? collection.toJSON() : {};

      data.columns = table.columns ? table.columns.toJSON() : {};

      return data;
    }
  });
});
