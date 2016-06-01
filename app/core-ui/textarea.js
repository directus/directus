//  Textarea Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'core/UIComponent', 'core/UIView'],function(app, UIComponent, UIView) {

  'use strict';

  var template = '<textarea rows="{{rows}}" name="{{name}}" id="{{name}}" {{#if readonly}}readonly{{/if}}>{{value}}</textarea>';

  var Input = UIView.extend({
    templateSource: template,

    serialize: function() {
      return {
        value: this.options.value,
        name: this.options.name,
        rows: (this.options.settings && this.options.settings.has('rows')) ? this.options.settings.get('rows') : '12',
        comment: this.options.schema.get('comment'),
        readonly: !this.options.canWrite
      };
    }
  });

  var Component = UIComponent.extend({
    id: 'textarea',
    dataTypes: ['TEXT', 'VARCHAR'],
    variables: [
      // The number of text rows available for the input before scrolling
      {id: 'rows', ui: 'numeric', char_length: 3}
    ],
    Input: Input,
    validate: function(value, options) {
      if (options.schema.isRequired() && _.isEmpty(value)) {
        return 'This field is required';
      }
    },
    list: function(options) {
      return _.isString(options.value) ? options.value.replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '<span class="silver">--</span>';
    }
  });

  return Component;
});
