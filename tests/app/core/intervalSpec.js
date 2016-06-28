define(['core/interval'], function(interval) {
  describe('Interval util', function() {
    var aCallback;
    beforeEach(function() {
      jasmine.clock().install();
      aCallback = jasmine.createSpy("aCallback");
    });

    afterEach(function() {
      jasmine.clock().uninstall();
    });

    it('should call callback', function() {
      interval(aCallback, 100);
      expect(aCallback).not.toHaveBeenCalled();
      jasmine.clock().tick(101);
      expect(aCallback).toHaveBeenCalled();
    });
  });
});
