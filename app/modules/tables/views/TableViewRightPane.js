define([
  'core/RightPane',
  'underscore'
], function(RightPane, _) {
  return RightPane.extend({
    template: 'modules/tables/table-right-pane',

    serialize: function() {
      var model = this.baseView.collection;
      var table = _.findStringKey(this.baseView, 'collection.table');
      var data = model ? model.toJSON() : {};

      data.columns = table.columns ? table.columns.toJSON() : {};

      return data;
    }
  });
});
