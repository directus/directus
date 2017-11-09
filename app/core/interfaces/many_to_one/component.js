define([
  './interface',
  'underscore',
  'utils',
  'backbone',
  'handlebars',
  'core/UIComponent',
  'core/t'
], function (Input, _, Utils, Backbone, Handlebars, UIComponent, __t) {
  'use strict';

  return UIComponent.extend({
    id: 'many_to_one',
    dataTypes: ['INT', 'TINYINT', 'SMALL', 'BIGINT', 'CHAR', 'VARCHAR'],
    options: [
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
        id: 'result_limit',
        ui: 'numeric',
        type: 'Number',
        comment: __t('result_limit_comment'),
        char_length: 10,
        default_value: 100
      },
      {
        id: 'placeholder',
        ui: 'text_input',
        type: 'String',
        comment: __t('m2o_placeholder_text_comment'),
        default_value: 'Please select an option',
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
    validate: function (value, interfaceOptions) {
      var hasValue;

      if (value instanceof Backbone.Model) {
        hasValue = !_.isEmpty(value.attributes);
      } else {
        hasValue = Utils.isSomething(value);
      }

      if (interfaceOptions.schema.isRequired() && !hasValue) {
        return __t('this_field_is_required');
      }
    },
    list: function (interfaceOptions) {
      if (interfaceOptions.value === undefined) {
        return '';
      }

      if (interfaceOptions.settings.get('visible_column_template') !== undefined) {
        var displayTemplate = Handlebars.compile(interfaceOptions.settings.get('visible_column_template'));
        if (interfaceOptions.value instanceof Backbone.Model) {
          return displayTemplate(interfaceOptions.value.attributes);
        } else if (interfaceOptions.value instanceof Object) {
          return displayTemplate(interfaceOptions.value);
        }
      }

      if (interfaceOptions.value instanceof Backbone.Model) {
        return interfaceOptions.value.get(interfaceOptions.settings.get('visible_column'));
      } else if (interfaceOptions.value instanceof Object) {
        return interfaceOptions.value[interfaceOptions.settings.get('visible_column')];
      }

      return interfaceOptions.value;
    }
  });
});
