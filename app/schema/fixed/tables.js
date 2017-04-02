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
        "ui": "textinput",
        "type": "VARCHAR",
        "length": 64,
        "system": true,
        "hidden_list": false,
        "hidden_input": false,
        "omit_input": false,
        "required": true,
        "sort": 0,
        "comment": transComments('table_name')
      },
      {
        "id": "display_template",
        "column_name": "display_template",
        "ui": "textinput",
        "type": "VARCHAR",
        "length": 255,
        "system": false,
        "hidden_list": false,
        "hidden_input": false,
        "required": false,
        "nullable": true,
        "sort": 1,
        "options": {
          "placeholder_text": __t('eg_x', {text: '{{first_name}} {{last_name}}'})
        },
        "comment": transComments('display_template')
      },
      {
        "id": "preview_url",
        "column_name": "preview_url",
        "ui": "textinput",
        "type": "VARCHAR",
        "length": 255,
        "system": false,
        "hidden_list": false,
        "hidden_input": false,
        "required": false,
        "nullable": true,
        "sort": 2,
        "options": {
          "placeholder_text": __t('eg_x', {text: 'http://example.com/articles/{{slug}}'})
        },
        "comment": transComments('preview_url')
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
        "hidden_list": false,
        "hidden_input": false,
        "sort": 2,
        "options": {
          "visible_columns": "column_name,ui,relationship_type,comment",
          "add_button": 1
        },
        "comment": transComments('columns')
      },
      {
        "id": "list_view",
        "column_name": "list_view",
        "ui": "directus_views", // @TODO: multiple checkbox
        "type": "VARCHAR",
        "length": 200,
        "default_value": "table",
        "required": false,
        "nullable": true,
        "system": false,
        "hidden_list": false,
        "hidden_input": false,
        "sort": 3,
        "comment": transComments('list_view')
      },
      {
        "id":"hidden",
        "column_name":"hidden",
        "ui":"checkbox",
        "type":"TINYINT",
        "default_value": false,
        "system":false,
        "required": false,
        "nullable": true,
        "hidden_list":false,
        "hidden_input":false,
        "sort": 3,
        "comment": transComments('hidden')
      },
      {
        "id":"single",
        "column_name":"single",
        "ui":"checkbox",
        "type":"TINYINT",
        "default_value": false,
        "system":false,
        "required": false,
        "nullable": true,
        "hidden_list":false,
        "hidden_input":false,
        "sort": 4,
        "comment": transComments('single')
      },
      {
        "id":"default_status",
        "column_name":"default_status",
        "ui":"textinput",
        "type":"VARCHAR",
        "default_value": 1,
        "required": false,
        "nullable": true,
        "system":false,
        "hidden_list":false,
        "hidden_input":false,
        "omit_input": true,
        "sort": 5,
        "comment": transComments('default_status')
      },
      {
        "id": "footer",
        "column_name": "footer",
        "ui": "checkbox",
        "type": "TINYINT",
        "system": false,
        "required": false,
        "nullable": true,
        "hidden_list": false,
        "hidden_input": false,
        "omit_input": true,
        "sort": 6,
        "comment": transComments('footer')
      },
      {
        "id": "primary_column",
        "column_name": "primary_column",
        "ui": "directus_columns_picker",
        "type": "VARCHAR",
        "length": 64,
        "system": true,
        "hidden_list": false,
        "hidden_input": false,
        "default_value": "id",
        "required": false,
        "sort": 7,
        "comment": transComments('primary_key'),
        "options": {
          "filter": "primary"
        }
      },
      {
        "id": "sort_column",
        "column_name": "sort_column",
        "ui": "directus_columns_picker",
        "type": "VARCHAR",
        "length": 64,
        "system": true,
        "hidden_list": false,
        "hidden_input": false,
        "default_value": "sort",
        "required": false,
        "nullable": true,
        "sort": 8,
        "comment": transComments('sort_column'),
        "options": {
          "filter": "number"
        }
      },
      {
        "id": "status_column",
        "column_name": "status_column",
        "ui": "directus_columns_picker",
        "type": "VARCHAR",
        "length": 64,
        "system": true,
        "hidden_list": false,
        "hidden_input": false,
        "required": false,
        "nullable": true,
        "sort": 9,
        "comment": transComments('status_column'),
        "options": {
          "filter": "number"
        }
      },
      {
        "id": "status_mapping",
        "column_name": "status_mapping",
        "ui": "textarea",
        "type": "TEXT",
        "hidden_list": false,
        "hidden_input": false,
        "required": false,
        "nullable": true,
        "sort": 10,
        "comment": transComments('status_column'),
        "options": {
          "filter": "number"
        }
      },
      {
        "id": "directus_accountability",
        "column_name": "directus_accountability",
        "ui": "directus_accountability",
        "type": "ALIAS",
        "system": false,
        "hidden_list": true,
        "hidden_input": false,
        "required": false,
        "nullable": true,
        "sort": 11,
        "comment": __t('directus_accountability')
      },
      {
        "id": "user_create_column",
        "column_name": "user_create_column",
        "ui": "textinput",
        "type": "VARCHAR",
        "length": 64,
        "system": false,
        "hidden_list": false,
        "hidden_input": false,
        "omit_input": true,
        "required": false,
        "nullable": true,
        "sort": 12,
        "comment": ""
      },
      {
        "id": "user_update_column",
        "column_name": "user_update_column",
        "ui": "textinput",
        "type": "VARCHAR",
        "length": 64,
        "system": false,
        "hidden_list": false,
        "hidden_input": false,
        "omit_input": true,
        "required": false,
        "nullable": true,
        "sort": 13,
        "comment": ""
      },
      {
        "id": "date_create_column",
        "column_name": "date_create_column",
        "ui": "textinput",
        "type": "VARCHAR",
        "length": 64,
        "system": false,
        "hidden_list": false,
        "hidden_input": false,
        "omit_input": true,
        "required": false,
        "nullable": true,
        "sort": 14,
        "comment": ""
      },
      {
        "id": "date_update_column",
        "column_name": "date_update_column",
        "ui": "textinput",
        "type": "VARCHAR",
        "length": 64,
        "system": false,
        "hidden_list": false,
        "hidden_input": false,
        "omit_input": true,
        "required": false,
        "nullable": true,
        "sort": 15,
        "comment": ""
      }
    ]
  };
});
