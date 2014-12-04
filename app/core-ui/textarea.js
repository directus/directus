//  Textarea Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone'],function(app, Backbone) {

  "use strict";

  var Module = {};

  var template = '<textarea rows="{{rows}}" name="{{name}}" id="{{name}}" {{#if readonly}}readonly{{/if}}>{{value}}</textarea>';

  Module.id = 'textarea';
  Module.dataTypes = ['TEXT', 'VARCHAR'];

  Module.variables = [
    {id: 'rows', ui: 'numeric', char_length: 3}
  ];

  Module.Input = Backbone.Layout.extend({

    tagName: 'div',

    attributes: {
      'class': 'field'
    },

    template: Handlebars.compile(template),

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

  Module.validate = function(value, options) {
    if (options.schema.isRequired() && _.isEmpty(value)) {
      return 'This field is required';
    }
  };

  Module.list = function(options) {
    var val = _.isString(options.value) ? options.value.replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '<span class="silver">--</span>';
    return val;
  };

  return Module;
});