//  Text Input Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['app', 'backbone'], function(app, Backbone) {

  "use strict";

  var Module = {};

  Module.id = 'textinput';
  Module.dataTypes = ['VARCHAR', 'DATE', 'TIME', 'ENUM'];

  Module.variables = [
    {id: 'readonly', ui: 'checkbox'},
    {id: 'size', ui: 'select', options: {options: {'large':'Large','medium':'Medium','small':'Small'} }},
    {id: 'validation_regex', ui: 'textinput', char_length:200},
    {id: 'validation_message', ui: 'textinput', char_length:200}
  ];

  var template = '<input type="text" value="{{value}}" name="{{name}}" id="{{name}}" maxLength="{{maxLength}}" class="{{size}}" {{#if readonly}}readonly{{/if}}/>';
                // <span class="label char-count hide">{{characters}}</span>';

  Module.Input = Backbone.Layout.extend({

    tagName: 'div',

    attributes: {
      'class': 'field'
    },

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

      // Fill in default value
      if (
        this.options.model.isNew() &&
        this.options.schema.has('default_value')) {
          value = this.options.schema.get('default_value');
      }

      return {
        size: (this.options.settings && this.options.settings.has('size')) ? this.options.settings.get('size') : 'large',
        value: value,
        name: this.options.name,
        maxLength: length,
        characters: length - value.toString().length,
        comment: this.options.schema.get('comment'),
        readonly: (this.options.settings.get('readonly') === "1" || !this.options.canWrite)
      };
    }
  });

  Module.validate = function(value, options) {
    var validationMessage = options.settings.get('validation_message') || app.DEFAULT_VALIDATION_MESSAGE;
    if (options.schema.get('required') && _.isEmpty(value)) {
      return validationMessage;
    }
    if (options.settings.has('validation_regex')) {
      var regex = new RegExp(options.settings.get('validation_regex'));
      if (!regex.test(value)) {
        return validationMessage;
      }
    }
    //return 'HELL NO';
  };

  Module.list = function(options) {
    return (options.value) ? options.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '';
  };

  return Module;

});