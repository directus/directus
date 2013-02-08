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
    {id: 'related_table', ui: 'textinput', char_length: 64},
    {id: 'visible_column', ui: 'textinput', char_length: 64}
  ];

  var template = '<label>{{capitalize name}}</label><select name="{{name}}">{{#data}}<option value="{{id}}" {{#if selected}}selected{{/if}}>{{name}}</option>{{/data}}</select>';

  Module.Input = Backbone.Layout.extend({

    tagName: 'fieldset',

    template: Handlebars.compile(template),

    serialize: function() {
      var data = this.collection.map(function(model) {
        return {id: model.id, name: model.get(this.column), selected: (model.id === this.options.value)};
      }, this);
      return {name: this.options.name, data: data};
    },

    initialize: function(options) {
      var relatedTable = options.settings.get('related_table');
      this.column = options.settings.get('visible_column');
      this.collection = app.entries[relatedTable];
      console.log(this, relatedTable);
      this.collection.fetch();
      this.collection.on('reset', this.render, this);
    }

  });

  Module.list = function(options) {
    return options.value;
  };

  return Module;
});