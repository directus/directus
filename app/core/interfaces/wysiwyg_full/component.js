define(['./interface', 'core/UIComponent', 'core/t'], function (Input, UIComponent, __t) {
  return UIComponent.extend({
    id: 'wysiwyg_full',
    dataTypes: ['VARCHAR', 'TEXT', 'MEDIUMTEXT', 'LONGTEXT'],
    Input: Input,
    variables: [],
    validate: function (value, options) {
      if (options.view.isRequired() && !value) {
        return __t('this_field_is_required');
      }
    },
    list: function (options) {
      return options.value ? options.value.toString().replace(/(<([^>]+)>)/ig, '').substr(0, 100) : '';
    }
  });
});
