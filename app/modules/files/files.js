define([
  'app',
  'modules/files/views/EditFilesView',
  'modules/files/views/FilesTableView'
],

function(app, EditFilesView, FilesTableView) {

  "use strict";

  var files = app.module();

  files.Views.Edit = EditFilesView;
  files.Views.List = FilesTableView;

  return files;
});