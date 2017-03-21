//  Textarea Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'core/UIComponent', 'core/UIView', 'core/t'],function(app, UIComponent, UIView, __t) {

  'use strict';

  var template = '<textarea rows="{{rows}}" name="{{name}}" id="{{name}}" placeholder="{{placeholder_text}}" {{#if readonly}}readonly{{/if}}>{{value}}</textarea>';

  var Input = UIView.extend({
    templateSource: template,

    serialize: function() {
      return {
        value: this.options.value,
        name: this.options.name,
        rows: this.options.settings.get('rows'),
        placeholder_text: this.options.settings.get('placeholder_text'),
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
      {id: 'rows', type: 'Number', default_value: 12, ui: 'numeric', char_length: 3},
      {id: 'placeholder_text', default_value:'', type: 'String', ui: 'textinput', char_length:200},
    ],
    Input: Input,
    validate: function(value, options) {
      if (options.schema.isRequired() && _.isEmpty(value)) {
        // TODO: fix this line, it is too repetitive
        // over all the UIs
        return __t('this_field_is_required');
      }
    },
    list: function(options) {
      return _.isString(options.value) ? options.value.replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '<span class="silver">--</span>';
    }
  });

  return Component;
});
