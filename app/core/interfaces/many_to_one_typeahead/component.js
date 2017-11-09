/* global _ */
define([
  'underscore',
  './interface',
  'app',
  'backbone',
  'core/UIComponent',
  'core/t'
], function (_, Input, app, Backbone, UIComponent, __t) {
  'use strict';

  // TODO: this should be a great feature on Models
  function getMultipleAttributes(model, attributes) {
    if (attributes && attributes.length > 0) {
      var columns = attributes.split(',');
      var values = [];
      _.each(columns, function (column) {
        values.push(model.get(column));
      });

      return values.join(' ');
    }
  }

  return UIComponent.extend({
    id: 'many_to_one_typeahead',
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
        comment: __t('m2o_typeahead_visible_column_comment'),
        default_value: '',
        char_length: 64,
        required: true
      },
      {
        id: 'template',
        ui: 'text_input',
        type: 'String',
        comment: __t('m2o_typeahead_template_comment'),
        default_value: '',
        required: true
      },
      {
        id: 'size',
        ui: 'dropdown',
        type: 'String',
        comment: __t('m2o_typeahead_size_comment'),
        default_value: 'large',
        options: {
          options: {
            large: __t('size_large'),
            medium: __t('size_medium'),
            small: __t('size_small')
          }
        }
      },
      {
        id: 'visible_status_ids',
        ui: 'text_input',
        type: 'String',
        comment: __t('m2o_visible_status_ids_comment'),
        char_length: 64,
        default_value: 1
      }
    ],
    Input: Input,
    list: function (interfaceOptions) {
      if (interfaceOptions.value === undefined) {
        return '';
      }

      if (interfaceOptions.value instanceof Backbone.Model) {
        if (interfaceOptions.settings.get('template')) {
          return this.compileView(interfaceOptions.settings.get('template'), interfaceOptions.value.toJSON());
        }
        return getMultipleAttributes(interfaceOptions.value, interfaceOptions.settings.get('visible_column'));
      }

      return interfaceOptions.value;
    }
  });
});
