define([], function() {

  var messages = {};

  messages.table = {
    "id":"directus_messages",
    "table_name":"directus_messages",
    "hidden":true,
    "single":false,
    "inactive_by_default": "0",
    "url": "api/1/groups"
  };

  messages.structure = [
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
      "id":"from",
      "column_name":"from",
      "ui":"directus_user",
      "type":"INT",
      "system":false,
      "hidden_list":false,
      "hidden_input":false,
      "options":{
        "id":"directus_user",
        "format":"short"
      }
    },
    {
      "id":"recepients",
      "column_name":"recepients",
      "ui":"directus_messages_recepients",
      "is_nullable":"NO",
      "type":"VARCHAR",
      "system":false,
      "char_length":1000,
      "hidden_list":false,
      "hidden_input":false
    },
    {
      "id":"subject",
      "column_name":"subject",
      "ui":"textinput",
      "type":"VARCHAR",
      "system":false,
      "char_length":200,
      "hidden_list":false,
      "hidden_input":false
    },
    {
      "id": "message",
      "column_name": "message",
      "ui": "textarea",
      "type": "VARCHAR",
      "system": false,
      "hidden_list": false,
      "hidden_input" :false,
      "options": {
        "id": "textarea",
        "rows": 15
      }
    },
    {
      "id":"attachment",
      "column_name":"attachment",
      "type":"INT",
      "is_nullable":"YES",
      "comment":"312 x 312",
      "ui":"single_media",
      "system":false,
      "master":false,
      "hidden_list":false,
      "hidden_input":false,
      "required":false,
      "is_writable":true,
      "options":[

      ]
    },
    {
      "id":"datetime",
      "column_name":"datetime",
      "type":"DATETIME",
      "is_nullable":"YES",
      "ui":"datetime",
      "system":false,
      "master":false,
      "hidden_list":false,
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
      "master":false,
      "hidden_list":false,
      "hidden_input":true,
      "required":false,
      "is_writable":true,
      "options":[

      ]
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
      "master":false,
      "hidden_list":true,
      "hidden_input":true,
      "table_related":"directus_messages",
      "junction_key_right":"response_to",
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
      "hidden_list":true,
      "hidden_input":true
    }
  ];

  return messages;

});