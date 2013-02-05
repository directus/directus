define([
  "app",
  "core/collection.upload",
  "core/collection.entries",
  "core/collection.columns",
  "core/collection",
  "core/edit",
  "core/table",
  "core/modal",
  "core/tableSimple",
  "core/collection.settings"
],

function(app, Media, Entries, Structure, Collection, Edit, Table, Modal, TableSimple, Settings) {

  app.Directus = {};

  app.Directus.Media = Media;
  app.Directus.Collection = Collection;
  app.Directus.Entries = Entries;
  app.Directus.CollectionColumns = Structure.Columns;
  app.Directus.EditView = Edit;
  app.Directus.Table = Table;
  app.Directus.Modal = Modal;
  app.Directus.TableSimple = TableSimple;
  app.Directus.Structure = Structure;
  app.Directus.Settings = Settings;

  return app.Directus;
});