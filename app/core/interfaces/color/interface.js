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

define(['core/UIView', 'core/t', 'core/interfaces/color/lib/color'], function(UIView, __t, Color) {
  'use strict';

  function setPreviewColor(view, color) {
    if (!view.options.settings.get('palette_only')) {
      var rgbString = color.rgb.length === 4 ? 'rgba(' + color.rgb.join() + ')' : 'rgb(' + color.rgb.join() + ')';
      view.$el.find('.color-preview')[0].style.boxShadow = 'inset 0 0 0 30px ' + rgbString + ', 1px 1px 2px 0px rgba(0,0,0,0.4)';
    }
  }

  function setInputValue(view, color, output) {
    view.$('.value').val(color[output]);
    view.model.set(view.name, color[output]);
  }

  function showInvalidMessage(view) {
    view.$el.find('.color-invalid')[0].innerHTML = __t('confirm_invalid_value');
    setPreviewColor(view, Color([0, 0, 0, 0], 'rgb'));
  }

  function hideInvalidMessage(view) {
    view.$el.find('.color-invalid')[0].innerHTML = '';
  }

  return UIView.extend({
    template: 'color/input',

    events: {
      // Disable enter button (would select first button after input == palette option)
      'keypress input': function (event) {
        if ((event.which && event.which == 13) || (event.keyCode && event.keyCode == 13)) {
          return false;
        }
      },

      'click .color-preview': function (event) {
        // Remove value from input
        this.$('input').val('');
        this.model.set(this.name, '');

        // Reset color preview to black
        setPreviewColor(this, Color([0,0,0], 'rgb'));

        // Disable active button
        this.$el.find('button').removeClass('active');
      },

      // Validate value on change
      'input .color-text': function(event) {
        var input = this.options.settings.get('input');
        var allowAlpha = this.options.settings.get('allow_alpha');
        var color;
        var alphaValid = true;

        switch (input) {
          case 'hex':
            color = Color(event.target.value, input);
            if (!allowAlpha && color.length === 4) alphaValid = false;
            if (!allowAlpha && color.length === 8) alphaValid = false;
            break;

          case 'rgb':
            var values = [
              +this.$el.find('input.red').val(),
              +this.$el.find('input.green').val(),
              +this.$el.find('input.blue').val()
            ];

            if (this.$el.find('input.alpha').val()) {
              values.push(+this.$el.find('input.alpha').val());
            }

            color = Color(values, input);
            if (!allowAlpha && color.length === 4) {
              alphaValid = false;
            }

            break;

          case 'hsl':
            var values = [
              +this.$el.find('input.hue').val(),
              +this.$el.find('input.saturation').val(),
              +this.$el.find('input.lightness').val()
            ];
            if (this.$el.find('input.alpha').val()) {
              values.push(+this.$el.find('input.alpha').val());
            }

            color = Color(values, input);
            if (!allowAlpha && color.length === 4) {
              alphaValid = false;
            }

            break;
        }

        if (alphaValid && color) {
          setPreviewColor(this, color);
          setInputValue(this, color, this.options.settings.get('output'));
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
          var input = this.options.settings.get('input');
          var buttonValue = button.getAttribute('data-color');
          var color = Color(buttonValue, 'hex');

          switch (input) {
            case 'hex':
              this.$el.find('input').val(buttonValue);

              break;
            case 'rgb':
              var rgba = color.rgb;

              if (rgba.length !== 4) {
                rgba[3] = 1;
              }

              this.$el.find('input.red').val(rgba[0]);
              this.$el.find('input.green').val(rgba[1]);
              this.$el.find('input.blue').val(rgba[2]);
              this.$el.find('input.alpha').val(rgba[3]);

              break;
            case 'hsl':
              var hsla = color.hsl;

              if (hsla.length !== 4) {
                hsla[3] = 1;
              }

              this.$('input.hue').val(hsla[0]);
              this.$('input.saturation').val(hsla[1]);
              this.$('input.lightness').val(hsla[2]);
              this.$('input.alpha').val(hsla[3]);

              break;
          }

          setPreviewColor(this, color);
          setInputValue(this, color, this.options.settings.get('output'));
      }
    },

    serialize: function() {
      var input = this.options.settings.get('input');
      var output = this.options.settings.get('output');
      var userPalette = this.options.settings.get('palette') || [];

      var value = '';
      var outputValue = '';
      var preview = 'rgba(0, 0, 0, 0)';

      if (this.options.value && this.options.value.length > 1) {
        var rawValue = this.options.value;
        if (output === 'rgb' || output === 'hsl') rawValue = this.options.value.split(',').map(function(color) { return +color; });
        var color = Color(rawValue, output);

        value = color[input];
        outputValue = color[output];
        preview = color.rgb.length === 4 ? 'rgba(' + color.rgb + ')' : 'rgb(' + color.rgb + ')';
      }

      return {
        value: value,
        outputValue: outputValue,
        preview: preview,
        name: this.options.name,
        comment: this.options.schema.get('comment'),
        palette: userPalette.length ? userPalette.split(',') : false,
        readOnly: this.options.settings.get('read_only') || !this.options.canWrite,
        input: input,
        output: this.options.settings.get('output'),
        hex: input === 'hex',
        rgb: input === 'rgb',
        hsl: input === 'hsl',
        alpha: this.options.settings.get('allow_alpha'),
        paletteOnly: this.options.settings.get('palette_only')
      };
    }
  });
});
