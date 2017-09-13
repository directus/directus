define(['core/interfaces/one_to_many/interface', 'core/UIComponent', 'core/t'], function (Input, UIComponent, __t) {
  'use strict';

  return UIComponent.extend({
    id: 'one_to_many',
    dataTypes: ['ONETOMANY'],
    options: [
      {
        id: 'visible_columns',
        ui: 'text_input',
        type: 'String',
        comment: 'Enter template for filter dropdown display',
        char_length: 255,
        required: true
      },
      {
        id: 'result_limit',
        ui: 'numeric',
        type: 'Number',
        comment: __t('result_limit_comment'),
        char_length: 10,
        default_value: 100
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
        id: 'only_unassigned',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Only show unassigned items in the dropdown',
        default_value: false
      }
    ],
    Input: Input,
    validate: function (collection, interfaceOptions) {
      if (interfaceOptions.schema.isRequired() && collection.length === 0) {
        return __t('this_field_is_required');
      }
    },
    list: function () {
      return 'x';
    }
  });
});
