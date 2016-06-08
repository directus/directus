//  Select Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone'],function(app, Backbone) {

  "use strict";

  var Module = {};

  var template = '<select name="{{name}}" style="margin-top: 4px;margin-bottom: 6px;" {{#if readonly}}disabled{{/if}}>{{#if allow_null}}<option value="">{{placeholder_text}}</option>{{/if}}{{#options}}<option value="{{key}}" {{#if selected}}selected{{/if}}>{{value}}</option>{{/options}}</select>';

  Module.id = 'select';
  Module.dataTypes = ['VARCHAR', 'INT'];
  Module.variables = [
    {id: 'options', ui: 'textarea', options:{'rows': 25}, comment: "Enter JSON key value pairs with the saved value and text displayed."},
    {id: 'allow_null', ui: 'checkbox'},
    {id: 'placeholder_text', ui: 'textinput', char_length: 255, required: false, comment: "Enter Placeholder Text"}
  ];

  Module.Input = Backbone.Layout.extend({

    template: Handlebars.compile(template),

    tagName: 'div',

    attributes: {
      'class': 'field'
    },

    serialize: function() {
      var selectedValue = this.options.value;
      var options = this.options.settings.get('options');

      if (_.isString(options)) {
        options = $.parseJSON(options);
      }

      options = _.map(options, function(value, key) {
        var item = {};
        item.value = value;
        item.key = key;
        item.selected = (item.key == selectedValue);
        return item;
      });

      return {
        options: options,
        name: this.options.name,
        comment: this.options.schema.get('comment'),
        readonly: !this.options.canWrite,
        allow_null: this.options.settings.get('allow_null'),
        placeholder_text: (this.options.settings.get('placeholder_text')) ?  this.options.settings.get('placeholder_text') : "Select from Below"
      };
    }

  });

  Module.validate = function(value, options) {
    if (options.schema.isRequired() && !value && value != 0) {
      return 'This field is required';
    }
  };

  Module.list = function(options) {
    var val = _.isString(options.value) ? options.value.replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '';
    return val;
  };

  return Module;
});
