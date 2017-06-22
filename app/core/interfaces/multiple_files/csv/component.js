define([
  'app',
  'underscore',
  'core/t',
  'core/UIComponent',
  './interface'
], function (app, _, __t, UIComponent, Input) {
  'use strict';

  return UIComponent.extend({
    id: 'multiple_files_csv',

    dataTypes: ['TEXT', 'VARCHAR'],

    variables: [
      {
        id: 'add_button',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Toggles an "Add" button for adding new files directly into the UI',
        default_value: true
      },
      {
        id: 'choose_button',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Toggles a "Choose" button that opens a modal with all existing Directus files to choose from',
        default_value: true
      },
      {
        id: 'remove_button',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Toggles "Remove" buttons for each file that let\'s you delete the file',
        default_value: true
      }
    ],

    Input: Input,

    validate: function (value, options) {
      if (options.schema.isRequired() && value.length === 0) {
        return __t('this_field_is_required');
      }
    },

    list: function () {
      return 'x';
    }
  });
});
