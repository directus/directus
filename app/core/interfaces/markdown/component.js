//  Markdown UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define([
  'core/interfaces/markdown/interface',
  'core/UIComponent',
  'marked'
],function(Input, UIComponent, marked) {

  'use strict';

  return UIComponent.extend({
    id: 'markdown',
    dataTypes: ['TEXT', 'VARCHAR'],
    variables: [
      {id: 'rows', type: 'Number', default_value: 14, ui: 'numeric', char_length: 3},
      {id: 'github_flavored_markdown', type: 'Boolean', default_value: false, ui: 'checkbox'},
      {id: 'tables', type: 'Boolean', default_value: false, ui: 'checkbox'},
      {id: 'breaks', type: 'Boolean', default_value: false, ui: 'checkbox'},
      {id: 'sanitize', type: 'Boolean', default_value: false, ui: 'checkbox'}
    ],
    Input: Input,
    validate: function(value, options) {
      if (options.schema.isRequired() && _.isEmpty(value)) {
        return 'This field is required';
      }
    },
    list: function(options) {
      var raw_val = marked(options.value);

      return _.isString(raw_val) ? raw_val.replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '<span class="silver">--</span>';
    }
  });
});
