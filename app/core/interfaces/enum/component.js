define(['core/interfaces/enum/interface', 'core/UIComponent', 'core/t', 'select2'], function (Input, UIComponent, __t) {
  'use strict';

  return UIComponent.extend({
    id: 'enum',
    dataTypes: ['ENUM', 'SET'],
    Input: Input,
    variables: [
      {id: 'allow_null', type: 'Boolean', default_value: false, ui: 'checkbox'}
    ],
    validate: function (value, options) {
      if (options.schema.isRequired() && _.isEmpty(value)) {
        return __t('this_field_is_required');
      }
    },
    list: function (options) {
      return _.isString(options.value) ? options.value.replace(/<(?:.|\n)*?>/gm, '').substr(0, 100) : '<span class="silver">--</span>';
    }
  });
});
