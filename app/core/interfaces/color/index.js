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


define(['app', 'core/UIComponent', 'core/UIView', 'core/t', 'core/interfaces/color/color'], function(app, UIComponent, UIView, __t, Color) {

  'use strict';

  function convertRGBtoHex(r, g, b, a) {
    function toHex(c) {
      var hex = c.toString(16);
      return hex.length == 1 ? '0' + hex : hex;
    }

    var hexValue = toHex(r) + toHex(g) + toHex(b);

    if(a !== undefined) {
      a = Math.round(convertRange(a, { min: 0, max: 1 }, { min: 0, max: 255 }));
      hexValue += toHex(a);
    }

    return hexValue;
  }

  function convertRGBtoHSL(r, g, b, a) {
    if(a === undefined) a = 1;
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

  function convertColor(value, from, to) {
    var rgba;
    var outputValue;

    switch(from) {
      case 'hex':
        rgba = convertHexToRGB(value);
        break;
      case 'rgb':
        var a = value.length === 4 ? value[3] : undefined;
        rgba = { r: value[0], g: value[1], b: value[2], a: a };
        break;
      case 'hsl':
        var a = value.length === 4 ? value[3] : undefined;
        var hsla = { h: value[0], s: value[1], l: value[2], a: a };
        rgba = convertHSLtoRGB(hsla.h, hsla.s, hsla.l, hsla.a);
        break;
    }

    switch(to) {
      case 'hex':
        outputValue = convertRGBtoHex(rgba.r, rgba.g, rgba.b, rgba.a);
        break;
      case 'rgb':
        outputValue = [rgba.r, rgba.g, rgba.b, rgba.a];
        break;
      case 'hsl':
        var rgba = convertRGBtoHSL(rgba.r, rgba.g, rgba.b, rgba.a);
        outputValue = [rgba.r, rgba.g, rgba.b, rgba.a];
        break;
    }

    console.log(value, from, to, outputValue);

    return outputValue;
  }

  function setInputValue(view, type, value, output) {
    // Convert input to RGB
    var rgba;

    switch(type) {
      case 'hex':
        rgba = convertHexToRGB(value);
        break;
      case 'rgb':
        rgba = value;
        break;
      case 'hsl':
        rgba = convertHSLtoRGB(value.h, value.s, value.l, value.a);
        break;
    }

    // Convert RGB to desired output
    var outputValue = '';
    switch(output) {
      case 'hex':
        outputValue = convertRGBtoHex(rgba.r, rgba.g, rgba.b, rgba.a);
        break;
      case 'rgb':
        outputValue = [rgba.r, rgba.g, rgba.b, rgba.a].join();
        break;
      case 'hsl':
        var hsla = convertRGBtoHSL(rgba.r, rgba.g, rgba.b, rgba.a);
        outputValue = [hsla.h, hsla.s, hsla.l, hsla.a].join();
    }

    view.$el.find('.value').val(outputValue);
  }

  function isValid(type, value) {
    switch(type) {
      case 'hex': return isValidHex(value);
      case 'rgb': return isValidRGB(value.r, value.g, value.b, value.a);
      case 'hsl': return isValidHSL(value.h, value.s, value.l, value.a);
      default: return false;
    }
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
        var color;

        switch(type) {
          case 'hex':
            color = event.target.value;
            break;

          case 'rgb':
            color = {
              r: +this.$el.find('input.red').val(),
              g: +this.$el.find('input.green').val(),
              b: +this.$el.find('input.blue').val(),
              a: +this.$el.find('input.alpha').val()
            }
            break;

          case 'hsl':
            color = {
              h: +this.$el.find('input.hue').val(),
              s: +this.$el.find('input.saturation').val(),
              l: +this.$el.find('input.lightness').val(),
              a: +this.$el.find('input.alpha').val()
            }
            break;
        }

        if(isValid(type, color)) {
          setPreviewColor(this, type, color);
          setInputValue(this, type, color, this.options.settings.get('output'));
          hideInvalidMessage(this);
        } else {
          showInvalidMessage(this)
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
              setPreviewColor(this, type, hsla);
              break;
          }
      }
    },

    afterRender: function() {
      //
    },

    serialize: function() {
      var input = this.options.settings.get('input');
      var output = this.options.settings.get('output');
      var value;

      switch(input) {
        case 'hex':
          value = convertColor(this.options.value || '000000', output, input);
          break;
        case 'rgb':
        case 'hsl':
          value = convertColor(this.options.value ? this.options.value.split(',') : [0, 0, 0, 1], output, input);
      }

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
            // TODO: support this:
            // hexWithChar: 'Hex (with `#`)',
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
      return 'listValue';
      // return (options.settings.get('show_color_on_list') === true) ? '<div title="#'+options.value+'" style="background-color:#'+options.value+'; color:#ffffff; height:20px; width:20px; border:1px solid #ffffff;-webkit-border-radius:20px;-moz-border-radius:20px;border-radius:20px;">&nbsp;</div>' : options.value;
    }
  });

  return Component;
});
