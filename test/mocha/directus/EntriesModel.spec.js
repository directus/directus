define(function(require) {

  "use strict";

  var SchemaManager = require("schema/SchemaManager"),
      tables = JSON.parse(require("text!test/assets/schema/tables.json")),
      EntriesModel = require("core/entries/EntriesModel"),
      TableModel = require("schema/TableModel"),
      albumData = JSON.parse(require('text!test/assets/data/albums_rows_1.json'));

  SchemaManager.setup({apiURL: 'test'});
  SchemaManager.register('tables', tables);


  var table = SchemaManager.getTable('albums')

  describe("EntriesModel", function() {

    it("should exist", function() {
      expect(EntriesModel).to.exist;
    });

    var albums = new EntriesModel(albumData, {
      structure: table.columns,
      table: table,
      parse: true
    });

    describe("#structure", function() {
      it("should exist", function() {
        expect(albums.structure).to.exist;
      });
    });

    describe("#toJSON()", function() {

    });

  });

});