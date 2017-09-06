define([
  'core/UIComponent',
  'core/interfaces/relational/m2m/interface',
  'core/t'
], function (UIComponent, Input, __t) {
  return UIComponent.extend({
    id: 'many_to_many',
    dataTypes: ['MANYTOMANY'],
    options: [
      {
        id: 'visible_columns',
        ui: 'text_input',
        type: 'String',
        comment: 'The columns of the related table which will be shown in this interface',
        default_value: '',
        char_length: 255,
        required: true
      },
      {
        id: 'visible_column_template',
        ui: 'text_input',
        type: 'String',
        comment: __t('m2m_visible_column_template_comment'),
        default_value: '',
        char_length: 255,
        required: true
      },
      {
        id: 'add_button',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Toggles an "Add" button for adding a new item directly into the UI',
        default_value: true
      },
      {
        id: 'choose_button',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Toggles a "Choose" button that opens a modal with all existing items to choose from',
        default_value: true
      },
      {
        id: 'remove_button',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Toggles "Remove" buttons for each item that let\'s you delete the item',
        default_value: true
      },
      {
        id: 'filter_type',
        ui: 'dropdown',
        type: 'String',
        comment: 'What kind of input to use',
        default_value: 'dropdown',
        options: {
          options: {
            dropdown: __t('dropdown'),
            textinput: __t('text_input')
          }
        }
      },
      {
        id: 'filter_column',
        ui: 'text_input',
        type: 'String',
        comment: __t('m2m_filter_column_comment'),
        default_value: '',
        char_length: 255,
        required: true
      },
      {
        id: 'min_entries',
        ui: 'numeric',
        type: 'Number',
        comment: __t('m2m_min_entries_comment'),
        default_value: 0,
        char_length: 11
      },
      {
        id: 'no_duplicates',
        ui: 'toggle',
        type: 'Boolean',
        comment: __t('m2m_no_duplicates_comment'),
        default_value: false
      }
    ],
    Input: Input,
    validate: function (value, interfaceOptions) {
      var minEntries = parseInt(interfaceOptions.settings.get('min_entries'), 10);

      if (value.length < minEntries) {
        return __t('this_field_requires_at_least_x_entries', {
          count: minEntries
        });
      }

      // @TODO: Does not currently consider newly deleted items
      if (interfaceOptions.schema.isRequired() && value.length === 0) {
        return __t('this_field_is_required');
      }
    },
    list: function () {
      return 'x';
    }
  });
});
