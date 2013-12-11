define(function(require) {

  "use strict";

  var OneToMany = require('core-ui/one_to_many');

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

  });

});