define(['core/interfaces/wysiwyg/interface', 'core/UIComponent', 'core/t'], function (Input, UIComponent, __t) {
  return UIComponent.extend({
    id: 'wysiwyg',
    dataTypes: ['VARCHAR', 'TEXT'],
    Input: Input,
    validate: function (value, options) {
      if (options.view.isRequired() && !value) {
        return __t('this_field_is_required');
      }
    },
    list: function (options) {
      return options.value;
    }
  });
});
