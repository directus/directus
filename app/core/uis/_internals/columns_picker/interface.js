define([
  'app',
  'core/UIComponent',
  'core/UIView',
  'helpers/schema'
], function(app, UIComponent, UIView, SchemaHelper) {

  'use strict';

  var Input = UIView.extend({
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
      }

      return columns;
    },

    serialize: function () {
      var columns = this.getColumns();

      columns = columns.map(function (model) {
        return {
          name: model.get('column_name')
        };
      });

      return {
        columns: columns
      }
    },

    initialize: function (options) {
      this.options.tableName = options.model.id;
      this.options.tableStructure = app.schemaManager.getTable(this.options.tableName);
    }
  });

  var Component = UIComponent.extend({
    id: 'directus_columns_picker',

    Input: Input
  });

  return Component;
});
