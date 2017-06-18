define(['./interface', 'app', 'backbone', 'core/UIComponent', 'core/t'], function (Input, app, Backbone, UIComponent, __t) {
  'use strict';

  // @TODO: this should be a great feature on Models
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
    dataTypes: ['INT', 'TINYINT', 'SMALLINT', 'MEDIUMINT', 'BIGINT'],
    variables: [
      {id: 'visible_column', type: 'String', default_value: '', ui: 'text_input', comment: __t('m2o_typeahead_visible_column_comment'), char_length: 64, required: true},
      {id: 'template', type: 'String', default_value: '', ui: 'text_input', required: true, comment: __t('m2o_typeahead_template_comment')},
      {id: 'size', type: 'String', default_value: 'large', ui: 'select', options: {options: {large: __t('size_large'), medium: __t('size_medium'), small: __t('size_small')}}, comment: __t('m2o_typeahead_size_comment')},
      {id: 'visible_status_ids', type: 'String', ui: 'text_input', char_length: 64, default_value: 1, comment: __t('m2o_visible_status_ids_comment')}
    ],
    Input: Input,
    list: function (options) {
      if (options.value === undefined || options.value.isNew()) {
        return '';
      }

      if (options.value instanceof Backbone.Model) {
        if (options.settings.get('template')) {
          return this.compileView(options.settings.get('template'), options.value.toJSON());
        }
        return getMultipleAttributes(options.value, options.settings.get('visible_column'));
      }

      return options.value;
    }
  });
});
