//  Text Input Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

// Attribute          Type              Contains                                Example
// -------------------------------------------------------------------------------------------------------------------------------------
// options.schema     Backbone.Model    Structure/Schema for this table row     options.schema.get('type') [column_name, comment, type]
// options.model      Backbone.Model    Data/Model for this table row           options.model.get('id') [any column in current table row]
// options.value      String            Value for this field
// options.settings   Backbone.Model    Saved values for current UI options     options.settings.get('placeholder_text') [any key from this UI options]
// options.name       String            Field name
/*jshint multistr: true */

define(['app', 'core/UIView'], function(app, UIView) {

  'use strict';

  var Module = {};

  // Module.id is the name for this UI
  Module.id = 'textinput';

  // Supported Data Types for this UI
  Module.dataTypes = ['VARCHAR', 'DATE', 'TIME', 'ENUM'];

  // UI Options that Can be set in Column Settings Page
  Module.variables = [
    // Disables editing of the field while still letting users see the value (true = readonly)
    {id: 'readonly', ui: 'checkbox'},
    // Adjusts the max width of the input (Small, Medium, Large)
    {id: 'size', ui: 'select', options: {options: {'large':'Large','medium':'Medium','small':'Small'} }},
    // Grayed out default placeholder text in the input when it's empty
    {id: 'placeholder_text', ui: 'textinput', char_length:200},
    // Chooses the type of validation used on this field
    // * Character Blacklist: Choose the specific characters **not** allowed in the input
    // * Character Whitelist: Choose the specific characters allowed in the input
    // * RegEx: Create a regular expression to validate the value. Useful for emails, phone number formatting, or almost anything
    {id: 'validation_type', ui: 'select', options: {options: {'bl':'Character Blacklist','wl':'Character Whitelist','rgx':'Regex'} }, def:'rgx'},
    // Holds the CSV list of Whitelist/Blacklist characters or the RegEx value (based on the above option)
    {id: 'validation_string', ui: 'textinput', char_length:200, comment: 'All characters below will be enforced'},
    // A message that is shown to the user if the validation fails
    {id: 'validation_message', ui: 'textinput', char_length:200}
  ];

  // Template Used for this UI
  var template = '<div class="char-count-container {{size}}"> \
                    <input type="text" placeholder="{{placeholder}}" value="{{value}}" name="{{name}}" id="{{name}}" maxLength="{{maxLength}}" class="{{size}}" {{#if readonly}}readonly{{/if}}/> \
                  <span class="char-count hide">{{characters}}</span></div>';

  Module.Input = UIView.extend({
    template: Handlebars.compile(template),

    // Event Declarations
    events: {
      // Show character counter when input gains focus
      'focus input': function() { this.$el.find('.char-count').removeClass('hide'); },
      // Update character counter when input changes
      'input input': 'updateMaxLength',
      // Validate keypress against validation_string
      'keypress input': 'validateString',
      // Hide character counter when input loses focus
      'blur input': function() { this.$el.find('.char-count').addClass('hide'); }
    },

    // Update the character counter with the remaining characters available
    updateMaxLength: function(e) {
      var length = this.options.schema.get('char_length') - e.target.value.length;
      this.$el.find('.char-count').html(length);
    },

    // afterRender gets called after the template is rendered
    afterRender: function() {
      if (this.options.settings.get("readonly") === "on") this.$("input").prop("readonly",true);
    },

    // Called before template is rendered, serialize returns an object that gets used as data for template string
    serialize: function() {
      var length = this.options.schema.get('char_length');
      var value = this.options.value || '';

      // Fill in default value if this column has a default value.
      if ( !value && this.options.model.isNew() && this.options.schema.has('default_value')) {
          value = this.options.schema.get('default_value');
      }

      return {
        size: (this.options.settings && this.options.settings.has('size')) ? this.options.settings.get('size') : 'large',
        value: value,
        name: this.options.name,
        maxLength: length,
        characters: length - value.toString().length,
        comment: this.options.schema.get('comment'),
        readonly: ((this.options.settings && this.options.settings.get('readonly') === "1") || !this.options.canWrite),
        placeholder: (this.options.settings) ? this.options.settings.get('placeholder_text') : ''
      };
    },
    // Validate String  Checks the passed in value against validation_string
    // @param e : keypress event object
    validateString: function(e) {
      var validationMessage = this.options.settings.get('validation_message') || app.DEFAULT_VALIDATION_MESSAGE;
      var chars;
      switch(this.options.settings.get('validation_type')) {
        case ('bl') :
          chars = this.options.settings.get('validation_string').split("");
          return $.inArray(String.fromCharCode(e.which), chars) == -1;
        case ('wl') :
          chars = this.options.settings.get('validation_string').split("");
          return $.inArray(String.fromCharCode(e.which), chars) != -1;
      }

      return true;
    }
  });

  // Validate gets called when model is attepting to save. It returns an error message if there is a validation issue, none if it is valid
  // @param value : String : Value for this UI
  // @param options : Object : Contains Options for this UI (collection [TableCollection], model [EntriesModel], schema, settings)
  Module.validate = function(value, options) {
    var validationMessage = options.settings.get('validation_message') || app.DEFAULT_VALIDATION_MESSAGE;
    if (options.schema.get('required') && _.isEmpty(value)) {
      return validationMessage;
    }

    switch(options.settings.get('validation_type')) {
      case ('wl') :
        var Regex = new RegExp("^["+options.settings.get('validation_string')+"]+$");
        if(!value.match(Regex)) {
          return validationMessage;
        }
        break;
      case ('bl') :
        var chars = options.settings.get('validation_string').split("");
        if(chars.length > 0 && value.match(chars.join("|"))) {
          return validationMessage;
        }
        break;
      case ('rgx'):
        var regex = new RegExp(options.settings.get('validation_string'));
        if (!regex.test(value)) {
          return validationMessage;
        }
        break;
    }
  };

  // Returns String That should be used to represent this UI when being listed as part of a table
  // @param options : Object : Contains Options/Attributes for this UI (value, collection [TableCollection], model [EntriesModel], schema, settings)
  Module.list = function(options) {
    return (options.value) ? options.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0,100) : '';
  };

  return Module;
});
