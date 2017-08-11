define(function(require, exports, module) {

  "use strict";

  var app = require('app');

  function parseSelectOptions(list, callback) {
    if (!list) {
      return null;
    }

    var result = {};
    for (var key in list) {
      if (list.hasOwnProperty(key)) {
        callback(key, list, list[key], result);
      }
    }

    return JSON.stringify(result);
  }

  module.exports = {
    getUsers: function (locales, timezones, countries) {
      // var statusName = app.statusMapping.get('directus_users').get('status_name');
      var defaultTimezone = app.timezone;
      var defaultLocale = app.locale;

      return {
        "id":"directus_users",
        "table_name":"directus_users",
        "title":"Users",
        "hidden":true,
        "single":false,
        "footer": 1,
        "count":0,
        "active":0,
        "primary_column": "id",
        "status_column": "status",
        "user_create_column": "id",
        "user_update_column": "id",
        "url": "api/1/tables/directus_users/",
        "columns": [
          {
            "id":"id",
            "column_name":"id",
            "type":"TINYINT",
            "nullable": false,
            "comment":"",
            "sort":0,
            "system":true,
            "hidden_input":true,
            "required":false,
            "ui":"primary_key",
            "key": "PRI",
            "extra": "auto_increment",
            "hidden":true
          },
          {
            "id": "status",
            "column_name": "status",
            "type":"TINYINT",
            "nullable": false,
            "default_value":"1",
            "comment":"",
            "sort":1,
            "system":true,
            "hidden_input": true,
            "required":false,
            "ui":"status",
            "hidden":true
          },
          {
            "column_name":"avatar_file_id",
            "sort":2,
            "type":"INT",
            "nullable": true,
            "comment":"",
            "ui":"single_file",
            "system":false,
            "hidden_input":false,
            "required":false,
            "column_type":"int(11)",
            "column_key":"",
            "is_writable":true,
            "id":"avatar_file_id",
            "options":{
              "id":"single_file",
              "allowed_filetypes":"image\/*"
            },
            "relationship_type": "MANYTOONE",
            "related_table": "directus_files",
            "junction_key_right": "avatar_file_id"
          },
          {
            "id":"avatar",
            "column_name":"avatar",
            "type":"VARCHAR",
            "nullable": true,
            "comment":"",
            "sort":2,
            "system":false,
            "hidden_input":true,
            "required":false,
            "ui":"directus_user_avatar"
          },
          {
            "id":"name",
            "column_name":"name",
            "type":"ALIAS",
            "sort":3,
            "nullable": false,
            "ui":"directus_user",
            "system":false,
            "omit_input": true,
            "hidden_input": true,
            "required":false,
            "options": {
              "format": "full"
            }
          },
          {
            "id":"first_name",
            "column_name":"first_name",
            "type":"VARCHAR",
            "char_length":"50",
            "nullable": true,
            "default_value":"",
            "comment":"",
            "sort":3,
            "system":false,
            "hidden_input":false,
            "required": false,
            "ui":"text_input",
            "options": {
              "size": "medium"
            }
          },
          {
            "id":"last_name",
            "column_name":"last_name",
            "type":"VARCHAR",
            "char_length":"50",
            "nullable": true,
            "default_value":"",
            "comment":"",
            "sort":4,
            "system":false,
            "hidden_input":false,
            "required": false,
            "ui":"text_input",
            "options": {
              "size": "medium"
            }
          },
          {
            "id":"email",
            "column_name":"email",
            "type":"VARCHAR",
            "char_length":"255",
            "nullable": false,
            "comment":"",
            "sort":5,
            "ui":"text_input",
            "system":false,
            "hidden_input":false,
            "required":true,
            "options": {
              "size": "medium"
            }
          },
          {
            "id":"password",
            "column_name":"password",
            "type":"VARCHAR",
            "char_length":"255",
            "nullable": false,
            "default_value":"",
            "comment":"Passwords are encrypted, if forgotten they must be reset",
            "sort":6,
            "system":false,
            "hidden_input":false,
            "required":true,
            "ui":"password",
            "options": {
              "salt_field":"salt"
            }
          },
          {
            "id":"salt",
            "column_name":"salt",
            "type":"VARCHAR",
            "char_length":"255",
            "nullable": false,
            "default_value":"",
            "comment":"",
            "sort":7,
            "system":true,
            "hidden_input":true,
            "required":true,
            "ui":"text_input"
          },
          {
            "id":"group",
            "column_name":"group",
            "type":"INT",
            "nullable": false,
            "comment":"Determines this user's access",
            "sort":8,
            "system":false,
            "hidden_input":false,
            "required":true,
            "is_writable": true,
            "column_type": "int(11)",
            "column_key": "",
            "ui":"many_to_one",
            "options": {
              "id": "many_to_one",
              "related_table": "directus_groups",
              "visible_column": "name",
              "allow_null": 0,
              "visible_column_template": "{{name}}"
            },
            "relationship_type":"MANYTOONE",
            "related_table":"directus_groups",
            "junction_key_right":"group_id"
          },
          {
            "id":"language",
            "column_name":"language",
            "type":"VARCHAR",
            "char_length":"8",
            "nullable": true,
            "default_value": defaultLocale,
            "comment":"",
            "sort":9,
            "ui":"dropdown",
            "system":false,
            "hidden_input":false,
            "required": false,
            "options": {
              "allow_null": false,
              "options": parseSelectOptions(locales, function (key, list, locale, result) {
                result[locale.code] = locale.name;
              })
            }
          },
          {
            "id":"timezone",
            "column_name":"timezone",
            "type":"VARCHAR",
            "char_length":"32",
            "nullable": true,
            "default_value": defaultTimezone,
            "comment":"",
            "sort":10,
            "ui":"dropdown",
            "system":false,
            "hidden_input":false,
            "required": false,
            "options": {
              "allow_null": false,
              "options": parseSelectOptions(timezones, function(key, list, name, result) {
                result[key] = name;
              })
            }
          },
          {
            "id":"position",
            "column_name":"position",
            "type":"VARCHAR",
            "char_length":"255",
            "nullable": true,
            "default_value":"",
            "comment":"",
            "sort":11,
            "ui":"text_input",
            "system":false,
            "hidden_input":false,
            "required":false,
            "options": {
              "size": "medium"
            }
          },
          {
            "id":"phone",
            "column_name":"phone",
            "type":"VARCHAR",
            "char_length":"255",
            "nullable": true,
            "default_value":"",
            "comment":"",
            "sort":12,
            "ui":"text_input",
            "system":false,
            "hidden_input":false,
            "required":false,
            "options": {
              "size": "medium"
            }
          },
          {
            "id":"location",
            "column_name":"location",
            "type":"VARCHAR",
            "char_length":"255",
            "nullable": true,
            "default_value":"",
            "comment":"",
            "sort":13,
            "ui":"text_input",
            "system":false,
            "hidden_input":false,
            "required":false,
            "options": {
              "size": "medium"
            }
          },
          {
            "id":"address",
            "column_name":"address",
            "type":"VARCHAR",
            "char_length":"255",
            "nullable": true,
            "default_value":"",
            "comment":"",
            "sort":14,
            "ui":"text_input",
            "system":false,
            "hidden_input":false,
            "required":false,
            "options": {
              "size": "medium"
            }
          },
          {
            "id":"city",
            "column_name":"city",
            "type":"VARCHAR",
            "char_length":"255",
            "nullable": true,
            "default_value":"",
            "comment":"",
            "sort":15,
            "ui":"text_input",
            "system":false,
            "hidden_input":false,
            "required":false,
            "options": {
              "size": "medium"
            }
          },
          {
            "id":"state",
            "column_name":"state",
            "type":"VARCHAR",
            "char_length":"2",
            "nullable": true,
            "default_value":"",
            "comment":"",
            "sort":16,
            "ui":"text_input",
            "system":false,
            "hidden_input":false,
            "required":false,
            "options": {
              "size": "small"
            }
          },
          {
            "id":"zip",
            "column_name":"zip",
            "type":"VARCHAR",
            "char_length":"10",
            "nullable": true,
            "default_value":"",
            "comment":"",
            "sort":17,
            "ui":"text_input",
            "system":false,
            "hidden_input":false,
            "required":false,
            "options": {
              "size": "small"
            }
          },
          {
            "id": "country",
            "column_name": "country",
            "type": "VARCHAR",
            "char_length": "2",
            "nullable": true,
            "default_value": null,
            "comment":"",
            "sort":18,
            "ui":"dropdown",
            "system":false,
            "hidden_input":false,
            "required":false,
            "options": {
              "allow_null": true,
              "options": parseSelectOptions(countries, function(key, list, name, result) {
                result[key] = name;
              })
            }
          },
          {
            "id":"email_messages",
            "column_name":"email_messages",
            "type":"TINYINT",
            "nullable": true,
            "default_value":"1",
            "comment":"CMS messages will also be sent to email address above",
            "sort":19,
            "system":false,
            "hidden_input":false,
            "required":false,
            "ui":"toggle"
          },
          {
            "id":"token",
            "column_name":"token",
            "type":"VARCHAR",
            "char_length":"255",
            "comment":"This is your user's API authentication token. Keep it safe!",
            "sort":20,
            "system":false,
            "hidden_input":false,
            "required": false,
            "nullable": true,
            "ui":"random",
            "options": {
              "auto_generate": false,
              "allow_any_value": true
            }
          },
          {
            "id":"access_token",
            "column_name":"access_token",
            "type":"VARCHAR",
            "char_length":"255",
            "nullable": true,
            "default_value":"",
            "comment":"",
            "sort":21,
            "system":true,
            "hidden_input":true,
            "required":false,
            "ui":"text_input"
          },
          {
            "id":"reset_token",
            "column_name":"reset_token",
            "type":"VARCHAR",
            "char_length":"255",
            "nullable": true,
            "default_value":"",
            "comment":"",
            "sort":22,
            "system":true,
            "hidden_input":true,
            "required":false,
            "ui":"text_input"
          },
          {
            "id":"reset_expiration",
            "column_name":"reset_expiration",
            "type":"DATETIME",
            "nullable": true,
            "comment":"",
            "sort":23,
            "system":true,
            "hidden_input":true,
            "required":false,
            "ui":"datetime"
          },
          {
            "id":"last_access",
            "column_name":"last_access",
            "type":"DATETIME",
            "nullable": true,
            "default_value":"0000-00-00 00:00:00",
            "comment":"",
            "sort":24,
            "system":false,
            "hidden_input":true,
            "required":false,
            "ui":"datetime"
          },
          {
            "id":"last_login",
            "column_name":"last_login",
            "type":"DATETIME",
            "nullable": true,
            "default_value":"0000-00-00 00:00:00",
            "comment":"",
            "sort":25,
            "system":false,
            "hidden_input": false,
            "required":false,
            "ui":"datetime",
            "options": {
              "contextual_date_in_listview": true
            }
          },
          {
            "id":"last_page",
            "column_name":"last_page",
            "type":"VARCHAR",
            "char_length":"255",
            "nullable": true,
            "default_value":"",
            "comment":"",
            "sort":26,
            "system":false,
            "hidden_input":true,
            "required":false,
            "ui":"text_input"
          },
          {
            "id":"ip",
            "column_name":"ip",
            "type":"VARCHAR",
            "char_length":"50",
            "nullable": true,
            "default_value":"",
            "comment":"",
            "sort":27,
            "system":true,
            "hidden_input":true,
            "required":false,
            "ui":"text_input"
          },
          {
            "id": "invite_token",
            "column_name": "invite_token",
            "type": "VARCHAR",
            "ui": "text_input",
            "nullable": true,
            "omit_input": true
          },
          {
            "id": "invite_date",
            "column_name": "invite_date",
            "type": "DATETIME",
            "ui": "datetime",
            "nullable": true,
            "omit_input": true
          },
          {
            "id": "invite_sender",
            "column_name": "invite_sender",
            "type": "INT",
            "ui": "numeric",
            "nullable": true,
            "omit_input": true
          },
          {
            "id": "invite_accepted",
            "column_name": "invite_accepted",
            "type": "TINYINT",
            "ui": "toggle",
            "nullable": true,
            "omit_input": true
          }
        ]
      };
    }
  };

});
