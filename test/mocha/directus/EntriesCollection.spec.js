define(function(require) {

  "use strict";

  var EntriesCollection = require("core/entries/EntriesCollection");

  describe("EntriesCollection", function() {

    it("should exist", function() {
      expect(EntriesCollection).to.exist;
      expect(new EntriesCollection()).to.be.an.instanceof(EntriesCollection);
    });

  });

});
