define(['./interface', 'core/UIComponent', 'core/t', 'helpers/schema'], function (Input, UIComponent, __t, SchemaHelper) {
  return UIComponent.extend({
    id: 'rating',
    dataTypes: SchemaHelper.getNumericTypes(),
    variables: [
      {id: 'max_score', default_value: 5, ui: 'numeric'}
    ],
    Input: Input,
    validate: function (value, options) {
      if (options.schema.isRequired() && !value) {
        return __t('this_field_is_required');
      }
    },
    list: function (options) {
      return options.value;
    }
  });
});
