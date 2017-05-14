define(['./interface', 'backbone', 'handlebars', 'core/UIComponent', 'core/t'], function (Input, Backbone, Handlebars, UIComponent, __t) {
  'use strict';

  return UIComponent.extend({
    id: 'many_to_one',
    dataTypes: ['INT', 'TINYINT', 'SMALLINT', 'MEDIUMINT', 'BIGINT'],
    variables: [
      {id: 'readonly', type: 'Boolean', default_value: false, ui: 'checkbox'},
      {id: 'visible_column', type: 'String', default_value: '', ui: 'textinput', char_length: 64, required: true, comment: __t('m2o_visible_column_comment')},
      {id: 'visible_column_template', type: 'String', default_value: '', ui: 'textinput', char_length: 64, required: true, comment: __t('m2o_visible_column_template_comment')},
      {id: 'visible_status_ids', type: 'String', ui: 'textinput', char_length: 64, required: false, default_value: '1', comment: __t('m2o_visible_status_ids_comment')},
      {id: 'placeholder_text', type: 'String', default_value: '', ui: 'textinput', char_length: 255, required: false, comment: __t('m2o_placeholder_text_comment')},
      {id: 'allow_null', type: 'Boolean', default_value: false, ui: 'checkbox'},
      {id: 'filter_type', type: 'String', default_value: 'dropdown', required: true, ui: 'select', options: {options: {dropdown: __t('dropdown'), textinput: __t('text_input')}}},
      {id: 'filter_column', type: 'String', default_value: '', ui: 'textinput', char_length: 255, comment: __t('m2o_filter_column_comment')}
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
