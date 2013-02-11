//  Text Input Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone'], function(app, Backbone) {

  var Module = {};

  Module.id = 'radiobuttons';
  Module.dataTypes = ['VARCHAR'];

  Module.variables = [
    {id: 'options', ui: 'textinput', 'char_length': 100},
  ];

  var template = '<label>{{{capitalize name}}}</label>{{#options}}<input type="radio" name="{{../name}}" value="{{value}}" {{#if selected}}checked{{/if}}>{{value}}{{/options}}';

  Module.Input = Backbone.Layout.extend({

    template: Handlebars.compile(template),

    tagName: 'fieldset',

    serialize: function() {
      var options = _.map(this.options.settings.get('options').split(','), function(item) {
        return {value: item, selected: (item === this.options.value)};
      }, this);


      console.log(options);

      return {name: this.options.name, options: options};
    }

  });

  Module.list = function(options) {
    return options.value;
  };

  return Module;

});