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


define(['app', 'core/UIComponent', 'core/UIView', 'core/t'], function(app, UIComponent, UIView, __t) {

  'use strict';

  var defaultPalette = [
    '#f44336',
    '#e91e63',
    '#9c27b0',
    '#3f51b5',
    '#2196f3',
    '#4caf50',
    '#ffeb3b',
    '#ff9800',
    '#9e9e9e',
    '#000000',
    '#ffffff'
  ];

  var Input = UIView.extend({
    template: 'color/input',

    events: {
      // 'change .color-text': function(e) {
      //   var color_str = e.target.value;
      //   if(color_str.match(/^#[a-f0-9]{6}$/i) !== null){
      //     this.$el.find('input.color-box').val(color_str);
      //     this.$el.find('span.invalid').html("");
      //     this.$el.find('input.color-text').removeClass("invalid");
      //   } else {
      //     this.$el.find('span.invalid').html(__t('color_invalid_color')+" <i>"+__t('example_abbr')+". #bbbbbb</i>");
      //     this.$el.find('input.color-text').addClass("invalid");
      //   }
      // },
      // 'change .color-box': function(e) {
      //   var color_str = e.target.value;
      //   this.$el.find('input.color-text').val(color_str);
      //   this.$el.find('span.invalid').html("");
      //   this.$el.find('input.color-text').removeClass("invalid");
      // },
      'input .color-text': function(event) {
        var color = event.target.value;
        this.$el.find('button').removeClass('active');
        this.$el.find('button[data-color=' + color + ']').addClass('active');
      },
      'click .color-select': function(event) {
        var button = event.target.className === 'material-icons' ? event.target.parentNode : event.target;
        this.$el.find('input').val(button.getAttribute('data-color'));
        this.$el.find('button').removeClass('active');
        button.classList.add('active');
      }
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
        palette: this.options.settings.get('palette').split(',')
      };
    },

    initialize: function() {
      //
    }
  });

  var Component = UIComponent.extend({
    id: 'color',
    dataTypes: ['VARCHAR'],
    variables: [
      // Disables editing of the field while still letting users see the value
      {id: 'readonly', type: 'Boolean', default_value: false, ui: 'checkbox'},
      // Shows a color box representation on the Item Listing page
      {id: 'show_color_on_list', type: 'Boolean', default_value: true, ui: 'checkbox'},
      // Allow palette CSV
      {id: 'palette', type: 'VARCHAR', default_value: defaultPalette.join(), ui: 'textinput'}
    ],
    Input: Input,
    validate: function(value, options) {
      if (options.schema.isRequired() && _.isEmpty(value)) {
        return __t('this_field_is_required');
      }
    },
    list: function(options) {
      return (options.settings.get('show_color_on_list') === true) ? '<div title="#'+options.value+'" style="background-color:#'+options.value+'; color:#ffffff; height:20px; width:20px; border:1px solid #ffffff;-webkit-border-radius:20px;-moz-border-radius:20px;border-radius:20px;">&nbsp;</div>' : options.value;
    }
  });

  return Component;
});
