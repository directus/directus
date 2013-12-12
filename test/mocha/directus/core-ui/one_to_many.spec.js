define(function(require) {

  "use strict";

  var OneToMany = require('core-ui/one_to_many'),
      SchemaManager = require("schema/SchemaManager"),
      EntriesModel = require("core/entries/EntriesModel"),
      albumData = JSON.parse(require('text!test/assets/data/artists_rows_1.json'));

  var table = SchemaManager.getTable('artists');

  var artist = new EntriesModel(albumData, {
    structure: table.columns,
    table: table,
    parse: true
  });

  var options = {

    // Instance of EntriesModel (required)
    model: artist,

    // Attribute on the EntriesModel (required)
    name: 'albums'
  }

  describe("core-ui/one_to_many", function() {

    it("should exist", function() {
      expect(OneToMany).to.exist;
    });

    it("should have list, Input", function() {
      expect(OneToMany).to.have.property('list');
      expect(OneToMany).to.have.property('Input');
      expect(OneToMany.list).to.be.a('function');
      expect(OneToMany.Input).to.be.a('function');
    });

    describe("#Input", function() {

      var view = new OneToMany.Input(options);

      describe("#render()", function() {

        view.render();

        it("should contain a nested table with 3 rows", function() {
          expect(view.$el).to.have('table');
          expect(view.$('tr').length).to.be(3);
        });

        it("should be labeled Performers", function() {
          expect(view.$el).to.have('label');
        });

        it("should have tablebody with 2 rows", function() {
          expect(view.$el).to.have('tbody');
        });

        it("should have 3 columns", function() {
          expect(view.$('tbody > tr:first-child').children().length).to.be(3);
        });

      });

    });

  });

});