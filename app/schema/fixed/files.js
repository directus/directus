define(function(require, exports, module) {

  "use strict";

  var app = require('app');
  module.exports = {
    getFiles: function() {
      // var statusName = app.statusMapping.get('directus_files').get('status_name');
      return {
        "id":"directus_files",
        "table_name":"directus_files",
        "hidden":true,
        "single":false,
        "count":0,
        "primary_column": "id",
        "status_column": "status",
        "url": "api/1.1/files",
        "title":"Files",

        "columns": [
          {
            "id": "data",
            "column_name": "data",
            "type":"ALIAS",
            "is_nullable": false,
            "comment":"",
            "sort":-1,
            "ui":"directus_file",
            "system":false,
            "hidden_input":false,
            "hidden_label": true,
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
            "id": "status",
            "column_name": "status",
            "type":"TINYINT",
            "is_nullable":"YES",
            "default_value":"1",
            "comment":"",
            "sort":2,
            "system":true,
            "hidden_input":true,
            "required":false,
            "ui":"status",
            "hidden":true
          },
          {
            "id":"name",
            "column_name":"name",
            "type":"VARCHAR",
            "char_length":"255",
            "is_nullable":"YES",
            "comment":"",
            "sort":3,
            "system":false,
            "hidden_input":true,
            "required":false,
            "ui":"text_input"
          },
          {
            "id":"title",
            "column_name":"title",
            "type":"VARCHAR",
            "char_length":"255",
            "is_nullable":"YES",
            "default_value":"",
            "comment":"",
            "sort":4,
            "system":false,
            "hidden_input":false,
            "required":false,
            "ui":"text_input"
          },
          {
            "id":"location",
            "column_name":"location",
            "type":"VARCHAR",
            "char_length":"200",
            "nullable": true,
            "comment":"",
            "sort":5,
            "system":false,
            "hidden_input":false,
            "required":false,
            "ui":"text_input"
          },
          {
            "id":"type",
            "column_name":"type",
            "type":"VARCHAR",
            "char_length":"50",
            "is_nullable":"YES",
            "default_value":"",
            "comment":"",
            "sort":6,
            "system":false,
            "hidden_input":true,
            "required":false,
            "ui":"text_input"
          },
          {
            "id":"charset",
            "column_name":"charset",
            "type":"VARCHAR",
            "char_length":"50",
            "is_nullable":"YES",
            "default_value":"",
            "comment":"",
            "sort":7,
            "system":true,
            "hidden_input":true,
            "required":false,
            "ui":"text_input"
          },
          {
            "id":"caption",
            "column_name":"caption",
            "type":"TEXT",
            "char_length":"65535",
            "nullable": true,
            "comment":"",
            "sort":8,
            "system":false,
            "hidden_input":false,
            "required":false,
            "ui":"textarea",
            "options":{
              "id":"textarea",
              "rows":"4"
            }
          },
          {
            "id":"tags",
            "column_name":"tags",
            "type":"VARCHAR",
            "char_length":"255",
            "nullable": true,
            "default_value":"",
            "comment":"",
            "sort":9,
            "ui":"tags",
            "system":false,
            "hidden_input":false,
            "required":false
          },
          {
            "id":"width",
            "column_name":"width",
            "type":"INT",
            "is_nullable":"YES",
            "default_value":"0",
            "comment":"",
            "sort":10,
            "system":false,
            "hidden_input":true,
            "required":false,
            "ui":"numeric"
          },
          {
            "id":"height",
            "column_name":"height",
            "type":"INT",
            "is_nullable":"YES",
            "default_value":"0",
            "comment":"",
            "sort":11,
            "ui":"numeric",
            "system":false,
            "hidden_input":true,
            "required":false
          },
          {
            "id":"size",
            "column_name":"size",
            "type":"INT",
            "is_nullable":"YES",
            "default_value":"0",
            "comment":"",
            "sort":12,
            "ui":"directus_file_size",
            "system":false,
            "hidden_input":true,
            "required":false
          },
          {
            "id":"embed_id",
            "column_name":"embed_id",
            "type":"VARCHAR",
            "char_length":"200",
            "is_nullable":"YES",
            "comment":"",
            "sort":13,
            "system":false,
            "hidden_input":true,
            "required":false,
            "ui":"text_input"
          },
          {
            "id":"user",
            "column_name":"user",
            "type":"INT",
            "is_nullable":"YES",
            "comment":"",
            "sort":14,
            "ui":"directus_user",
            "system":false,
            "hidden_input":true,
            "required":false,
            "options":{
              "id":"directus_user",
              "format":"short"
            }
          },
          {
            "id":"storage_adapter",
            "column_name":"storage_adapter",
            "type":"INT",
            "is_nullable":"YES",
            "comment":"",
            "sort":14,
            "ui":"numeric",
            "system":true,
            "hidden_input":true,
            "required":false
          },
          {
            "id":"date_uploaded",
            "column_name":"date_uploaded",
            "type":"DATETIME",
            "is_nullable":"YES",
            "comment":"",
            "sort":15,
            "system":false,
            "hidden_input":true,
            "required":false,
            "ui":"datetime",
            "options": {
              "id": "datetime",
              "contextual_date_in_listview": "1"
            }
          }
        ]
      }
    }
  };

});
