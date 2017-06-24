define(['./interface', 'core/UIComponent', 'core/t', 'utils'], function (Input, UIComponent, __t, Utils) {
  return UIComponent.extend({
    id: 'radio_buttons',
    dataTypes: ['VARCHAR'],
    variables: [
      {id: 'options', default_value: '', ui: 'json', options: {rows: 25, placeholder_text: '{\n    "value1": "Option One",\n    "value2": "Option Two",\n    "value3": "Option Three"\n}'}, comment: __t('select_options_comment'), required: true},
      {id: 'list_view_formatting', ui: 'radio_buttons', default_value: 'text', options: {options: {text: 'Display Text', value: 'Value'}}}
    ],
    Input: Input,
    validate: function (value, options) {
      if (options.schema.isRequired() && Utils.isEmpty(value)) {
        return __t('this_field_is_required');
      }
    },
    list: function (options) {
      var showAsText = options.settings.get('list_view_formatting') === 'text';

      if (showAsText) {
        var displayOptions = JSON.parse(options.settings.get('options'));
        return displayOptions[options.value];
      }

      return options.value;
    }
  });
});
