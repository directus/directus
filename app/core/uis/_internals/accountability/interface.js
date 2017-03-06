define(['app', 'core/UIComponent', 'core/UIView', 'helpers/schema'], function(app, UIComponent, UIView, SchemaHelper) {

  'use strict';

  var Input = UIView.extend({
    template: '_internals/accountability/interface',

    serialize: function () {
      var structure = this.options.tableStructure;
      var dateColumns, numericColumns;

      dateColumns = SchemaHelper.dateColumns(structure.columns, true).map(function (column) {
        return column.toJSON();
      });

      numericColumns = SchemaHelper.numericColumns(structure.columns, true).map(function (column) {
        return column.toJSON();
      });

      return {
        dateColumns: dateColumns,
        numericColumns: numericColumns
      }
    },

    initialize: function(options) {
      this.options.tableName = options.model.id;
      this.options.tableStructure = app.schemaManager.getTable(this.options.tableName);
    }
  });

  var Component = UIComponent.extend({
    id: 'directus_accountability',

    Input: Input
  });

  return Component;
});
