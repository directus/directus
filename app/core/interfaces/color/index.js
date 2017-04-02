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

  function setPreviewColor(view, color) {
    var rgbString = color.rgb.length === 4 ? 'rgba(' + color.rgb.join() + ')' : 'rgb(' + color.rgb.join() + ')';
    view.$el.find('.color-preview')[0].style.boxShadow = 'inset 0 0 0 30px ' + rgbString;
  }

  function setInputValue(view, color, output) {
    view.$el.find('.value').val(color[output]);
  }

  function showInvalidMessage(view) {
    view.$el.find('.color-invalid')[0].innerHTML = __t('confirm_invalid_value');
    setPreviewColor(view, Color([0, 0, 0, 0], 'rgb'));
  }

  function hideInvalidMessage(view) {
    view.$el.find('.color-invalid')[0].innerHTML = '';
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

        switch(input) {
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
            if (this.$el.find('input.alpha').val()) values.push(+this.$el.find('input.alpha').val());
            color = Color(values, input);
            if (!allowAlpha && color.length === 4) alphaValid = false;
            break;

          case 'hsl':
            var values = [
              +this.$el.find('input.hue').val(),
              +this.$el.find('input.saturation').val(),
              +this.$el.find('input.lightness').val()
            ];
            if (this.$el.find('input.alpha').val()) values.push(+this.$el.find('input.alpha').val());
            color = Color(values, input);
            if (!allowAlpha && color.length === 4) alphaValid = false;
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

          switch(input) {
            case 'hex':
              this.$el.find('input').val(buttonValue);
              break;
            case 'rgb':
              var rgba = color.rgb;
              if (rgba.length !== 4) rgba[3] = 1;
              this.$el.find('input.red').val(rgba[0]);
              this.$el.find('input.green').val(rgba[1]);
              this.$el.find('input.blue').val(rgba[2]);
              this.$el.find('input.alpha').val(rgba[3]);
              break;
            case 'hsl':
              var hsla = color.hsl;
              if (hsla.length !== 4) hsla[3] = 1;
              this.$el.find('input.hue').val(hsla[0]);
              this.$el.find('input.saturation').val(hsla[1]);
              this.$el.find('input.lightness').val(hsla[2]);
              this.$el.find('input.alpha').val(hsla[3]);
              break;
          }

          setPreviewColor(this, color);
          setInputValue(this, color, this.options.settings.get('output'));
      }
    },

    afterRender: function() {
      //
    },

    serialize: function() {
      var input = this.options.settings.get('input');
      var output = this.options.settings.get('output');
      var userPalette = this.options.settings.get('palette') || [];

      var value;

      switch(input) {
        case 'hex':
          value = this.options.value || '000000';
          break;
        case 'rgb':
        case 'hsl':
          value = this.options.value ? this.options.value.split(',') : [0, 0, 0, 1];
      }

      return {
        value: value,
        name: this.options.name,
        comment: this.options.schema.get('comment'),
        palette: userPalette.length ? userPalette.split(',') : false,
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
