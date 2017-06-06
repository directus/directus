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
      // Toggles an "Add" button for adding new files directly into the UI
      {id: 'add_button', type: 'Boolean', default_value: true, ui: 'checkbox'},
      // Toggles a "Choose" button that opens a modal with all existing Directus files to choose from
      {id: 'choose_button', type: 'Boolean', default_value: true, ui: 'checkbox'},
      // Toggles "Remove" buttons for each file that let's you delete the file
      {id: 'remove_button', type: 'Boolean', default_value: true, ui: 'checkbox'}
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
