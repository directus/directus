define(['app', 'schema/fixed/users'], function(app, schema) {
  var users;

  beforeEach(function() {
    defaultAppOptions(app);
    users = schema.getUsers({en: "English"});
  });

  describe('Users Table', function() {
    it('should have these attributes', function() {
      expect(users.id).toBe('directus_users');
      expect(users.table_name).toBe('directus_users');
      expect(users.title).toBe('Users');
      expect(users.hidden).toBe(true);
      expect(users.single).toBe(false);
      expect(users.footer).toBe(1);
      expect(users.count).toBe(0);
      expect(users.active).toBe(0);
      expect(users.url).toBe('api/1/tables/directus_users/');
    });

    it('should have these columns', function() {
      var columns = users.columns;
      var expectedColumns = [
        'id',
        'status',
        'avatar_file_id',
        'avatar',
        'name',
        'first_name',
        'last_name',
        'email',
        'position',
        'phone',
        'location',
        'address',
        'city',
        'state',
        'zip',
        'country',
        'email_messages',
        'password',
        'salt',
        'token',
        'access_token',
        'reset_token',
        'reset_expiration',
        'last_access',
        'last_login',
        'last_page',
        'ip',
        'group',
        'language',
        'timezone',
        'invite_token',
        'invite_sender',
        'invite_date',
        'invite_accepted'
      ];

      expect(columns.length).toBe(expectedColumns.length);
      columns.forEach(function(column) {
        var index = expectedColumns.indexOf(column.id);
        var result = index >= 0 ? true : false;

        expect(result).toBe(true);
        if (result) {
          expectedColumns.splice(index, 1);
        }
      });

      expect(expectedColumns.length).toBe(0);
    });
  });
});
