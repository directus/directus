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
        "ui": "primary_key",
        "type": "INT",
        "system": true,
        "hidden_list": false,
        "hidden_input": false,
        "sort": 0
      },
      {
        "id": "name",
        "column_name": "name",
        "ui": "textinput",
        "type": "VARCHAR",
        "length": 64,
        "system": false,
        "hidden_list": false,
        "hidden_input": false,
        "required": true,
        "sort": 10,
        "comment": transComments('name')
      },
      {
        "id": "description",
        "column_name": "description",
        "ui": "textinput",
        "type": "VARCHAR",
        "length": 255,
        "system": false,
        "nullable": true,
        "hidden_list": false,
        "hidden_input": false,
        "sort": 20,
        "comment": transComments('description')
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
        "nullable": true,
        "sort": 30,
        "options": {
          "visible_columns": "table_name",
          "add_button": 1
        },
        "comment": transComments('permissions')
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
        "nullable": true,
        "sort": 40,
        "options": {
          "visible_columns": "name,email,last_login",
          "add_button": 1
        },
        "comment": transComments('users')
      },
      {
        "id": "restrict_to_ip_whitelist",
        "column_name": "restrict_to_ip_whitelist",
        "ui": "textarea",
        "type": "VARCHAR",
        "length": 255,
        "system": false,
        "nullable": true,
        "hidden_list": false,
        "hidden_input": false,
        "sort": 50,
        "options": {
          "placeholder_text": __t('eg_x', {text: '000.000.000.000, 111.111.111.111'}),
          "rows": 3
        },
        "comment": transComments('restrict_to_ip_whitelist')
      },
      {
        "id": "show_files",
        "column_name": "show_files",
        "ui": "checkbox",
        "type": "TINYINT",
        "length": 1,
        "default_value": 1,
        "system": false,
        "hidden_list": false,
        "hidden_input": false,
        "sort": 60
      },
      {
        "id": "show_messages",
        "column_name": "show_messages",
        "ui": "checkbox",
        "type": "TINYINT",
        "length": 1,
        "default_value": 1,
        "system": false,
        "hidden_list": false,
        "hidden_input": false,
        "sort": 70
      },
      {
        "id": "show_users",
        "column_name": "show_users",
        "ui": "checkbox",
        "type": "TINYINT",
        "length": 1,
        "default_value": 1,
        "system": false,
        "hidden_list": false,
        "hidden_input": false,
        "sort": 80
      },
      {
        "id": "nav_override",
        "column_name": "nav_override",
        "type": "TEXT",
        "ui": "textarea",
        "system": false,
        "hidden_list": false,
        "hidden_input": false,
        "nullable": true,
        "comment": transComments('nav_override'),
        "options": {
          placeholder_text: JSON.stringify({
            "Category": {
              "Title 1": "/link-1",
              "Title 2": "/link-2"
            }
          }, null, 2)
        },
        "sort": 90
      },
      {
        "id": "nav_blacklist",
        "column_name": "nav_blacklist",
        "type": "VARCHAR",
        "ui": "textinput",
        "length": 500,
        "system": false,
        "hidden_list": false,
        "hidden_input": false,
        "nullable": true,
        "comment": transComments('nav_blacklist'),
        "sort": 100
      }
    ]
  };
});
