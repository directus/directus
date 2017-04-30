define([
  "app",
  "core/entries/EntriesCollection",
  "core/entries/EntriesModel",
  "core/entries/EntriesJunctionCollection",
  "core/collection",
  "core/edit",
  "core/table/table.view",
  "core/Modal",
  "core/tableSimple"
],

function(app, EntriesCollection, EntriesModel, EntriesNestedCollection, Collection, Edit, Table, Modal, TableSimple) {

  "use strict";

  var Directus = {};

  //Directus.Files = Entries.FilesCollection;
  Directus.Collection = Collection;
  Directus.EntriesCollection = EntriesCollection;
  Directus.EditView = Edit;
  Directus.Table = Table;
  Directus.Modal = Modal;
  Directus.TableSimple = TableSimple;
  Directus.Model = EntriesModel;
  //Directus.FilesCollection = Structure.FilesCollection;

  Directus.SubRoute = Backbone.Router.extend({
    constructor: function(prefix) {
      var routes = {};

      // Prefix is optional, set to empty string if not passed
      prefix = prefix || "";

      // Allow for optionally omitting trailing /.  Since base routes do not
      // trigger with a trailing / this is actually kind of important =)
      if (prefix[prefix.length-1] === "/") {
        prefix = prefix.slice(0, prefix.length-1);
      }

      // Every route needs to be prefixed
      _.each(this.routes, function(callback, path) {
        if (path) {
          routes[prefix + path] = callback;
          return routes[prefix + path];
        }

        // If the path is "" just set to prefix, this is to comply
        // with how Backbone expects base paths to look gallery vs gallery/
        routes[prefix] = callback;
      });

      // Must override with prefixed routes
      this.routes = routes;

      // Required to have Backbone set up routes
      Backbone.Router.prototype.constructor.call(this);
    }
  });

  return Directus;
});
