define(['app', 'core/UIComponent', 'core/UIView', 'helpers/schema'], function (app, UIComponent, UIView, SchemaHelper) {
  'use strict';

  var Input = UIView.extend({
    template: '_internals/accountability/interface',

    serialize: function () {
      var model = this.model;
      var columns = this.options.tableColumns;
      var dateColumns;
      var numericColumns;
      var dateCreateColumns = [];
      var dateUpdateColumns = [];
      var userCreateColumns = [];
      var userUpdateColumns = [];

      dateColumns = SchemaHelper.dateColumns(columns, true);
      numericColumns = SchemaHelper.numericColumns(columns, true);

      dateColumns.forEach(function (column) {
        var createColumn;
        var updateColumn;

        createColumn = column.toJSON();
        updateColumn = column.toJSON();
        if (model.get('date_create_column') === column.get('column_name')) {
          createColumn.isSelected = true;
        }

        if (model.get('date_update_column') === column.get('column_name')) {
          updateColumn.isSelected = true;
        }

        dateCreateColumns.push(createColumn);
        dateUpdateColumns.push(updateColumn);
      });

      numericColumns.forEach(function (column) {
        var createColumn;
        var updateColumn;

        createColumn = column.toJSON();
        updateColumn = column.toJSON();
        if (model.get('user_create_column') === column.get('column_name')) {
          createColumn.isSelected = true;
        }

        if (model.get('user_update_column') === column.get('column_name')) {
          updateColumn.isSelected = true;
        }

        userCreateColumns.push(createColumn);
        userUpdateColumns.push(updateColumn);
      });

      return {
        dateUpdateColumns: dateUpdateColumns,
        dateCreateColumns: dateCreateColumns,
        userUpdateColumns: userUpdateColumns,
        userCreateColumns: userCreateColumns
      };
    },

    initialize: function (options) {
      this.options.tableName = options.model.id;
      this.options.tableColumns = app.schemaManager.getColumns('tables', this.options.tableName);
      this.listenTo(this.options.tableColumns, 'add remove', this.render);
    }
  });

  var Component = UIComponent.extend({
    id: 'directus_accountability',

    Input: Input
  });

  return Component;
});
