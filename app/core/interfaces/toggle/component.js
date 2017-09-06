/* global _ */
define(['./interface', 'core/UIComponent', 'core/t'], function (Input, UIComponent, __t) {
  return UIComponent.extend({
    id: 'toggle',
    dataTypes: ['TINYINT'],
    options: [
      {
        id: 'read_only',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Force this interface to be read only',
        default_value: false
      },
      {
        id: 'label',
        ui: 'text_input',
        type: 'String',
        comment: 'Label to show next to the toggle',
        default_value: ''
      },
      {
        id: 'show_as_checkbox',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Display a checkbox instead of the default switch',
        default_value: false
      }
    ],
    Input: Input,
    validate: function (value, interfaceOptions) {
      var required = interfaceOptions.schema.isRequired();
      if (required && value === undefined) {
        return __t('this_field_is_required');
      }
    },
    list: function (interfaceOptions) {
      if (Boolean(interfaceOptions.value) === true) {
        return '<i class="material-icons">check_box</i>';
      }

      return '<i class="material-icons">check_box_outline_blank</i>';
    }
  });
});
