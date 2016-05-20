define(['typetools'], function(typetools) {
  describe("Typetool testing", function() {
    it("should return number with commas", function() {
      expect(typetools.numberWithCommas(0)).toBe('0');
      expect(typetools.numberWithCommas(10)).toBe('10');
      expect(typetools.numberWithCommas(100)).toBe('100');
      expect(typetools.numberWithCommas(10000)).toBe('10,000');
      expect(typetools.numberWithCommas(100000)).toBe('100,000');
      expect(typetools.numberWithCommas(1000000)).toBe('1,000,000');
      expect(typetools.numberWithCommas(10000000)).toBe('10,000,000');
    });
  });
});
