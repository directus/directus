define(function(require) {

  "use strict";

  describe("Simple tests examples", function() {
    it("should detect true", function() {
      expect(true).to.be.true;
    });

    it("should increments values", function() {
      var mike = 0;

      expect(mike++ === 0).to.be.true;
      expect(mike === 1).to.be.true;
    });

    it("should increments values (improved)", function() {
      var mike = 0;

      expect(mike++).to.equal(0);
      expect(mike).to.equal(1);
    });
  });

  describe("Tests with before/after hooks", function() {
    var a = 0;

    beforeEach(function() {
      a++;
    });

    afterEach(function() {
      a = 0
    });

    it("should increment value", function() {
      expect(a).to.equal(1);
    });

    it("should reset after each test", function() {
      expect(a).to.equal(1);
    });
  });

  describe("Async tests", function() {
    it("should wait timer", function(done) {
      setTimeout(function() {
        expect(true).to.be.true;
        done();
      }, 500);
    });
  });
});
