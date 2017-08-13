define(function(require, exports, module) {

  'use strict';

  module.exports = {

    "id": "directus_privileges",
    "table_name": "directus_privileges",
    "primary_column": "id",
    "hidden": true,
    "single": false,

    "columns": [
      {
        "id": "id",
        "column_name": "id",
        "ui": "primary_key",
        "key": "PRI",
        "extra": "auto_increment",
        "type": "INT",
        "system": true,
        "hidden_input": false,
        "sort": 0
      },
      {
        "id": "table_name",
        "column_name": "table_name",
        "ui": "text_input",
        "type": "VARCHAR",
        "length": 255,
        "system": false,
        "hidden_input": false,
        "sort": 10
      },
      {
        "id": "allow_view",
        "column_name": "allow_view",
        "ui": "toggle",
        "type": "TINYINT",
        "length": 1,
        "system": false,
        "hidden_input": false,
        "sort": 40
      },
      {
        "id": "allow_add",
        "column_name": "allow_add",
        "ui": "toggle",
        "type": "TINYINT",
        "length": 1,
        "system": false,
        "hidden_input": false,
        "sort": 40
      },
      {
        "id": "allow_edit",
        "column_name": "allow_edit",
        "ui": "toggle",
        "type": "TINYINT",
        "length": 1,
        "system": false,
        "hidden_input": false,
        "sort": 40
      },
      {
        "id": "allow_delete",
        "column_name": "allow_delete",
        "ui": "toggle",
        "type": "TINYINT",
        "length": 1,
        "system": false,
        "hidden_input": false,
        "sort": 40
      },
      {
        "id": "allow_alter",
        "column_name": "allow_alter",
        "ui": "toggle",
        "type": "TINYINT",
        "length": 1,
        "system": false,
        "hidden_input": false,
        "sort": 40
      },
      {
        "id": "group_id",
        "column_name": "group_id",
        "ui": "many_to_one",
        "type": "INT",
        "system": true,
        "hidden_input": false,
        "sort": 0,
        "relationship_type": "MANYTOONE",
        "related_table": "directus_groups",
        "junction_key_right": "group_id"
      },
      {
        "id": "read_field_blacklist",
        "column_name": "read_field_blacklist",
        "ui": "textarea",
        "type": "VARCHAR",
        "length": 1000,
        "system": false,
        "nullable": true,
        "hidden_input": false,
        "sort": 20
      },
      {
        "id": "write_field_blacklist",
        "column_name": "write_field_blacklist",
        "ui": "textarea",
        "type": "VARCHAR",
        "length": 1000,
        "system": false,
        "nullable": true,
        "hidden_input": false,
        "sort": 20
      },
      {
        "id": "nav_listed",
        "column_name": "nav_listed",
        "ui": "toggle",
        "type": "TINYINT",
        "length": 1,
        "system": false,
        "hidden_input": false,
        "sort": 40
      },
      {
        "id": "status_id",
        "column_name": "status_id",
        "ui": "toggle",
        "type": "TINYINT",
        "length": 1,
        "system": false,
        "nullable": true,
        "hidden_input": false,
        "sort": 40
      }
    ]
  };
});
