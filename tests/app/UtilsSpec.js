define(['utils'], function(Utils) {
  describe('Utils test', function() {
    it('Should get a location', function() {
      var url = 'https://directus.io';
      var location = Utils.getLocation(url);

      expect(location.href).toBeDefined();
    });

    it('Should get params', function() {
      var url = 'https://directus.io/?lang=en&redirect=1';
      var params = Utils.getParams(url);

      expect(params.length).toBe(2);
    });

    it('Should add new params', function() {
      var url = 'https://directus.io/';

      var newURL = Utils.addParam(url, 'lang', 'es');
      expect(newURL).toBe(url+'?lang=es');

      newURL = Utils.addParam(newURL, 'lang', 'en');
      expect(newURL).toBe(url+'?lang=en');

      newURL = Utils.addParam(newURL, 'redirect', '1');
      expect(newURL).toBe(url+'?lang=en&redirect=1');

      newURL = Utils.addParam(newURL, 'first name', 'john');
      expect(newURL).toBe(url+'?lang=en&redirect=1&first%20name=john');

      newURL = Utils.addParam(newURL, 'first name', 'jane');
      expect(newURL).toBe(url+'?lang=en&redirect=1&first%20name=jane');

      expect(Utils.addParam(url, 'query', '%QUERY', true, false)).toBe(url+'?query=%QUERY');
    });

    it('should return boolean', function() {
      expect(Utils.convertToBoolean(true)).toBe(true);
      expect(Utils.convertToBoolean(false)).toBe(false);
      expect(Utils.convertToBoolean(1)).toBe(true);
      expect(Utils.convertToBoolean(0)).toBe(false);
      expect(Utils.convertToBoolean('1')).toBe(true);
      expect(Utils.convertToBoolean('0')).toBe(false);
      expect(Utils.convertToBoolean('text')).toBe(true);
    });
  });
});
