define(['./interface', 'core/UIComponent', 'core/t'], function (Input, UIComponent, __t) {
  return UIComponent.extend({
    id: 'directus_permissions',
    dataTypes: ['ONETOMANY'],
    options: [
      {id: 'visible_columns', type: 'String', ui: 'text_input', char_length: 255, required: true},
      {id: 'result_limit', type: 'Number', ui: 'numeric', char_length: 10, default_value: 100, comment: __t('result_limit_comment')},
      {id: 'add_button', type: 'Boolean', ui: 'toggle'},
      {id: 'choose_button', type: 'Boolean', ui: 'toggle', default_value: true},
      {id: 'remove_button', type: 'Boolean', ui: 'toggle'},
      {id: 'only_unassigned', type: 'Boolean', ui: 'toggle', default_value: false}
    ],
    Input: Input,
    validate: function (collection, interfaceOptions) {
      if (interfaceOptions.schema.isRequired() && collection.length === 0) {
        return __t('this_field_is_required');
      }
    },
    list: function () {
      return 'x';
    }
  });
});
