define(function(require) {

  "use strict";

  var ManyToMany = require('core-ui/many_to_many');

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


  });

});
