define(['./interface', 'backbone', 'handlebars', 'core/UIComponent', 'core/t'], function (Input, Backbone, Handlebars, UIComponent, __t) {
  'use strict';

  return UIComponent.extend({
    id: 'many_to_one',
    dataTypes: ['INT', 'TINYINT', 'SMALLINT', 'MEDIUMINT', 'BIGINT'],
    variables: [
      {
        id: 'read_only',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Force this interface to be read only',
        default_value: false
      },
      {
        id: 'visible_column',
        ui: 'text_input',
        type: 'String',
        comment: __t('m2o_visible_column_comment'),
        default_value: '',
        char_length: 64,
        required: true
      },
      {
        id: 'visible_column_template',
        ui: 'text_input',
        type: 'String',
        comment: __t('m2o_visible_column_template_comment'),
        default_value: '',
        char_length: 64,
        required: true
      },
      {
        id: 'visible_status_ids',
        ui: 'text_input',
        type: 'String',
        comment: __t('m2o_visible_status_ids_comment'),
        default_value: '1',
        char_length: 64,
        required: false
      },
      {
        id: 'placeholder',
        ui: 'text_input',
        type: 'String',
        comment: __t('m2o_placeholder_text_comment'),
        default_value: '',
        char_length: 255,
        required: false
      },
      {
        id: 'allow_null',
        ui: 'toggle',
        type: 'Boolean',
        default_value: false
      },
      {
        id: 'filter_type',
        ui: 'dropdown',
        type: 'String',
        comment: 'What type of interface to use for the filter',
        default_value: 'dropdown',
        required: true,
        options: {
          options: {
            dropdown: __t('dropdown'),
            textinput: __t('text_input')
          }
        }
      },
      {
        id: 'filter_column',
        ui: 'text_input',
        type: 'String',
        comment: __t('m2o_filter_column_comment'),
        default_value: '',
        char_length: 255
      }
    ],
    Input: Input,
    forceUIValidation: true,
    list: function (options) {
      if (options.value === undefined) {
        return '';
      }

      if (options.settings.get('visible_column_template') !== undefined) {
        var displayTemplate = Handlebars.compile(options.settings.get('visible_column_template'));
        if (options.value instanceof Backbone.Model) {
          return displayTemplate(options.value.attributes);
        } else if (options.value instanceof Object) {
          return displayTemplate(options.value);
        }
      }

      if (options.value instanceof Backbone.Model) {
        return options.value.get(options.settings.get('visible_column'));
      } else if (options.value instanceof Object) {
        return options.value[options.settings.get('visible_column')];
      }

      return options.value;
    }
  });
});
