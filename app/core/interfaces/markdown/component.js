//  Markdown UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define([
  'underscore',
  'core/interfaces/markdown/interface',
  'core/UIComponent',
  'marked'
], function (_, Input, UIComponent, marked) {

  'use strict';

  return UIComponent.extend({
    id: 'markdown',
    dataTypes: ['TEXT', 'VARCHAR'],
    variables: [
      {
        id: 'rows',
        ui: 'numeric',
        type: 'Number',
        comment: 'Height of the field in rows',
        default_value: 12,
        char_length: 3
      },
      {
        id: 'github_flavored_markdown',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Use GitHub flavored markdown when parsing the value',
        default_value: false
      },
      {
        id: 'tables',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Allow tables',
        default_value: false
      },
      {
        id: 'breaks',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Allow breaks',
        default_value: false
      },
      {
        id: 'sanitize',
        type: 'Boolean',
        default_value: false,
        comment: 'Sanitize the value',
        ui: 'toggle'
      }
    ],
    Input: Input,
    validate: function (value, options) {
      if (options.schema.isRequired() && _.isEmpty(value)) {
        return 'This field is required';
      }
    },
    list: function (options) {
      var value = options.value;

      if (!_.isString(value)) {
        value = '';
      }

      var raw_val = marked(value);

      return _.isString(raw_val) ? raw_val.replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '<span class="silver">--</span>';
    }
  });
});
