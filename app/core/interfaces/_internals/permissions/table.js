define([
  'app',
  'underscore',
  'backbone',
  'core/t',
  'core/Modal',
  './table-row'
], function (app, _, Backbone, __t, ModalView, TableRow) {
  'use strict';

  return Backbone.Layout.extend({
    prefix: 'app/core/interfaces/_internals/permissions/',

    template: 'table',

    addRowView: function (model, render) {
      var view = this.insertView('tbody', new TableRow({
        table: model,
        group: this.model,
        collection: this.collection
      }));

      this.tables[model.id] = model;

      if (render !== false) {
        view.render();
      }
    },

    toggleSystemTables: function () {
      this.showSystemTables = !this.showSystemTables;
      this.render();
    },

    beforeRender: function () {
      app.schemaManager.getTables().each(function (tableModel) {
        if (this.showSystemTables !== true && tableModel.isSystemTable()) {
          return false;
        }

        // Omit tables without permission record (not managed)
        if (!app.schemaManager.getPrivileges(tableModel.id)) {
          return false;
        }

        this.addRowView(tableModel, false);
      }, this);
    },

    initialize: function () {
      this.tables = {};
      this.showSystemTables = false;
    }
  });
});
