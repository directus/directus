define(function(require, exports, module) {

  'use strict';

  module.exports = {
    "id":"directus_tables",
    "table_name":"directus_tables",
    "hidden":true,
    "single":false,
    "primary_column": "table_name",
    "url": "api/1.1/tables",

    "columns": [
      {
        "id":"table_name",
        "column_name":"table_name",
        "ui":"textinput",
        "type":"VARCHAR",
        "system":true,
        "hidden_list":false,
        "hidden_input":false
      },
      {
        "id":"hidden",
        "column_name":"hidden",
        "ui":"checkbox",
        "type":"TINYINT",
        "default_value": false,
        "system":false,
        "hidden_list":false,
        "hidden_input":false
      },
      {
        "id":"single",
        "column_name":"single",
        "ui":"checkbox",
        "type":"TINYINT",
        "default_value": false,
        "system":false,
        "hidden_list":false,
        "hidden_input":false
      },
      {
        "id":"default_status",
        "column_name":"default_status",
        "ui":"textinput",
        "type":"VARCHAR",
        "default_value": 1,
        "system":false,
        "hidden_list":false,
        "hidden_input":false
      },
      {
        "id":"footer",
        "column_name":"footer",
        "ui":"checkbox",
        "type":"TINYINT",
        "system":false,
        "hidden_list":false,
        "hidden_input":false
      }
    ]
  };
});
