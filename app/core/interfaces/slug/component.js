define(['./interface', 'core/UIComponent', 'core/t'], function (Input, UIComponent, __t) {
  'use strict';

  return UIComponent.extend({
    id: 'slug',
    dataTypes: ['VARCHAR'],
    variables: [
      // Disables editing of the field while still letting users see the value
      {id: 'readonly', type: 'Boolean', default_value: true, ui: 'toggle'},
      // Adjusts the max width of the input (Small, Medium, Large)
      {id: 'size', type: 'String', default_value: 'large', ui: 'select', options: {options: {large: __t('size_large'), medium: __t('size_medium'), small: __t('size_small')}}},
      // Enter the column name of the field the slug will pull it's value from
      {id: 'mirrored_field', type: 'String', default_value: '', required: true, ui: 'textinput', char_length: 200},
      // Whether to update slug only on creation
      {id: 'only_on_creation', type: 'Boolean', default_value: false, ui: 'toggle', comment: __t('slug_only_on_creation_comment')}
    ],
    Input: Input,
    validate: function (value, options) {
      if (options.schema.isRequired() && _.isEmpty(value)) {
        return __t('this_field_is_required');
      }
    },
    list: function (options) {
      return (options.value) ? options.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0, 100) : '';
    }
  });
});
