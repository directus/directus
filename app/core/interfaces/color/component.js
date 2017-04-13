define(['core/interfaces/color/interface', 'core/UIComponent', 'core/t', 'core/interfaces/color/lib/color'], function(Input, UIComponent, __t, Color) {
  var Component = UIComponent.extend({
    id: 'color',
    dataTypes: ['VARCHAR'],
    variables: [
      {id: 'readonly', type: 'Boolean', default_value: false, ui: 'checkbox'},
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
        id: 'palette_only',
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
      var value;

      switch(options.settings.get('output')) {
        case 'hex':
          value = options.value || false;
          break;
        case 'rgb':
        case 'hsl':
          value = options.value ? options.value.split(',').map(function(color) { return +color; }) : false;
      }

      if (value) {
        var color = Color(value, options.settings.get('output')).rgb;
        var rgb = color.length === 4 ? 'rgba(' + color + ')' : 'rgb(' + color + ')';
        var swatch = '<div style="width: 20px; height: 20px; border-radius: 50%; background-color: ' + rgb + '"></div>';
        return options.settings.get('listing') === 'swatch' ? swatch : value;
      } else {
        return '';
      }
    }
  });

  return Component;
});
