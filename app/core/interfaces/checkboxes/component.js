define(['./interface', 'core/UIComponent', 'core/t', 'utils'], function (Input, UIComponent, __t, Utils) {
  return UIComponent.extend({
    id: 'checkboxes',
    dataTypes: ['VARCHAR'],
    variables: [
      {
        id: 'options',
        ui: 'json',
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
        comment: 'The delimiter to use in the saved CSV value',
        default_value: ',',
        length: 1,
        required: true
      }
    ],
    Input: Input,
    validate: function (value, options) {
      if (options.schema.isRequired() && Utils.isEmpty(value)) {
        return __t('this_field_is_required');
      }
    },
    list: function (options) {
      // Convert default csv to csv with spaces => demo1,demo2 => demo1, demo2
      return options.value.split(options.settings.get('delimiter')).reduce(function (string, value) {
        return string + ', ' + value;
      });
    }
  });
});
