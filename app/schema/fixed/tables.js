define(function(require, exports, module) {

  'use strict';

  var __t = require('core/t');
  var transComments = function (key) {
    return __t('directus_tables_' + key + '_comment');
  };

  module.exports = {
    "id": "directus_tables",
    "table_name": "directus_tables",
    "primary_column": "table_name",
    "sort_column": "table_name",
    "url": "api/1.1/tables",

    "columns": [
      {
        "id": "table_name",
        "column_name": "table_name",
        "ui": "primary_key",
        "key": "PRI",
        "extra": "",
        "type": "VARCHAR",
        "length": 64,
        "system": true,
        "hidden_input": false,
        "omit_input": false,
        "required": true,
        "sort": 0,
        "comment": transComments('table_name')
      },
      {
        "id": "columns",
        "column_name": "columns",
        "type": "ALIAS",
        "ui": "directus_columns",
        "relationship_type": "ONETOMANY",
        "related_table": "directus_columns",
        "junction_key_right": "table_name",
        "default_value": null,
        "required": true,
        "system": false,
        "hidden_input": false,
        "sort": 1,
        "options": {
          "visible_columns": "column_name,ui,relationship_type,comment",
          "add_button": 1
        },
        "comment": transComments('columns')
      },
      {
        "id": "preview_url",
        "column_name": "preview_url",
        "ui": "text_input",
        "type": "VARCHAR",
        "length": 255,
        "system": false,
        "hidden_input": false,
        "required": false,
        "nullable": true,
        "sort": 9,
        "options": {
          "placeholder": __t('eg_x', {text: 'http://example.com/articles/{{slug}}'})
        },
        "comment": transComments('preview_url')
      },
      {
        "id": "display_template",
        "column_name": "display_template",
        "ui": "text_input",
        "type": "VARCHAR",
        "length": 255,
        "system": false,
        "hidden_input": false,
        "required": false,
        "nullable": true,
        "sort": 10,
        "options": {
          "placeholder": __t('eg_x', {text: '{{first_name}} {{last_name}}'})
        },
        "comment": transComments('display_template')
      },
      {
        "id":"hidden",
        "column_name":"hidden",
        "ui":"toggle",
        "type":"TINYINT",
        "default_value": false,
        "system":false,
        "required": false,
        "nullable": true,
        "hidden_input":false,
        "sort": 11,
        "comment": transComments('hidden')
      },
      {
        "id": "footer",
        "column_name": "footer",
        "ui": "toggle",
        "type": "TINYINT",
        "system": false,
        "required": false,
        "nullable": true,
        "hidden_input": false,
        "omit_input": true,
        "sort": 12,
        "comment": transComments('footer')
      },
      {
        "id":"single",
        "column_name":"single",
        "ui":"toggle",
        "type":"TINYINT",
        "default_value": false,
        "system":false,
        "required": false,
        "nullable": true,
        "hidden_input":false,
        "sort": 13,
        "comment": transComments('single')
      },
      {
        "id": "user_create_column",
        "column_name": "user_create_column",
        "ui": "text_input",
        "type": "VARCHAR",
        "length": 64,
        "system": false,
        "hidden_input": false,
        "omit_input": true,
        "required": false,
        "nullable": true,
        "sort": 15,
        "comment": ""
      },
      {
        "id": "user_update_column",
        "column_name": "user_update_column",
        "ui": "text_input",
        "type": "VARCHAR",
        "length": 64,
        "system": false,
        "hidden_input": false,
        "omit_input": true,
        "required": false,
        "nullable": true,
        "sort": 16,
        "comment": ""
      },
      {
        "id": "date_create_column",
        "column_name": "date_create_column",
        "ui": "text_input",
        "type": "VARCHAR",
        "length": 64,
        "system": false,
        "hidden_input": false,
        "omit_input": true,
        "required": false,
        "nullable": true,
        "sort": 17,
        "comment": ""
      },
      {
        "id": "date_update_column",
        "column_name": "date_update_column",
        "ui": "text_input",
        "type": "VARCHAR",
        "length": 64,
        "system": false,
        "hidden_input": false,
        "omit_input": true,
        "required": false,
        "nullable": true,
        "sort": 18,
        "comment": ""
      }
    ]
  };
});
