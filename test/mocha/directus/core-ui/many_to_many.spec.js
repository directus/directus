define(function(require) {

  "use strict";

  var ManyToMany = require('core-ui/many_to_many'),
      SchemaManager = require("schema/SchemaManager"),
      EntriesModel = require("core/entries/EntriesModel"),
      artistData = JSON.parse(require('text!test/assets/data/artists_rows_1.json'));

  var table = SchemaManager.getTable('artists');

  var artist = new EntriesModel(artistData, {
    structure: table.columns,
    table: table,
    parse: true
  });

  var options = {
    model: artist,
    name: 'albums_performer'
  }

  describe("core-ui/many_to_many", function() {

    it("should exist", function() {
      expect(ManyToMany).to.exist;
    });

    it("should have list, Input", function() {
      expect(ManyToMany).to.have.property('list');
      expect(ManyToMany).to.have.property('Input');
      expect(ManyToMany.list).to.be.a('function');
      expect(ManyToMany.Input).to.be.a('function');
    });

    var view = new ManyToMany.Input(options);

  });

});
