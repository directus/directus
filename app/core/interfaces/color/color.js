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
    'f44336',
    'e91e63',
    '9c27b0',
    '3f51b5',
    '2196f3',
    '4caf50',
    'ffeb3b',
    'ff9800',
    '9e9e9e',
    '000000',
    'ffffff'
  ];

  /**
   * Validates hex value
   * @param  {String} color hex color value
   * @return {Boolean}
   */
  function isValidHex(color) {
    if(!color || typeof color !== 'string') return false;

    // Validate hex values
    if(color.substring(0, 1) === '#') color = color.substring(1);

    switch(color.length) {
      case 3: return /^[0-9A-F]{3}$/i.test(color);
      case 6: return /^[0-9A-F]{6}$/i.test(color);
      case 8: return /^[0-9A-F]{8}$/i.test(color);
      default: return false;
    }

    return false;
  }

  /**
   * Validates RGB(a) value
   * @param  {Number} r
   * @param  {Number} g
   * @param  {Number} b
   * @param  {Number} [a=0]
   * @return {Boolean}
   */
  function isValidRGB(r, g, b, a) {
    a = a || 0;
    if(typeof r !== 'number' || typeof g !== 'number' || typeof b !== 'number' || typeof a !== 'number') return false;

    var regex = /\b(1?[0-9]{1,2}|2[0-4][0-9]|25[0-5])\b/;
    if(
      regex.test(r) &&
      regex.test(g) &&
      regex.test(b) &&
      a >= 0 && a <= 1
    ) return true;

    return false;
  }

  /**
   * Validates HSL(a)
   * @param  {Number} h
   * @param  {Number} s
   * @param  {Number} l
   * @param  {Number} a
   * @return {Boolean}
   */
  function isValidHSL(h, s, l, a) {
    a = a || 0;
    if(typeof h !== 'number' || typeof s !== 'number' || typeof l !== 'number' || typeof a !== 'number') return false;

    if(
      h >= 0 && h <= 360 &&
      s >= 0 && s <= 100 &&
      l >= 0 && l <= 100 &&
      a >= 0 && a <= 1
    ) return true;

    return false;
  }

  /**
  * Convert value from one range to another
  * @param {Number} value value to convert
  * @param {Object} oldRange min, max of values range
  * @param {Object} newRange min, max of desired range
  * @return {Number} value converted to other range
  */
  function convertRange(value, oldRange, newRange) {
    return ((value - oldRange.min) * (newRange.max - newRange.min)) / (oldRange.max - oldRange.min) + newRange.min;
  }

  /**
   * Converts hex value (without #) to rgb(a) object
   * @param  {String} hex 3, 6 or 8 digit hex (without #)
   * @return {Object} rgba values
   */
  function convertHexToRGB(hex) {
    var fullHex = hex;
    var rgba = {};

    if(hex.length === 3) {
      // Convert length === 3 to length === 6
      var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      fullHex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
      });
    }

    if(hex.length === 8) {
      // Save alpha value to object and remove last two characters (alpha)
      rgba.a = convertRange(parseInt(hex.substring(hex.length - 2), 16), { min: 0, max: 255 }, { min: 0, max: 1 });
      fullHex = hex.substring(0, hex.length - 2);
    }

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    rgba.r = parseInt(result[1], 16);
    rgba.g = parseInt(result[2], 16);
    rgba.b = parseInt(result[3], 16);
    rgba.a = rgba.a || 1;

    return rgba;
  }

  function convertRGBtoHSL(r, g, b, a) {
    a = a || 1;
    r = r / 255;
    g = g / 255;
    b = b / 255;

    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);

    var hue;
    var saturation;
    var lightness = (max + min) / 2;

    if(max === min) {
      hue = saturation = 0;
    } else {
      var delta = max - min;
      saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
      switch(max) {
        case r:
          hue = (g - b) / delta + (g < b ? 6 : 0);
          break;
        case g:
          hue = (b - r) / delta + 2;
          break;
        case b:
          hue = (r - g) / delta + 4;
          break;
      }

      hue = hue / 6;
    }

    return {
      h: convertRange(hue, { min: 0, max: 1 }, { min: 0, max: 360 }),
      s: Math.round(saturation * 100),
      l: Math.round(lightness * 100),
      a: a
    }
  }

  function showInvalidMessage(view) {
    view.$el.find('.color-invalid')[0].innerHTML = __t('confirm_invalid_value');
    setPreviewColor(view, 'rgb', {r: 255, g: 255, b: 255, a: 0});
  }

  function hideInvalidMessage(view) {
    view.$el.find('.color-invalid')[0].innerHTML = '';
  }

  function setPreviewColor(view, type, color) {
    switch(type) {
      case 'hex':
        color = '#' + color;
        break;
      case 'rgb':
        if(color.a === undefined) color.a = 1;
        color = 'rgba(' + color.r + ', ' + color.g + ', ' + color.b + ', ' + color.a + ')';
        break;
      case 'hsl':
        if(color.a === undefined) color.a = 1;
        color = 'hsla(' + color.h + ', ' + color.s + '%, ' + color.l + '%, ' + color.a + ')';
        break;
    }

    view.$el.find('.color-preview')[0].style.boxShadow = 'inset 0 0 0 30px ' + color;
  }

  var Input = UIView.extend({
    template: 'color/input',

    events: {
      // Disable enter button (would select first button after input == palette option)
      'keypress input': function(event) {
        if((event.which && event.which == 13) || (event.keyCode && event.keyCode == 13)) return false;
      },

      'click .color-preview': function(event) {
        // Remove value from input
        this.$el.find('input').val('');

        // Clear color preview
        setPreviewColor(this, 'rgb', {r: 255, g: 255, b: 255, a: 0});

        // Disable active button
        this.$el.find('button').removeClass('active');
      },

      // Validate value on change
      'input .color-text': function(event) {
        var type = this.options.settings.get('input');

        switch(type) {
          case 'hex':
            var color = event.target.value;
            setPreviewColor(this, type, color);
            !isValidHex(color) && color.length !== 0 ? showInvalidMessage(this) : hideInvalidMessage(this);
            break;

          case 'rgb':
            var color = {
              r: +this.$el.find('input.red').val() || 0,
              g: +this.$el.find('input.green').val() || 0,
              b: +this.$el.find('input.blue').val() || 0,
              a: +this.$el.find('input.alpha').val() || 1
            }
            setPreviewColor(this, type, color);
            !isValidRGB(color.r, color.g, color.b, color.a) ? showInvalidMessage(this) : hideInvalidMessage(this);
            break;

          case 'hsl':
            var color = {
              h: +this.$el.find('input.hue').val() || 0,
              s: +this.$el.find('input.saturation').val() || 0,
              l: +this.$el.find('input.lightness').val() || 0,
              a: +this.$el.find('input.alpha').val() || 1
            }
            setPreviewColor(this, type, color);
            !isValidHSL(color.h, color.s, color.l, color.a) ? showInvalidMessage(this) : hideInvalidMessage(this);
            break;
        }
      },

      'click .color-select': function(event) {
          // Activate clicked on button
          var button = event.target.className === 'material-icons' ? event.target.parentNode : event.target;
          this.$el.find('button').removeClass('active');
          button.classList.add('active');

          // Fill input(s)
          var type = this.options.settings.get('input');
          var buttonValue = button.getAttribute('data-color');
          switch(type) {
            case 'hex':
              this.$el.find('input').val(buttonValue);
              setPreviewColor(this, type, buttonValue);
              break;
            case 'rgb':
              var rgba = convertHexToRGB(buttonValue);
              this.$el.find('input.red').val(rgba.r);
              this.$el.find('input.green').val(rgba.g);
              this.$el.find('input.blue').val(rgba.b);
              this.$el.find('input.alpha').val(rgba.a);
              setPreviewColor(this, type, rgba);
              break;
            case 'hsl':
              var rgba = convertHexToRGB(buttonValue);
              var hsla = convertRGBtoHSL(rgba.r, rgba.g, rgba.b, rgba.a);
              this.$el.find('input.hue').val(hsla.h);
              this.$el.find('input.saturation').val(hsla.s);
              this.$el.find('input.lightness').val(hsla.l);
              this.$el.find('input.alpha').val(hsla.a);
              console.log(type, hsla)
              setPreviewColor(this, type, hsla);
              break;
          }
      }
    },

    serialize: function() {
      var value = this.options.value || '';

      var input = this.options.settings.get('input');

      return {
        value: value,
        name: this.options.name,
        comment: this.options.schema.get('comment'),
        palette: this.options.settings.get('palette').length ? this.options.settings.get('palette').split(',') : false,
        readonly: this.options.settings.get('readonly'),
        input: input,
        output: this.options.settings.get('output'),
        hex: input === 'hex',
        rgb: input === 'rgb',
        hsl: input === 'hsl',
        alpha: this.options.settings.get('allow_alpha')
      };
    }
  });

  var Component = UIComponent.extend({
    id: 'color',
    dataTypes: ['VARCHAR'],
    variables: [
      // Disables editing of the field while still letting users see the value
      {id: 'readonly', type: 'Boolean', default_value: false, ui: 'checkbox'},
      // TODO: Add 'only allow from palette' option
      {
        id: 'input',
        type: 'String',
        default_value: 'hex',
        ui: 'select',
        options: {
          options: {
            hex: 'Hex',
            rgb: 'RGB',
            hsl: 'HSL'
          }
        }
      },
      {
        id: 'output',
        type: 'String',
        default_value: 'hex',
        ui: 'select',
        options: {
          options: {
            hex: 'Hex',
            hexWithChar: 'Hex (with `#`)',
            rgb: 'RGB',
            hsl: 'HSL'
          }
        }
      },
      {
        id: 'listing',
        type: 'String',
        default_value: 'swatch',
        ui: 'select',
        options: {
          options: {
            swatch: 'Color Swatch',
            value: 'Value'
          }
        }
      },
      {
        id: 'allow_alpha',
        type: 'Boolean',
        default_value: false,
        ui: 'checkbox'
      },
      {
        id: 'palette',
        type: 'String',
        ui: 'tags'
      }
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
