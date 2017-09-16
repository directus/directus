define(['./interface', 'core/UIComponent', 'core/t', 'utils'], function (Input, UIComponent, __t, Utils) {
  return UIComponent.extend({
    id: 'checkboxes',
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
        id: 'delimiter',
        ui: 'text_input',
        type: 'String',
        comment: 'The delimiter to use in the saved CSV value',
        default_value: ',',
        length: 1,
        required: true
      },
      {
        id: 'wrap_with_delimiter',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Wrap the values with a pair of delimiters to <a href="https://github.com/directus/directus/issues/1681">allow strict searching for a single value</a>',
        default_value: true
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
        id: 'allow_custom_checkboxes',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Enable to allow user add custom checkbox values',
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
      // Convert default csv to csv with spaces => demo1,demo2 => demo1, demo2
      var showAsText = interfaceOptions.settings.get('list_view_formatting') === 'text';
      var values = (interfaceOptions.value || '').split(interfaceOptions.settings.get('delimiter'))
        .filter(function(value) {
          // Filter out the first and last empty delimiter
          return value.length > 0;
        })
        .map(function (value) {
          // map value to options key
          if (showAsText) {
            var displayOptions = JSON.parse(interfaceOptions.settings.get('options'));

            if (displayOptions[value]) {
              return displayOptions[value];
            }

            return value;
          }
          return value;
        });

      return values.join(', ');
    }
  });
});
