define([
  'core/interfaces/_internals/directus_users/interface',
  'core/interfaces/one_to_many/component'
], function (Input, OneToMany) {
  'use strict';

  return OneToMany.extend({
    id: 'directus_users',
    Input: Input
  });
});
