define(['./interface', 'core/UIComponent', 'core/t'], function (Input, UIComponent, __t) {
  'use strict';

  return UIComponent.extend({
    id: 'map',
    dataTypes: ['VARCHAR', 'ALIAS'],
    variables: [
      // Google API Key (Provided by Google)
      {id: 'google_api_key', type: 'String', default_value: '', ui: 'text_input', char_length: 200, required: true},
      // Column names to fill with respective item
      {id: 'street_number_field', type: 'String', default_value: '', ui: 'text_input', char_length: 200},
      {id: 'street_field', type: 'String', default_value: '', ui: 'text_input', char_length: 200},
      {id: 'city_field', type: 'String', default_value: '', ui: 'text_input', char_length: 200},
      {id: 'postal_code_field', type: 'String', default_value: '', ui: 'text_input', char_length: 200},
      {id: 'state_field', type: 'String', default_value: '', ui: 'text_input', char_length: 200},
      {id: 'state_code_field', type: 'String', default_value: '', ui: 'text_input', char_length: 200},
      {id: 'country_field', type: 'String', default_value: '', ui: 'text_input', char_length: 200},
      {id: 'country_code_field', type: 'String', default_value: '', ui: 'text_input', char_length: 200},
      // Height of Map Element in Pixels
      {id: 'map_height', type: 'Number', default_value: 400, ui: 'numeric', char_length: 4, comment: __t('map_mapHeight_comment')},
      {id: 'show_lat_lng', type: 'Boolean', default_value: false, ui: 'toggle', comment: __t('map_showLatLng_comment')}
    ],
    settings: [{
      collection: 'global',
      id: 'google_api_key',
      ui: 'text_input',
      char_length: 200,
      comment: __t('maps_ui_global_settings_google_api_key')
    }],
    Input: Input,
    list: function (options) {
      return (options.value) ? options.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0, 100) : '';
    }
  });
});
