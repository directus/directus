define(['core/interfaces/slider/interface', 'core/UIComponent', 'core/t'], function (Input, UIComponent, __t) {
  'use strict';

  return UIComponent.extend({
    id: 'slider',
    dataTypes: ['INT'],
    variables: [
      {id: 'minimum', type: 'Number', default_value: 0, ui: 'numeric'},
      {id: 'maximum', type: 'Number', default_value: 100, ui: 'numeric'},
      {id: 'step', type: 'Number', default_value: 1, ui: 'numeric', comment: __t('slider_step_comment')},
      {id: 'unit', default_value: '', ui: 'textinput', comment: 'Show unit next to slider value, e.g.: 15 Pounds'}
    ],
    Input: Input,
    validate: function (value, options) {
      if (options.schema.isRequired() && !value) {
        return __t('this_field_is_required');
      }
    }
  });
});
