define([
  'core/interfaces/numeric/interface',
  'core/UIComponent',
  'helpers/schema',
  'core/t'
], function (Input, UIComponent, SchemaHelper, __t) {
  return UIComponent.extend({
    id: 'numeric',
    dataTypes: SchemaHelper.getNumericInterfaceTypes(),
    variables: [
      {
        id: 'size',
        ui: 'dropdown',
        type: 'String',
        comment: 'Size of the input field',
        default_value: 'large',
        options: {
          options: {
            large: __t('size_large'),
            medium: __t('size_medium'),
            small: __t('size_small')
          }
        }
      },
      {
        id: 'placeholder',
        ui: 'text_input',
        type: 'String',
        comment: 'Enter Placeholder Text',
        default_value: '',
        char_length: 200
      },
      {
        id: 'localized',
        ui: 'toggle',
        type: 'Boolean',
        comment: __t('numeric_localized_comment'),
        default_value: true
      }
    ],
    Input: Input,
    validate: function (value, options) {
      var inputView = options.view;

      if (options.schema.isRequired() && value != 0 && !value) {
        return __t('this_field_is_required');
      }

      if (inputView && !inputView.$el.find('input')[0].checkValidity()) {
        return __t('confirm_invalid_value');
      }
    },
    list: function (options) {
      var value = options.value;

      if (!isNaN(Number(value))) {
        value = Number(value);

        if (options.settings.get('localized')) {
          value = value.toLocaleString();
        }
      } else {
        value = '<span class="silver">--</span>';
      }

      return value;
    }
  });
});
