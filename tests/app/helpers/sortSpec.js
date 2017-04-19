define(['helpers/sort'], function (helper) {
  describe('Sorting', function() {
    it('should sort array', function () {
      var numbers = [3, 1, 2];
      var strings = ['white', 'yellow', 'ambar'];
      var sensitiveStrings = ['white', 'yellow', 'almond', 'Ambar'];

      numbers.sort(helper.arraySort);
      expect(numbers[0]).toBe(1);
      expect(numbers[1]).toBe(2);
      expect(numbers[2]).toBe(3);


      strings.sort(helper.arraySort);
      expect(strings[0]).toBe('ambar');
      expect(strings[1]).toBe('white');
      expect(strings[2]).toBe('yellow');

      sensitiveStrings.sort(helper.iArraySort);
      expect(sensitiveStrings[0]).toBe('almond');
      expect(sensitiveStrings[1]).toBe('Ambar');
      expect(sensitiveStrings[2]).toBe('white');
      expect(sensitiveStrings[3]).toBe('yellow');
    });
  });
});
