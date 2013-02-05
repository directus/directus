//  Select Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone'],function(app, Backbone) {

  var Module = {};

  var template = '<label>{{{capitalize name}}}</label><select name="{{name}}">{{#options}}<option value="{{value}}" {{#if selected}}selected{{/if}}>{{title}}</option>{{/options}}</select>';

  Module.id = 'select';
  Module.dataTypes = ['VARCHAR', 'INT'];

  Module.Input = Backbone.Layout.extend({

    template: Handlebars.compile(template),

    tagName: 'fieldset',

    serialize: function() {
      var value = this.options.value;
      var options = _.map(this.options.settings.get('options'), function(item) {
        if (item.value === value) item.selected = true;
        return item;
      });
      console.log(value);
      return {options: options, name: this.options.name};
    }

  });

  Module.list = function(options) {
    var val = _.isString(options.value) ? options.value.replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '';
    return val;
  };

  return Module;
});