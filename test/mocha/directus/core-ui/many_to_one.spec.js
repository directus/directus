define(function(require) {

  "use strict";

  var ManyToOne = require('core-ui/many_to_one');

  describe("core-ui/many_to_one", function() {

    it("should exist", function() {
      expect(ManyToOne).to.exist;
    });

    describe("#Input", function() {

      it("should exist", function() {
        expect(ManyToOne).to.have.property('Input');
        expect(ManyToOne.Input).to.be.a('function');
      });

      var options = {

        // Instance of EntriesModel (required)
        model: null,

        // Attribute on the EntriesModel (required)
        name: null,

        // ColumnsCollections
        structure: null,

        // ColumnModel
        schema: null,

        // Value of the model/attribute
        value: null,

        // The model's collection
        collection: null,

        // Based on privleges, boolean
        canWrite: null,

        // UI Settings
        settings: null
      }

      /*var view = new ManyToOne.Input({

      });*/

    });

  });

});
