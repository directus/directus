define([
  './interface',
  'core/interfaces/one_to_many/component'
], function (Input, OneToMany) {
  return OneToMany.extend({
    id: 'directus_users',
    Input: Input
  });
});
