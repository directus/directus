define(['app', 'core/UIView', 'helpers/schema'], function (app, UIView, SchemaHelper) {
  return UIView.extend({
    // @TODO: Also make checkboxes available
    template: '_internals/columns_picker/dropdown',

    getColumns: function () {
      var columns = this.options.tableStructure.columns;
      var filter = this.options.settings.get('filter');

      switch (filter) {
        case 'number':
          columns = SchemaHelper.numericColumns(columns);
          break;
        case 'primary':
          columns = SchemaHelper.primaryColumns(columns);
          break;
        default:
          break;
      }

      return columns;
    },

    serialize: function () {
      var name = this.options.name;
      var columns = this.getColumns();
      // Primary, status and sort column are default to 'id', 'active' and 'sort'
      // respectively, so if they are not set we check the table model information
      var table = this.options.tableStructure;
      var primaryColumn = this.model.get(name) || table.get(name);

      columns = columns.map(function (model) {
        return {
          isSelected: primaryColumn === model.get('column_name'),
          name: model.get('column_name')
        };
      });

      return {
        name: name,
        columns: columns
      };
    },

    initialize: function (options) {
      this.options.tableName = options.model.id;
      this.options.tableStructure = app.schemaManager.getTable(this.options.tableName);
    }
  });
});
