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

  /**
   * Validates color
   *   Supports transparent, css color names, hex values (3, 6 and 8), hsl(a) and rgb(a)
   * @param  {String} color CSS color value
   * @return {Boolean}
   */
  function isValidHex(color) {
    if(!color || typeof color !== 'string') return false;

    // Validate hex values
    if(color.substring(0, 1) === '#') {
      return validateHex(color);
    }

    // Validate rgb
    if(color.substring(0, 3) === 'rgb' && color.substring(0, 4) !== 'rgba') {
      return validateRGB(color);
    }

    // Validate rgba
    if(color.substring(0, 4) === 'rgba') {

    }

    return validateTextColor(color);

    return false;
  }

  function validateRGB(color) {
    return /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.test(color);
  }

  function validateHex(color) {
    if(color.length === 4 || color.length === 7 || color.length === 9) {
      switch(color.length) {
        case 4: return /^#[0-9A-F]{3}$/i.test(color);
        case 7: return /^#[0-9A-F]{6}$/i.test(color);
        case 9: return /^#[0-9A-F]{8}$/i.test(color);
      }
    } else {
      return false;
    }
  }

  function validateTextColor(color) {
    var cssColorsArray = ['AliceBlue', 'AntiqueWhite', 'Aqua', 'Aquamarine', 'Azure', 'Beige', 'Bisque', 'Black', 'BlanchedAlmond', 'Blue', 'BlueViolet', 'Brown', 'BurlyWood', 'CadetBlue', 'Chartreuse', 'Chocolate', 'Coral', 'CornflowerBlue', 'Cornsilk', 'Crimson', 'Cyan', 'DarkBlue', 'DarkCyan', 'DarkGoldenRod', 'DarkGray', 'DarkGrey', 'DarkGreen', 'DarkKhaki', 'DarkMagenta', 'DarkOliveGreen', 'Darkorange', 'DarkOrchid', 'DarkRed', 'DarkSalmon', 'DarkSeaGreen', 'DarkSlateBlue', 'DarkSlateGray', 'DarkSlateGrey', 'DarkTurquoise', 'DarkViolet', 'DeepPink', 'DeepSkyBlue', 'DimGray', 'DimGrey', 'DodgerBlue', 'FireBrick', 'FloralWhite', 'ForestGreen', 'Fuchsia', 'Gainsboro', 'GhostWhite', 'Gold', 'GoldenRod', 'Gray', 'Grey', 'Green', 'GreenYellow', 'HoneyDew', 'HotPink', 'IndianRed', 'Indigo', 'Ivory', 'Khaki', 'Lavender', 'LavenderBlush', 'LawnGreen', 'LemonChiffon', 'LightBlue', 'LightCoral', 'LightCyan', 'LightGoldenRodYellow', 'LightGray', 'LightGrey', 'LightGreen', 'LightPink', 'LightSalmon', 'LightSeaGreen', 'LightSkyBlue', 'LightSlateGray', 'LightSlateGrey', 'LightSteelBlue', 'LightYellow', 'Lime', 'LimeGreen', 'Linen', 'Magenta', 'Maroon', 'MediumAquaMarine', 'MediumBlue', 'MediumOrchid', 'MediumPurple', 'MediumSeaGreen', 'MediumSlateBlue', 'MediumSpringGreen', 'MediumTurquoise', 'MediumVioletRed', 'MidnightBlue', 'MintCream', 'MistyRose', 'Moccasin', 'NavajoWhite', 'Navy', 'OldLace', 'Olive', 'OliveDrab', 'Orange', 'OrangeRed', 'Orchid', 'PaleGoldenRod', 'PaleGreen', 'PaleTurquoise', 'PaleVioletRed', 'PapayaWhip', 'PeachPuff', 'Peru', 'Pink', 'Plum', 'PowderBlue', 'Purple', 'Red', 'RosyBrown', 'RoyalBlue', 'SaddleBrown', 'Salmon', 'SandyBrown', 'SeaGreen', 'SeaShell', 'Sienna', 'Silver', 'SkyBlue', 'SlateBlue', 'SlateGray', 'SlateGrey', 'Snow', 'SpringGreen', 'SteelBlue', 'Tan', 'Teal', 'Thistle', 'Tomato', 'Turquoise', 'Violet', 'Wheat', 'White', 'WhiteSmoke', 'Yellow', 'YellowGreen'].map(value => value.toLowerCase());

    if(color === 'transparent') return true;
    if(cssColorsArray.indexOf(color.toLowerCase) !== -1) return true;
    return false;
  }

  var Input = UIView.extend({
    template: 'color/input',

    events: {
      'click .color-preview': function(event) {
        // Remove value from input
        this.$el.find('input').val('');

        // Clear color preview
        this.$el.find('.color-preview')[0].style.backgroundColor = 'transparent';

        // Disable active button
        this.$el.find('button').removeClass('active');
      },
      'input .color-text': function(event) {
        var color = event.target.value;

        // Activate button if color matches
        this.$el.find('button').removeClass('active');
        this.$el.find('button[data-color="' + color + '"]').addClass('active');

        // Update preview color
        this.$el.find('.color-preview')[0].style.backgroundColor = color;
      },
      'click .color-select': function(event) {
        // Active clicked on button
        var button = event.target.className === 'material-icons' ? event.target.parentNode : event.target;
        this.$el.find('input').val(button.getAttribute('data-color'));
        this.$el.find('button').removeClass('active');
        button.classList.add('active');

        // Set preview color
        this.$el.find('.color-preview')[0].style.backgroundColor = button.getAttribute('data-color');
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
