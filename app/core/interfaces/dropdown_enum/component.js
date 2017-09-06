define(['./interface', 'core/UIComponent', 'core/t', 'utils'], function (Input, UIComponent, __t, Utils) {
  return UIComponent.extend({
    id: 'dropdown_enum',
    dataTypes: ['ENUM'],
    options: [
      {
        id: 'read_only',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Force this interface to be read only',
        default_value: false
      },
      {
        id: 'placeholder',
        ui: 'text_input',
        type: 'String',
        comment: 'Enter Placeholder Text',
        default_value: ''
      },
      {
        id: 'use_native_input',
        ui: 'toggle',
        type: 'String',
        comment: 'Render the dropdown as a native HTML &lt;select&gt; element instead of our custom solution',
        default_value: false
      }
    ],
    Input: Input,
    validate: function (value, interfaceOptions) {
      if (interfaceOptions.schema.isRequired() && Utils.isEmpty(value)) {
        return __t('this_field_is_required');
      }
    },
    list: function (interfaceOptions) {
      return interfaceOptions.value;
    }
  });
});
