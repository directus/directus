//  Select Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone'],function(app, Backbone) {

  "use strict";

  var Module = {};

  var template = '<select name="{{name}}" {{#if readonly}}disabled{{/if}}><option value="">Select from below</option>{{#options}}<option value="{{key}}" {{#if selected}}selected{{/if}}>{{value}}</option>{{/options}}</select>';

  Module.id = 'select';
  Module.dataTypes = ['VARCHAR', 'INT'];
  Module.variables = [
    {id: 'options', ui: 'textarea', options:{'rows': 25}  }
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
        readonly: !this.options.canWrite
      };
    }

  });

  Module.list = function(options) {
    var val = _.isString(options.value) ? options.value.replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '';
    return val;
  };

  return Module;
});