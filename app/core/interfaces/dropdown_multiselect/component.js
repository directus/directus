define(['./interface', 'core/UIComponent', 'core/t', 'utils'], function (Input, UIComponent, __t, Utils) {
  return UIComponent.extend({
    id: 'dropdown_multiselect',
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
        id: 'use_native_input',
        ui: 'toggle',
        type: 'String',
        comment: 'Render the dropdown as a native HTML &lt;select&gt; element instead of our custom solution',
        default_value: false
      },
      {
        id: 'list_view_formatting',
        ui: 'radio_buttons',
        type: 'string',
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
          id: 'max_items',
          ui: 'numeric',
          type: 'Number',
          comment: 'Max Items (0 = no limitation)',
          default_value: '0'
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

      if (interfaceOptions.value) {
        return (interfaceOptions.value || '').split(',')
          .filter(function (value) {
            // Filter out the first and last empty delimiter
            return value.length > 0;
          })
          .map(function (value) {
            if (showAsText) {
              var displayOptions = JSON.parse(interfaceOptions.settings.get('options'));
              return displayOptions[value];
            }

            return value;
          })
          .reduce(function (string, value) {
            return string + ', ' + value;
          });
      }

      return interfaceOptions.value;
    }
  });
});
