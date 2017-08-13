define(function(require, exports, module) {

  "use strict";

  module.exports = {
    "id":"directus_messages",
    "table_name":"directus_messages",
    "hidden":true,
    "single":false,
    "primary_column": "id",
    "url": "api/1/groups",

    "columns": [
      {
        "id":"id",
        "column_name":"id",
        "ui":"primary_key",
        "key": "PRI",
        "extra": "auto_increment",
        "type":"INT",
        "system":true,
        "hidden_input":true
      },
      {
        "id":"from",
        "column_name":"from",
        "ui":"directus_user",
        "type":"INT",
        "system":false,
        "hidden_input":false,
        "options":{
          "id":"directus_user",
          "format":"short"
        }
      },
      {
        "id":"recipients",
        "column_name":"recipients",
        "ui":"directus_messages_recipients",
        "is_nullable":"NO",
        "type":"VARCHAR",
        "system":false,
        "char_length":1000,
        "hidden_input":false
      },
      {
        "id":"subject",
        "column_name":"subject",
        "ui":"text_input",
        "type":"VARCHAR",
        "required":true,
        "system":false,
        "char_length":100,
        "hidden_input":false
      },
      {
        "id": "message",
        "column_name": "message",
        "ui": "textarea",
        "type": "VARCHAR",
        "system": false,
        "hidden_input" :false,
        "options": {
          "id": "textarea",
          "rows": 15
        }
      },
      {
        "id":"datetime",
        "column_name":"datetime",
        "type":"DATETIME",
        "is_nullable":"YES",
        "ui":"datetime",
        "system":false,
        "hidden_input":true,
        "required":false,
        "is_writable":true,
        "options":[

        ]
      },
      {
        "id":"date_updated",
        "column_name":"date_updated",
        "type":"DATETIME",
        "is_nullable":"YES",
        "ui":"datetime",
        "system":false,
        "hidden_input":true,
        "required":false,
        "is_writable":true,
        "options":[

        ]
      },
      {
        "id": "attachment",
        "column_name": "attachment",
        "type": "VARCHAR",
        "nullable": true,
        "ui": "multiple_files_csv"
      },
      {
        "id":"responses",
        "column_name":"responses",
        "type":"ONETOMANY",
        "is_nullable":"NO",
        "comment":"",
        "sort":38,
        "ui":"one_to_many",
        "system":false,
        "hidden_input":true,
        "relationship_type": "ONETOMANY",
        "related_table": "directus_messages",
        "junction_key_right": "response_to",
        "required":false,
        "is_writable":true,
        "options":{
          "id":"one_to_many",
          "visible_columns":"subject"
        }
      },
      {
        "id":"response_to",
        "column_name":"response_to",
        "ui":"numeric",
        "type":"INT",
        "system":true,
        "hidden_input":true
      },
      {
        "id":"comment_metadata",
        "column_name":"comment_metadata",
        "ui":"text_input",
        "type":"VARCHAR",
        "length": 255,
        "system": false,
        "hidden_input": true
      }
    ]
  };

});
