define(function(require) {

  "use strict";

  var SchemaManager = require("schema/SchemaManager"),
      EntriesModel = require("core/entries/EntriesModel"),
      albumData = JSON.parse(require('text!test/assets/data/albums_rows_1.json'));

  var table = SchemaManager.getTable('albums');

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

    describe("#getNewInstance()", function() {
      it('should return an empty instance of the model', function() {
        var newAlbums = albums.getNewInstance();
        expect(albums.structure).to.equal(newAlbums.structure);
      });
    });

    describe("#toJSON()", function() {

      it('should contain nested properties', function() {
        var serialized = albums.toJSON();
        expect(serialized.performers).to.be.an('array');
        expect(serialized.artist).to.be.an('object');
      });

      it('should be able to return only properties that have been changed', function() {
        var serialized = albums.toJSON({changed: true});
        expect(serialized).to.not.have.ownProperty('title');
        albums.set('title', 'test');
        serialized = albums.toJSON({changed: true});
        expect(serialized).to.have.ownProperty('title');
      });

    });


  });

});