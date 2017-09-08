define(['./interface', 'core/UIComponent', 'core/t', 'utils'], function (Input, UIComponent, __t, Utils) {
  return UIComponent.extend({
    id: 'radio_buttons',
    dataTypes: ['VARCHAR', 'CHAR', 'TINYTEXT', 'TEXT', 'MEDIUMTEXT', 'LONGTEXT'],
    options: [
      {
        id: 'read_only',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Force this interface to be read only',
        default_value: false
      },
      {
        id: 'options',
        ui: 'json',
        type: 'Object',
        comment: __t('select_options_comment'),
        default_value: '',
        required: true,
        options: {
          rows: 25,
          placeholder: JSON.stringify({
            value1: 'Option 1',
            value2: 'Option 2',
            value3: 'Option 3'
          }, null, '  ')
        }
      },
      {
        id: 'list_view_formatting',
        ui: 'radio_buttons',
        type: 'String',
        comment: 'The output format on the list view',
        default_value: 'text',
        options: {
          options: {
            text: 'Display Text',
            value: 'Value'
          }
        }
      },
      {
        id: 'allow_custom_value',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Allow user to add an extra custom value',
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
      var showAsText = interfaceOptions.settings.get('list_view_formatting') === 'text';
      var value = interfaceOptions.value;

      if (showAsText) {
        var displayOptions = JSON.parse(interfaceOptions.settings.get('options'));
        value = displayOptions[interfaceOptions.value] || value;
      }

      return value;
    }
  });
});
