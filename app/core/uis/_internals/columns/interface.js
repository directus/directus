define([
  'app',
  'core/UIComponent',
  'core/UIView',
  'helpers/schema'
], function(app, UIComponent, UIView, SchemaHelper) {

  'use strict';

  var Input = UIView.extend({
    // @TODO: Also make checkboxes available
    template: '_internals/columns/dropdown',

    serialize: function () {
      var columns = this.options.tableStructure.columns;

      if (this.options.settings.get('filter') === 'number') {
        columns = SchemaHelper.numericColumns(columns);
      }

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
    id: 'directus_columns',

    Input: Input
  });

  return Component;
});
