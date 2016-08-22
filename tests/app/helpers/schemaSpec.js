define(['helpers/schema'], function(helper) {
  describe('Schema Helpers', function() {
    it('clean column names', function() {
      expect(helper.cleanColumnName('column name here')).toBe('column_name_here');
      expect(helper.cleanColumnName('column name$here')).toBe('column_name_here');
      expect(helper.cleanColumnName('column  name $here')).toBe('column_name_here');
      expect(helper.cleanColumnName('column ')).toBe('column_');
      expect(helper.cleanColumnName('column 3')).toBe('column_3');
      expect(helper.cleanColumnName('3column')).toBe('column');
    });

    it('clean table names', function() {
      expect(helper.cleanTableName('table name here')).toBe('table_name_here');
      expect(helper.cleanTableName('table name$here')).toBe('table_name_here');
      expect(helper.cleanTableName('table  name $here')).toBe('table_name_here');
      expect(helper.cleanTableName('table ')).toBe('table_');
      expect(helper.cleanTableName('table 3')).toBe('table_3');
    });
  });
});
