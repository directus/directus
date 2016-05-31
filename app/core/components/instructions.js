//  Color core UI component
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
// options.settings   Backbone.Model    Saved values for current UI options     options.settings.get('length') [any key from this UI options]
// options.name       String            Field name

/*jshint multistr: true */

define(['app', 'core/UIComponent', 'core/UIView'], function(app, UIComponent, UIView) {

  'use strict';

  var template =  '<style type="text/css"> \
                  .instructions-ui-content { \
                    line-height: 20px; \
                    max-width: 675px; \
                  } \
                  .instructions-ui-content h1 { \
                    margin: 10px 0 10px 0; \
                  } \
                  </style> \
                  <div class="instructions-ui-content">{{{instructions}}}</div>';

  var Input = UIView.extend({
    templateSource: template,

    events: {
      // 'change .color-box': function(e) {
      //   var color_str = e.target.value;
      //   this.$el.find('input.color-text').val(color_str);
      //   this.$el.find('span.invalid').html("");
      //   this.$el.find('input.color-text').removeClass("invalid");
      // }
    },

    afterRender: function() {
      //
    },

    serialize: function() {
      var value = this.options.value || '';

      return {
        value: value,
        name: this.options.name,
        comment: this.options.schema.get('comment'),
        instructions: (this.options.settings && this.options.settings.has('instructions')) ? this.options.settings.get('instructions') : 'Please have your admin setup this field.'
      };
    },

    initialize: function() {
      //
    }
  });

  var Component = UIComponent.extend({
    id: 'instructions',
    dataTypes: ['VARCHAR', 'TEXT'],
    variables: [
      {id: 'instructions', ui: 'wysiwyg', options: {'h1':true,'ul':true,'ol':true }}
    ],
    Input: Input,
    list: function(options) {
      var instructions = (options.settings && options.settings.has('instructions'))? options.settings.get('instructions') : "...";
      var regex = /(<([^>]+)>)/ig;

      return instructions.replace(regex, "");
    }
  });

  return new Component();
});
