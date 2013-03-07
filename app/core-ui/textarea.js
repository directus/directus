//  Textarea Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone'],function(app, Backbone) {

  var Module = {};

  var template = '<label>{{{capitalize name}}}</label><textarea rows="{{rows}}" name="{{name}}" id="{{name}}">{{value}}</textarea>';

  Module.id = 'textarea';
  Module.dataTypes = ['TEXT', 'VARCHAR'];

  Module.variables = [
    {id: 'rows', ui: 'numeric', char_length: 3}
  ];

  Module.options = {
    options: []
  };

  Module.Input = Backbone.Layout.extend({

    tagName: 'fieldset',

    template: Handlebars.compile(template),

    serialize: function() {
      return {
        value: this.options.value,
        name: this.options.name,
        rows: (this.options.settings && this.options.settings.has('rows')) ? this.options.settings.get('rows') : '5'
      };
    }

  });

  Module.list = function(options) {
    var val = _.isString(options.value) ? options.value.replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '';
    return val;
  };

  return Module;
});