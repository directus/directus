define(function(require) {

  "use strict";

  var ColumnsCollection = require("schema/ColumnsCollection");
  var userSchema = require("schema/fixed/users");

  describe("ColumnsCollection", function() {

    it("should exist", function() {
      expect(ColumnsCollection).to.exist;
      expect(new ColumnsCollection(userSchema.columns)).to.be.an.instanceof(ColumnsCollection);
    });

  });

});
