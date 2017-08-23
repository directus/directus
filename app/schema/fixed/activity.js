define(function(require, exports, module) {

  "use strict";

  module.exports = {

    "id":"directus_activity",
    "table_name":"directus_activity",
    "hidden":true,
    "single":false,
    "count":0,
    "active":0,
    "primary_column": "id",
    "url": "api/1/activity",
    "title": "Activity",

    "columns": [
      {
        "id":"activity",
        "column_name":"activity",
        "sort":0,
        "type":"ALIAS",
        "is_nullable":"NO",
        "ui":"directus_activity",
        "system":false,
        "hidden_input":false,
        "required":false
      },
      {
        "id":"id",
        "column_name":"id",
        "type":"INT",
        "is_nullable":"NO",
        "comment":"",
        "sort":1,
        "system":true,
        "hidden_input":false,
        "required":false,
        "ui":"primary_key",
        "key": "PRI",
        "extra": "auto_increment",
        "hidden":true
      },
      {
        "id":"identifier",
        "column_name":"identifier",
        "type":"VARCHAR",
        "char_length":"100",
        "is_nullable":"YES",
        "comment":"",
        "sort":2,
        "system":false,
        "hidden_input":false,
        "required":false,
        "ui":"text_input"
      },
      {
        "id":"action",
        "column_name":"action",
        "type":"VARCHAR",
        "char_length":"100",
        "is_nullable":"NO",
        "default_value":"",
        "comment":"",
        "sort":3,
        "system":false,
        "hidden_input":false,
        "required":false,
        "ui":"text_input"
      },
      {
        "id":"table_name",
        "column_name":"table_name",
        "type":"VARCHAR",
        "char_length":"100",
        "is_nullable":"NO",
        "default_value":"",
        "comment":"",
        "sort":4,
        "system":false,
        "hidden_input":false,
        "required":false,
        "ui":"text_input"
      },
      {
        "id":"row_id",
        "column_name":"row_id",
        "type":"INT",
        "is_nullable":"NO",
        "comment":"",
        "sort":5,
        "system":false,
        "hidden_input":false,
        "required":false,
        "ui":"numeric"
      },
      {
        "id":"user",
        "column_name":"user",
        "type":"INT",
        "is_nullable":"NO",
        "default_value":"0",
        "comment":"",
        "sort":6,
        "ui":"directus_user",
        "system":false,
        "hidden_input":false,
        "required":false,
        "options": {
            "format": "short"
        }
      },
      {
        "id":"data",
        "column_name":"data",
        "type":"TEXT",
        "char_length":"65535",
        "is_nullable":"YES",
        "comment":"",
        "sort":7,
        "system":false,
        "hidden_input":false,
        "required":false,
        "ui":"textarea"
      },
      {
        "id":"parent_id",
        "column_name":"parent_id",
        "type":"INT",
        "is_nullable":"YES",
        "comment":"",
        "sort":8,
        "system":false,
        "hidden_input":false,
        "required":false,
        "ui":"numeric"
      },
      {
        "id":"datetime",
        "column_name":"datetime",
        "type":"DATETIME",
        "is_nullable":"YES",
        "comment":"",
        "sort":9,
        "system":false,
        "hidden_input":false,
        "required":false,
        "ui":"datetime",
        "options": {
            "id": "datetime",
            "contextual_date_in_listview": "1"
        }
      }
    ]
  };

});
