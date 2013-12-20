define(function(require) {

  "use strict";

  var ColumnModel = require("schema/ColumnModel");
  var ManyToOneSchema = JSON.parse(require("text!test/assets/schema/ColumnModelManyToOne.json"));

  describe("ColumnModel", function() {

    it("should exist", function() {
      expect(ColumnModel).to.exist;
      expect(new ColumnModel(ManyToOneSchema)).to.be.an.instanceof(ColumnModel);
    });

    var model = new ColumnModel(ManyToOneSchema, {parse: true});

    describe("#relationship", function() {
      it("should exist", function() {
        expect(model.relationship).to.exist;
      });
    });

    describe("#options", function() {
      it("should exist", function() {
        expect(model.options).to.exist;
      });
    });

  });

});
