define(['helpers/ui'], function(UIHelper) {
  describe('UI Helpers', function() {
    it('supports time', function() {
      expect(UIHelper.supportsTime('TIME')).toBe(true);
      expect(UIHelper.supportsTime('time')).toBe(false);
      expect(UIHelper.supportsTime('DATETIME')).toBe(true);
      expect(UIHelper.supportsTime('TIMESTAMP')).toBe(true);
      expect(UIHelper.supportsTime('DATE')).toBe(false);
    });

    it('supports date', function() {
      expect(UIHelper.supportsDate('DATE')).toBe(true);
      expect(UIHelper.supportsDate('date')).toBe(false);
      expect(UIHelper.supportsDate('TIME')).toBe(false);
      expect(UIHelper.supportsDate('DATETIME')).toBe(true);
      expect(UIHelper.supportsDate('TIMESTAMP')).toBe(true);
    });

    it('supports number', function() {
      expect(UIHelper.supportsNumeric('INT'));
      expect(UIHelper.supportsNumeric('BIT'));
      expect(UIHelper.supportsNumeric('NUMERIC'));
      expect(UIHelper.supportsNumeric('TINYINT'));
      expect(UIHelper.supportsNumeric('MEDIUMINT'));
      expect(UIHelper.supportsNumeric('BIGINT'));
      expect(UIHelper.supportsNumeric('DECIMAL'));
      expect(UIHelper.supportsNumeric('DOUBLE'));
      expect(UIHelper.supportsNumeric('FLOAT'));
      expect(UIHelper.supportsNumeric('SMALLINT'));
    });
  });
});
