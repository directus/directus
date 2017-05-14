define(['./interface', 'core/UIComponent', 'core/t'], function (Input, UIComponent, __t) {
  'use strict';

  return UIComponent.extend({
    id: 'map',
    dataTypes: ['VARCHAR', 'ALIAS'],
    variables: [
      // Google API Key (Provided by Google)
      {id: 'apiKey', type: 'String', default_value: '', ui: 'textinput', char_length: 200},
      // Column names to fill with respective item
      {id: 'street_number_field', type: 'String', default_value: '', ui: 'textinput', char_length: 200},
      {id: 'street_field', type: 'String', default_value: '', ui: 'textinput', char_length: 200},
      {id: 'city_field', type: 'String', default_value: '', ui: 'textinput', char_length: 200},
      {id: 'postal_code_field', type: 'String', default_value: '', ui: 'textinput', char_length: 200},
      {id: 'state_field', type: 'String', default_value: '', ui: 'textinput', char_length: 200},
      {id: 'stateCode_field', type: 'String', default_value: '', ui: 'textinput', char_length: 200},
      {id: 'country_field', type: 'String', default_value: '', ui: 'textinput', char_length: 200},
      {id: 'countryCode_field', type: 'String', default_value: '', ui: 'textinput', char_length: 200},
      // Height of Map Element in Pixels
      {id: 'mapHeight', type: 'Number', default_value: 400, ui: 'numeric', char_length: 4, comment: __t('map_mapHeight_comment')},
      {id: 'showLatLng', type: 'Boolean', default_value: false, ui: 'checkbox', comment: __t('map_showLatLng_comment')}
    ],
    settings: [{
      collection: 'global',
      id: 'google_api_key',
      ui: 'textinput',
      char_length: 200,
      comment: __t('maps_ui_global_settings_google_api_key')
    }],
    Input: Input,
    list: function (options) {
      return (options.value) ? options.value.toString().replace(/<(?:.|\n)*?>/gm, '').substr(0, 100) : '';
    }
  });
});
