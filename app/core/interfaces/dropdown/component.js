define(['./interface', 'core/UIComponent', 'core/t', 'utils'], function (Input, UIComponent, __t, Utils) {
  return UIComponent.extend({
    id: 'dropdown',
    dataTypes: ['VARCHAR'],
    variables: [
      {
        id: 'options',
        ui: 'json',
        type: 'String',
        comment: __t('select_options_comment'),
        default_value: '',
        required: true,
        options: {
          rows: 25,
          placeholder: JSON.stringify({
            value1: 'Option One',
            value2: 'Option two',
            value3: 'Option three'
          }, null, '  ')
        }
      },
      {
        id: 'placeholder',
        ui: 'text_input',
        type: 'String',
        comment: 'Enter Placeholder Text',
        default_value: ''
      },
      {
        id: 'read_only',
        default_value: false,
        ui: 'toggle'
      },
      {
        id: 'use_native_input',
        ui: 'toggle',
        type: 'String',
        comment: 'Render the dropdown as a native HTML <section> element instead of our custom solution',
        default_value: false
      }
    ],
    Input: Input,
    validate: function (value, options) {
      if (options.schema.isRequired() && Utils.isEmpty(value)) {
        return __t('this_field_is_required');
      }
    },
    list: function (options) {
      return options.value;
    }
  });
});
