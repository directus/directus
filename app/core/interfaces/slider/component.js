define(['core/interfaces/slider/interface', 'core/UIComponent', 'core/t'], function (Input, UIComponent, __t) {
  'use strict';

  return UIComponent.extend({
    id: 'slider',
    dataTypes: ['INT', 'TINYINT', 'SMALLINT', 'MEDIUMINT', 'BIGINT', 'DECIMAL'],
    options: [
      {
        id: 'read_only',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Force this interface to be read only',
        default_value: false
      },
      {
        id: 'minimum',
        ui: 'numeric',
        type: 'Number',
        comment: 'Minimum value',
        default_value: 0
      },
      {
        id: 'maximum',
        ui: 'numeric',
        type: 'Number',
        comment: 'Maximum value',
        default_value: 100
      },
      {
        id: 'step',
        ui: 'numeric',
        type: 'Number',
        comment: __t('slider_step_comment'),
        default_value: 1
      },
      {
        id: 'unit',
        ui: 'text_input',
        type: 'String',
        comment: 'Show unit next to slider value, e.g.: 15 Pounds',
        default_value: ''
      }
    ],
    Input: Input,
    validate: function (value, interfaceOptions) {
      if (interfaceOptions.schema.isRequired() && !value) {
        return __t('this_field_is_required');
      }
    }
  });
});
