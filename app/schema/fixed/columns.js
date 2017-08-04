define(function(require, exports, module) {

  'use strict';

  module.exports = {
    'id': 'directus_columns',
    'table_name': 'directus_tables',
    'hidden': true,
    'single': false,
    'primary_column': 'id',
    'sort_column': 'sort',

    'columns': [
      {
        'id': 'id',
        'column_name': 'id',
        'ui': 'primary_key',
        'key': 'PRI',
        'extra': 'auto_increment',
        'type': 'INT',
        'system': true,
        'hidden_input': true,
        'sort': 0
      },
      {
        'id': 'table_name',
        'column_name': 'table_name',
        'ui': 'text_input',
        'type': 'VARCHAR',
        'system': false,
        'hidden_input': false,
        'sort': 1
      },
      {
        'id': 'column_name',
        'column_name': 'column_name',
        'ui': 'text_input',
        'type': 'VARCHAR',
        'system': false,
        'hidden_input': false,
        'sort': 2
      },
      {
        'id': 'data_type',
        'column_name': 'data_type',
        'ui': 'text_input',
        'type': 'VARCHAR',
        'system': false,
        'hidden_input': false,
        'sort': 2
      },
      {
        'id': 'ui',
        'column_name': 'ui',
        'ui': 'text_input',
        'type': 'VARCHAR',
        'system': false,
        'hidden_input': false,
        'sort': 2
      },
      {
        'id': 'relationship_type',
        'column_name': 'relationship_type',
        'ui': 'text_input',
        'type': 'VARCHAR',
        'required': false,
        'nullable': true,
        'system': false,
        'hidden_input': false,
        'sort': 2
      },
      {
        'id':'hidden_input',
        'column_name':'hidden_input',
        'ui':'toggle',
        'type':'TINYINT',
        'default_value': false,
        'system':false,
        'hidden_input':false,
        'nullable': true,
        'required': false
      },
      {
        'id': 'required',
        'column_name': 'required',
        'ui':'toggle',
        'type':'TINYINT',
        'system':false,
        'hidden_input':false,
        'nullable': true,
        'required': false
      },
      {
        'id': 'sort',
        'column_name': 'sort',
        'ui':'sort',
        'type':'INT',
        'default_value': 0,
        'system':false,
        'hidden_input':false
      },
      {
        'id': 'comment',
        'column_name': 'comment',
        'ui': 'text_input',
        'type': 'VARCHAR',
        'char_length': 255,
        'default_value': '',
        'required': false,
        'nullable': true,
        'system':false,
        'hidden_input':false
      }
    ]
  };
});
