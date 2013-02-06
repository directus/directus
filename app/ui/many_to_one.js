//  Many To One core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone'], function(app, Backbone) {

  var Module = {};

  Module.id = 'many_to_one';
  Module.dataTypes = ['INT'];

  Module.variables = [
    {id: 'related_table', ui: 'textinput', char_length: 255},
    {id: 'visible_column', ui: 'textinput', char_length: 255}
  ];

  var template = "<label>{{capitalize name}}</label><select></select>";

  Module.Input = Backbone.Layout.extend({

    tagName: 'fieldset',

    template: Handlebars.compile(template),

    serialize: function() {
      return {name: this.options.name};
    },

  });

  Module.list = function(options) {
    return options.value;
  };

  return Module;
});