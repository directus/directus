define(function(require) {

  "use strict";

  var ManyToOne = require('core-ui/many_to_one'),
      SchemaManager = require("schema/SchemaManager"),
      EntriesModel = require("core/entries/EntriesModel"),
      albumData = JSON.parse(require('text!test/assets/data/albums_rows_1.json'));

  var table = SchemaManager.getTable('albums');

  var album = new EntriesModel(albumData, {
    structure: table.columns,
    table: table,
    parse: true
  });

  var options = {

    // Instance of EntriesModel (required)
    model: album,

    // Attribute on the EntriesModel (required)
    name: 'artist'
  }

  describe("core-ui/many_to_one", function() {

    it("should exist", function() {
      expect(ManyToOne).to.exist;
    });

    describe("#Input", function() {

      it("should exist", function() {
        expect(ManyToOne).to.have.property('Input');
        expect(ManyToOne.Input).to.be.a('function');
      });

      var ui = new ManyToOne.Input(options);

      /*var view = new ManyToOne.Input({

      });*/

    });

  });

});
;