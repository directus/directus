//  table.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com


define([
  'app',
  'modules/tables/views/BatchEditView',
  'modules/tables/views/EditView',
  'modules/tables/views/TablesView',
  'modules/tables/views/TableView'
],

function(app, BatchEditView, EditView, TablesView, TableView) {

  "use strict";

  var Table = app.module();

  Table.Views = {};

  Table.Views.Tables = TablesView;
  Table.Views.BatchEdit = BatchEditView;
  Table.Views.Edit = EditView;
  Table.Views.List = TableView;

  return Table;

});