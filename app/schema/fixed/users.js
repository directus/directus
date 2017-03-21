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
    getUsers: function(locales, timezones) {
      var statusName = app.statusMapping.status_name;
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
        "user_create_column": "id",
        "user_update_column": "id",
        statusName:0,
        "url": "api/1/tables/directus_users/",
        "columns": [
          {
            "id":"id",
            "column_name":"id",
            "type":"TINYINT",
            "is_nullable":"NO",
            "comment":"",
            "sort":0,
            "system":true,
            "hidden_list":false,
            "hidden_input":true,
            "required":false,
            "ui":"checkbox",
            "hidden":true
          },
          {
            "id":statusName,
            "column_name":statusName,
            "type":"TINYINT",
            "is_nullable":"NO",
            "default_value":"1",
            "comment":"",
            "sort":1,
            "system":true,
            "hidden_list":false,
            "hidden_input":false,
            "required":false,
            "ui":"checkbox",
            "hidden":true
          },
          {
            "column_name":"avatar_file_id",
            "sort":2,
            "type":"INT",
            "is_nullable":"YES",
            "comment":"",
            "ui":"single_file",
            "system":false,
            "hidden_list":false,
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
            "relationship":{
              "type":"MANYTOONE",
              "related_table":"directus_files",
              "junction_key_right":"avatar_file_id"
            }
          },
          {
            "id":"avatar",
            "column_name":"avatar",
            "type":"VARCHAR",
            "is_nullable":"YES",
            "comment":"",
            "sort":2,
            "system":false,
            "hidden_list":false,
            "hidden_input":true,
            "required":false,
            "ui":"directus_user_avatar"
          },
          {
            "id":"name",
            "column_name":"first_name",
            "type":"ALIAS",
            "sort":3,
            "is_nullable":"NO",
            "ui":"directus_user",
            "system":false,
            "hidden_list":true,
            "hidden_input":true,
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
            "is_nullable":"NO",
            "default_value":"",
            "comment":"",
            "sort":3,
            "system":false,
            "hidden_list":false,
            "hidden_input":false,
            "required":true,
            "ui":"textinput",
            "options": {
              "size": "medium"
            }
          },
          {
            "id":"last_name",
            "column_name":"last_name",
            "type":"VARCHAR",
            "char_length":"50",
            "is_nullable":"NO",
            "default_value":"",
            "comment":"",
            "sort":5,
            "system":false,
            "hidden_list":false,
            "hidden_input":false,
            "required":true,
            "ui":"textinput",
            "options": {
              "size": "medium"
            }
          },
          {
            "id":"email",
            "column_name":"email",
            "type":"VARCHAR",
            "char_length":"255",
            "is_nullable":"NO",
            "default_value":"",
            "comment":"",
            "sort":6,
            "ui":"textinput",
            "system":false,
            "hidden_list":false,
            "hidden_input":false,
            "required":true,
            "options": {
              "size": "medium"
            }
          },
          {
            "id":"position",
            "column_name":"position",
            "type":"VARCHAR",
            "char_length":"255",
            "is_nullable":"YES",
            "default_value":"",
            "comment":"",
            "sort":30,
            "ui":"textinput",
            "system":false,
            "hidden_list":false,
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
            "is_nullable":"YES",
            "default_value":"",
            "comment":"",
            "sort":31,
            "ui":"textinput",
            "system":false,
            "hidden_list":false,
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
            "is_nullable":"YES",
            "default_value":"",
            "comment":"",
            "sort":32,
            "ui":"textinput",
            "system":false,
            "hidden_list":false,
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
            "is_nullable":"YES",
            "default_value":"",
            "comment":"",
            "sort":33,
            "ui":"textinput",
            "system":false,
            "hidden_list":false,
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
            "is_nullable":"YES",
            "default_value":"",
            "comment":"",
            "sort":34,
            "ui":"textinput",
            "system":false,
            "hidden_list":false,
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
            "is_nullable":"YES",
            "default_value":"",
            "comment":"",
            "sort":35,
            "ui":"textinput",
            "system":false,
            "hidden_list":false,
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
            "is_nullable":"YES",
            "default_value":"",
            "comment":"",
            "sort":36,
            "ui":"textinput",
            "system":false,
            "hidden_list":false,
            "hidden_input":false,
            "required":false,
            "options": {
              "size": "small"
            }
          },
          {
            "id":"email_messages",
            "column_name":"email_messages",
            "type":"TINYINT",
            "is_nullable":"YES",
            "default_value":"1",
            "comment":"CMS messages will also be sent to email address above",
            "sort":6,
            "system":false,
            "hidden_list":false,
            "hidden_input":false,
            "required":false,
            "ui":"checkbox"
          },
          {
            "id":"password",
            "column_name":"password",
            "type":"VARCHAR",
            "char_length":"255",
            "is_nullable":"NO",
            "default_value":"",
            "comment":"Passwords are encrypted, if forgotten they must be reset",
            "sort":10,
            "system":true,
            "hidden_list":true,
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
            "is_nullable":"NO",
            "default_value":"",
            "comment":"",
            "sort":11,
            "system":true,
            "hidden_list":true,
            "hidden_input":true,
            "required":true,
            "ui":"salt"
          },
          {
            "id":"token",
            "column_name":"token",
            "type":"VARCHAR",
            "char_length":"255",
            "is_nullable":"NO",
            "default_value":"",
            "comment":"This is your user's API authentication token. Keep it safe!",
            "sort":12,
            "system":true,
            "hidden_list":false,
            "hidden_input":false,
            "required":true,
            "ui":"random",
            "options": {
              "auto_generate": 1,
              "allow_any_value": 1
            }
          },
          {
            "id":"access_token",
            "column_name":"access_token",
            "type":"VARCHAR",
            "char_length":"255",
            "is_nullable":"YES",
            "default_value":"",
            "comment":"",
            "sort":13,
            "system":true,
            "hidden_list":true,
            "hidden_input":true,
            "required":false,
            "ui":"textinput"
          },
          {
            "id":"reset_token",
            "column_name":"reset_token",
            "type":"VARCHAR",
            "char_length":"255",
            "is_nullable":"YES",
            "default_value":"",
            "comment":"",
            "sort":14,
            "system":true,
            "hidden_list":false,
            "hidden_input":true,
            "required":false,
            "ui":"textinput"
          },
          {
            "id":"reset_expiration",
            "column_name":"reset_expiration",
            "type":"DATETIME",
            "is_nullable":"YES",
            "comment":"",
            "sort":15,
            "system":true,
            "hidden_list":false,
            "hidden_input":true,
            "required":false,
            "ui":"datetime"
          },
          {
            "id":"last_access",
            "column_name":"last_access",
            "type":"DATETIME",
            "is_nullable":"YES",
            "default_value":"0000-00-00 00:00:00",
            "comment":"",
            "sort":20,
            "system":false,
            "hidden_list":false,
            "hidden_input":true,
            "required":false,
            "ui":"datetime"
          },
          {
            "id":"last_login",
            "column_name":"last_login",
            "type":"DATETIME",
            "is_nullable":"YES",
            "default_value":"0000-00-00 00:00:00",
            "comment":"",
            "sort":21,
            "system":false,
            "hidden_list":false,
            "hidden_input":true,
            "required":false,
            "ui":"datetime"
          },
          {
            "id":"last_page",
            "column_name":"last_page",
            "type":"VARCHAR",
            "char_length":"255",
            "is_nullable":"NO",
            "default_value":"",
            "comment":"",
            "sort":22,
            "system":false,
            "hidden_list":false,
            "hidden_input":true,
            "required":false,
            "ui":"textinput"
          },
          {
            "id":"ip",
            "column_name":"ip",
            "type":"VARCHAR",
            "char_length":"50",
            "is_nullable":"YES",
            "default_value":"",
            "comment":"",
            "sort":23,
            "system":true,
            "hidden_list":false,
            "hidden_input":true,
            "required":false,
            "ui":"textinput"
          },
          {
            "id":"group",
            "column_name":"group",
            "type":"INT",
            "is_nullable":"NO",
            "comment":"Determines this user's access",
            "sort":8,
            "system":false,
            "hidden_list":false,
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
            "relationship":{
              "type":"MANYTOONE",
              "related_table":"directus_groups",
              "junction_key_right":"group_id"
            }
          },
          {
            "id":"language",
            "column_name":"language",
            "type":"VARCHAR",
            "char_length":"8",
            "is_nullable":"YES",
            "default_value": defaultLocale,
            "comment":"",
            "sort":37,
            "ui":"select",
            "system":false,
            "hidden_list":false,
            "hidden_input":false,
            "required":false,
            "options": {
              "allow_null": false,
              "options": parseSelectOptions(locales, function(key, list, locale, result) {
                result[locale.code] = locale.name;
              })
            }
          },
          {
            "id":"timezone",
            "column_name":"timezone",
            "type":"VARCHAR",
            "char_length":"32",
            "is_nullable":"YES",
            "default_value": defaultTimezone,
            "comment":"",
            "sort":38,
            "ui":"select",
            "system":false,
            "hidden_list":false,
            "hidden_input":false,
            "required":false,
            "options": {
              "allow_null": false,
              "options": parseSelectOptions(timezones, function(key, list, name, result) {
                result[key] = name;
              })
            }
          }
        ]
      };
    }
  };

});
