define(['core/interfaces/_internals/file_title/interface', 'core/UIComponent', 'core/t'], function (Input, UIComponent, __t) {
  'use strict';

  return UIComponent.extend({
    id: 'directus_file_title',
    system: true,
    variables: [
      {id: 'size', type: 'String', default_value: 'large', ui: 'select', options: {options: {large: __t('size_large'), medium: __t('size_medium'), small: __t('size_small')}}}
    ],
    Input: Input,
    list: function (options) {
      return (options.value) ? options.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0, 100) : '';
    }
  });
});
