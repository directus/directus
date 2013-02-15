//  Text Input Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone'], function(app, Backbone) {

  var Module = {};

  Module.id = 'textinput';
  Module.dataTypes = ['VARCHAR', 'DATE', 'TIME'];

  Module.variables = [
    {id: 'readonly', ui: 'checkbox'}
  ];

  var template = '<label>{{{capitalize name}}}</label>'+
                 '<input type="text" value="{{value}}" name="{{name}}" id="{{name}}" maxLength="{{maxLength}}" class="{{size}}"/>'+
                 '<span class="label char-count hide">{{characters}}</span>';

  Module.Input = Backbone.Layout.extend({

    tagName: 'fieldset',

    template: Handlebars.compile(template),

    events: {
      'focus input': function() { this.$el.find('.label').show(); },
      'keyup input': 'updateMaxLength',
      'blur input': function() { this.$el.find('.label').hide(); }
    },

    updateMaxLength: function(e) {
      var length = this.options.schema.get('char_length') - e.target.value.length;
      this.$el.find('.label').html(length);
    },

    afterRender: function() {
      if (this.options.settings.get("readonly") === "on") this.$("input").prop("readonly",true);
    },

    serialize: function() {
      var length = this.options.schema.get('char_length');
      var value = this.options.value || '';
      return {
        size: (this.options.settings && this.options.settings.has('size')) ? this.options.settings.get('size') : 'large',
        value: value,
        name: this.options.name,
        maxLength: length,
        characters: length - value.length
      };
    }

  });

  Module.validate = function(value) {
    return true;
  };

  Module.list = function(options) {
    return (options.value) ? options.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '';
  };

  return Module;

});