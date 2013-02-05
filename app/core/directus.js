define([
  "app",
  "core/collection.entries",
  "core/collection.columns",
  "core/collection",
  "core/edit",
  "core/table",
  "core/modal",
  "core/tableSimple"
],

function(app, Entries, Structure, Collection, Edit, Table, Modal, TableSimple) {

  app.Directus = {};

  app.Directus.Collection = Collection;
  app.Directus.Entries = Entries;
  app.Directus.CollectionColumns = Structure.Columns;
  app.Directus.EditView = Edit;
  app.Directus.Table = Table;
  app.Directus.Modal = Modal;
  app.Directus.TableSimple = TableSimple;
  app.Directus.Structure = Structure;

  return app.Directus;
});