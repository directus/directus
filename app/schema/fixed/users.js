define(function(require, exports, module) {

  "use strict";

  //todo: move last_access here

  module.exports = {
    "id":"directus_users",
    "table_name":"directus_users",
    "title":"Users",
    "hidden":true,
    "single":false,
    "inactive_by_default":"0",
    "is_junction_table":false,
    "count":0,
    "active":0,
    "url": "api/1/tables/directus_users/",
    "columns": [
      {
        "id":"activity",
        "column_name":"activity",
        "type":"ALIAS",
        "is_nullable":"NO",
        "ui":"directus_user_activity",
        "system":false,
        "master":false,
        "hidden_list":false,
        "hidden_input":true,
        "required":false
      },
      {
        "id":"avatar",
        "column_name":"avatar",
        "type":"VARCHAR",
        "is_nullable":"YES",
        "comment":"",
        "sort":16,
        "system":false,
        "master":false,
        "hidden_list":false,
        "hidden_input":true,
        "required":false,
        "ui":"directus_user_avatar"
      },
      {
        "id":"name",
        "column_name":"first_name",
        "type":"ALIAS",
        "sort":0,
        "is_nullable":"NO",
        "ui":"directus_user",
        "system":false,
        "master":false,
        "hidden_list":true,
        "hidden_input":true,
        "required":false,
        "options": {
          "format": "full"
        }
      },
      {
        "id":"id",
        "column_name":"id",
        "type":"TINYINT",
        "is_nullable":"NO",
        "comment":"",
        "sort":1,
        "system":true,
        "master":false,
        "hidden_list":false,
        "hidden_input":true,
        "required":false,
        "ui":"checkbox",
        "hidden":true
      },
      {
        "id":"active",
        "column_name":"active",
        "type":"TINYINT",
        "is_nullable":"NO",
        "default_value":"1",
        "comment":"",
        "sort":2,
        "system":true,
        "master":false,
        "hidden_list":false,
        "hidden_input":true,
        "required":false,
        "ui":"checkbox",
        "hidden":true
      },
      {
        "id":"first_name",
        "column_name":"first_name",
        "type":"VARCHAR",
        "char_length":"50",
        "is_nullable":"NO",
        "comment":"",
        "sort":3,
        "system":false,
        "master":false,
        "hidden_list":false,
        "hidden_input":false,
        "required":false,
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
        "sort":4,
        "system":false,
        "master":false,
        "hidden_list":false,
        "hidden_input":false,
        "required":false,
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
        "sort":5,
        "ui":"textinput",
        "system":false,
        "master":false,
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
        "sort":10,
        "ui":"textinput",
        "system":false,
        "master":false,
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
        "is_nullable":"NO",
        "default_value":"",
        "comment":"",
        "sort":11,
        "ui":"textinput",
        "system":false,
        "master":false,
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
        "sort":12,
        "ui":"textinput",
        "system":false,
        "master":false,
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
        "sort":13,
        "ui":"textinput",
        "system":false,
        "master":false,
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
        "char_length":"255",
        "is_nullable":"YES",
        "default_value":"",
        "comment":"",
        "sort":14,
        "ui":"textinput",
        "system":false,
        "master":false,
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
        "char_length":"255",
        "is_nullable":"YES",
        "default_value":"",
        "comment":"",
        "sort":15,
        "ui":"textinput",
        "system":false,
        "master":false,
        "hidden_list":false,
        "hidden_input":false,
        "required":false,
        "options": {
          "size": "small"
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
        "sort":9,
        "ui":"textinput",
        "system":false,
        "master":false,
        "hidden_list":false,
        "hidden_input":false,
        "required":false,
        "options": {
          "size": "medium"
        }
      },
      {
        "id":"last_access",
        "column_name":"last_access",
        "type":"DATETIME",
        "is_nullable":"YES",
        "default_value":"0000-00-00 00:00:00",
        "comment":"",
        "sort":16,
        "system":false,
        "master":false,
        "hidden_list":false,
        "hidden_input":true,
        "required":false,
        "ui":"datetime"
      },





      {
        "id":"email_messages",
        "column_name":"email_messages",
        "type":"TINYINT",
        "is_nullable":"NO",
        "default_value":"1",
        "comment":"CMS messages will also be sent to email address above",
        "sort":6,
        "system":false,
        "master":false,
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
        "comment":"Once encrypted, no one can access your password. Forgotten passwords must be reset",
        "sort":7,
        "system":true,
        "master":false,
        "hidden_list":true,
        "hidden_input":false,
        "required":false,
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
        "sort":8,
        "system":true,
        "master":false,
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
        "is_nullable":"YES",
        "default_value":"",
        "comment":"",
        "sort":8,
        "system":true,
        "master":false,
        "hidden_list":false,
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
        "sort":9,
        "system":true,
        "master":false,
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
        "sort":10,
        "system":true,
        "master":false,
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
        "sort":12,
        "system":false,
        "master":false,
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
        "sort":13,
        "system":false,
        "master":false,
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
        "sort":14,
        "system":true,
        "master":false,
        "hidden_list":false,
        "hidden_input":true,
        "required":false,
        "ui":"textinput"
      },
      {
        "id":"group",
        "column_name":"group",
        "type":"INT",
        "is_nullable":"YES",
        "comment":"Determines this user's access",
        "sort":8,
        "system":false,
        "master":false,
        "hidden_list":false,
        "hidden_input":false,
        "required":false,
        "ui":"many_to_one",
        "options": {
          "id": "many_to_one",
          "table_related": "directus_groups",
          // "related_table": "directus_groups",
          "visible_column": "name",
          "visible_column_template": "{{name}}"
        },
        "relationship":{
          "type":"MANYTOONE",
          "table_related":"directus_groups"
        }
      }
    ]
  };

});