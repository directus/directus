define(function(require, exports, module) {

  'use strict';

  var __t = require('core/t');
  var transComments = function (key) {
    return __t('directus_groups_' + key + '_comment');
  };

  module.exports = {

    "id": "directus_groups",
    "table_name": "directus_groups",
    "hidden": true,
    "single": false,
    "url": "api/1/groups",

    "columns": [
      {
        "id": "id",
        "column_name": "id",
        "ui": "numeric",
        "type": "INT",
        "system": true,
        "hidden_list": false,
        "hidden_input": false,
        "sort": 0
      },
      {
        "id": "name",
        "column_name": "name",
        "ui": "numeric",
        "type": "VARCHAR",
        "system": false,
        "hidden_list": false,
        "hidden_input": true, // @TODO: only on edit
        "sort": 10,
        "comment": transComments('name')
      },
      {
        "id": "description",
        "column_name": "description",
        "ui": "textarea",
        "type": "VARCHAR",
        "length": 255,
        "system": false,
        "hidden_list": false,
        "hidden_input": false,
        "sort": 20,
        "comment": transComments('description')
      },
      {
        "id": "restrict_to_ip_whitelist",
        "column_name": "restrict_to_ip_whitelist",
        "ui": "textarea",
        "type": "VARCHAR",
        "length": 255,
        "system": false,
        "hidden_list": false,
        "hidden_input": false,
        "sort": 30,
        "comment": transComments('restrict_to_ip_whitelist')
      },
      {
        "id": "show_files",
        "column_name": "show_files",
        "ui": "checkbox",
        "type": "TINYINT",
        "length": 1,
        "system": false,
        "hidden_list": false,
        "hidden_input": false,
        "sort": 40
      },
      {
        "id": "show_messages",
        "column_name": "show_messages",
        "ui": "checkbox",
        "type": "TINYINT",
        "length": 1,
        "system": false,
        "hidden_list": false,
        "hidden_input": false,
        "sort": 50
      },
      {
        "id": "show_users",
        "column_name": "show_users",
        "ui": "checkbox",
        "type": "TINYINT",
        "length": 1,
        "system": false,
        "hidden_list": false,
        "hidden_input": false,
        "sort": 60
      },
      {
        "id": "users",
        "column_name": "users",
        "type": "ALIAS",
        "ui": "directus_users",
        "relationship_type": "ONETOMANY",
        "related_table": "directus_users",
        "junction_key_right": "group",
        "default_value": null,
        "required": false,
        "system": false,
        "hidden_list": false,
        "hidden_input": false,
        "sort": 70,
        "options": {
          "visible_columns": "avatar_file_id,first_name,email,last_login",
          "add_button": 1
        },
        "comment": transComments('users')
      },
      {
        "id": "permissions",
        "column_name": "permissions",
        "type": "ALIAS",
        "ui": "directus_permissions",
        "relationship_type": "ONETOMANY",
        "related_table": "directus_privileges",
        "junction_key_right": "group_id",
        "default_value": null,
        "required": false,
        "system": false,
        "hidden_list": false,
        "hidden_input": false,
        "sort": 70,
        "options": {
          "visible_columns": "table_name",
          "add_button": 1
        },
        "comment": transComments('permissions')
      }
    ]
  };
});
