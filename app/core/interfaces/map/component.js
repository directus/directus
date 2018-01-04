define(['./interface', 'core/UIComponent', 'core/t'], function (Input, UIComponent, __t) {
  'use strict';

  return UIComponent.extend({
    id: 'map',
    dataTypes: ['VARCHAR', 'CHAR', 'TINYTEXT', 'TEXT', 'MEDIUMTEXT', 'LONGTEXT', 'ALIAS'],
    options: [
      {
        id: 'read_only',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Force this interface to be read only',
        default_value: false
      },
      // Google API Key (Provided by Google)
      {
        id: 'google_api_key',
        ui: 'text_input',
        type: 'String',
        comment: 'Google API Key w/ Maps JS, Places & Geocoding access',
        default_value: '',
        required: true,
        char_length: 200
      },
      // Column names to fill with respective item
      {
        id: 'street_number_field',
        ui: 'text_input',
        type: 'String',
        comment: 'Street number column to fill with respective item',
        default_value: '',
        char_length: 200
      },
      {
        id: 'street_field',
        ui: 'text_input',
        type: 'String',
        comment: 'Street column to fill with respective item',
        default_value: '',
        char_length: 200
      },
      {
        id: 'city_field',
        ui: 'text_input',
        type: 'String',
        comment: 'City column to fill with respective item',
        default_value: '',
        char_length: 200
      },
      {
        id: 'postal_code_field',
        ui: 'text_input',
        type: 'String',
        comment: 'Postal code column to fill with respective item',
        default_value: '',
        char_length: 200
      },
      {
        id: 'state_field',
        ui: 'text_input',
        type: 'String',
        comment: 'State column to fill with respective item',
        default_value: '',
        char_length: 200
      },
      {
        id: 'state_code_field',
        ui: 'text_input',
        type: 'String',
        comment: 'State code column to fill with respective item',
        default_value: '',
        char_length: 200
      },
      {
        id: 'country_field',
        ui: 'text_input',
        type: 'String',
        comment: 'Country column to fill with respective item',
        default_value: '',
        char_length: 200
      },
      {
        id: 'country_code_field',
        ui: 'text_input',
        type: 'String',
        comment: 'Country code column to fill with respective item',
        default_value: '',
        char_length: 200
      },
      {
        id: 'map_height',
        ui: 'numeric',
        type: 'Number',
        comment: __t('map_mapHeight_comment'),
        default_value: 400,
        char_length: 4
      },
      {
        id: 'show_lat_lng',
        ui: 'toggle',
        type: 'Boolean',
        comment: __t('map_showLatLng_comment'),
        default_value: false
      }
    ],
    settings: [{
      collection: 'global',
      id: 'google_api_key',
      ui: 'text_input',
      char_length: 200,
      comment: __t('maps_ui_global_settings_google_api_key')
    }],
    Input: Input,
    list: function (interfaceOptions) {
      return (interfaceOptions.value)
        ? interfaceOptions.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0, 100)
        : '';
    }
  });
});
