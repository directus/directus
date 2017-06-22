define([
  'underscore',
  'core/interfaces/color/interface',
  'core/UIComponent',
  'core/t',
  'core/interfaces/color/lib/color'
], function (_, Input, UIComponent, __t, Color) {
  'use strict';

  return UIComponent.extend({
    id: 'color',
    dataTypes: ['VARCHAR'],
    variables: [
      {
        id: 'input',
        type: 'String',
        default_value: 'hex',
        ui: 'dropdown',
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
        ui: 'dropdown',
        options: {
          options: {
            hex: 'Hex',
            rgb: 'RGB',
            hsl: 'HSL'
          }
        }
      },
      {
        id: 'list_view_formatting',
        type: 'String',
        default_value: 'swatch',
        ui: 'dropdown',
        options: {
          options: {
            swatch: 'Color Swatch',
            value: 'Value'
          }
        }
      },
      {
        id: 'palette',
        type: 'String',
        ui: 'tags',
        comment: 'Add color options as hex values'
      },
      {
        id: 'palette_only',
        type: 'Boolean',
        default_value: false,
        ui: 'toggle'
      },
      {
        id: 'allow_alpha',
        type: 'Boolean',
        default_value: false,
        ui: 'toggle'
      },
      {id: 'readonly', type: 'Boolean', default_value: false, ui: 'toggle'}
    ],
    Input: Input,
    validate: function (value, options) {
      if (options.schema.isRequired() && _.isEmpty(value)) {
        return __t('this_field_is_required');
      }
    },
    list: function (options) {
      var value;

      switch (options.settings.get('output')) {
        case 'hex':
          value = options.value || false;
          break;
        case 'rgb':
        case 'hsl':
          value = options.value ?
            options.value.split(',').map(function (color) {
              return Number(color);
            }) :
            false;
          break;
        default:
          return false;
      }

      if (value) {
        var color = Color(value, options.settings.get('output')).rgb;
        var rgb = color.length === 4 ? 'rgba(' + color + ')' : 'rgb(' + color + ')';
        var swatch = '<div style="width: 20px; height: 20px; border-radius: 50%; background-color: ' + rgb + '"></div>';
        return options.settings.get('list_view_formatting') === 'swatch' ? swatch : value;
      }
      return '';
    }
  });
});
