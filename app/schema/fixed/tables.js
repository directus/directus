define(function(require, exports, module) {

  'use strict';

  module.exports = {
    "id": "directus_tables",
    "table_name": "directus_tables",
    "primary_column": "table_name",
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
        "required": true,
        "sort": 0,
        "comment": ""
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
          "placeholder_text": "eg {{first_name}} {{last_name}}"
        },
        "comment": ""
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
          "placeholder_text": "eg http://example.com/articles/{{slug}}"
        },
        "comment": ""
      },
      {
        "id": "columns",
        "column_name": "columns",
        "type": "ALIAS",
        "ui": "columns",
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
        }
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
        "sort": 3
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
        "sort": 3
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
        "sort": 4
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
        "sort": 5
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
        "sort": 6
      },
      {
        "id": "primary_column",
        "column_name": "primary_column",
        "ui": "directus_columns",
        "type": "VARCHAR",
        "length": 64,
        "system": true,
        "hidden_list": false,
        "hidden_input": false,
        "default_value": "id",
        "required": false,
        "sort": 7,
        "comment": "",
        "options": {
          "filter": "primary"
        }
      },
      {
        "id": "sort_column",
        "column_name": "sort_column",
        "ui": "directus_columns",
        "type": "VARCHAR",
        "length": 64,
        "system": true,
        "hidden_list": false,
        "hidden_input": false,
        "default_value": "sort",
        "required": false,
        "nullable": true,
        "sort": 8,
        "comment": "",
        "options": {
          "filter": "number"
        }
      },
      {
        "id": "status_column",
        "column_name": "status_column",
        "ui": "directus_columns",
        "type": "VARCHAR",
        "length": 64,
        "system": true,
        "hidden_list": false,
        "hidden_input": false,
        "required": false,
        "nullable": true,
        "sort": 9,
        "comment": "",
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
        "sort": 10,
        "comment": ""
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
        "sort": 10,
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
        "sort": 11,
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
        "sort": 12,
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
        "sort": 13,
        "comment": ""
      }
    ]
  };
});
