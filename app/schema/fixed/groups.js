define(function(require, exports, module) {

  "use strict";

  module.exports = {

    "id":"directus_groups",
    "table_name":"directus_groups",
    "hidden":true,
    "single":false,
    "url": "api/1/groups",

    "columns": [
      {
        "id":"id",
        "column_name":"id",
        "ui":"numeric",
        "type":"INT",
        "system":true,
        "hidden_list":true,
        "hidden_input":true
      },
      {
        "id":"name",
        "column_name":"name",
        "ui":"numeric",
        "type":"VARCHAR",
        "system":true,
        "hidden_list":true,
        "hidden_input":true
      },
      {
        "id":"description",
        "column_name":"description",
        "ui":"textinput",
        "type":"VARCHAR",
        "system":false,
        "hidden_list":true,
        "hidden_input":true
      }
    ]
  };
});