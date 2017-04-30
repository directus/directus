//  Select Core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define(['core/interfaces/select/interface', 'underscore', 'core/UIComponent', 'core/t', 'utils', 'select2'], function (Input, _, UIComponent, __t, Utils, select2) {
  'use strict';

  var SHOW_SELECT_OPTIONS = {
    text: __t('select_ui_show_options_text'),
    value: __t('select_ui_show_options_value')
  };

  var parseOptions = function (options) {
    if (_.isString(options)) {
      try {
        options = JSON.parse(options);
      } catch (err) {
        options = {};
        console.error(err);
      }
    }

    return options;
  };

  return UIComponent.extend({
    id: 'select',
    dataTypes: ['VARCHAR', 'INT'],
    variables: [
      {id: 'options', default_value: '', ui: 'textarea', options: {rows: 25, placeholder_text: '{\n    "value1":"Option One",\n    "value2":"Option Two",\n    "value3":"Option Three"\n}'}, comment: __t('select_options_comment')},
      {id: 'allow_null', type: 'Boolean', default_value: false, ui: 'checkbox'},
      {id: 'select_multiple', type: 'Boolean', default_value: false, ui: 'checkbox'},
      {id: 'display_search', type: 'String', default_value: 'auto', required: true, ui: 'select', options: {options: {auto: __t('Auto'), always: __t('Always'), never: __t('Never')}}},
      {id: 'auto_search_limit', type: 'Number', ui: 'numeric', char_length: 20, default_value: 10, comment: __t('select_auto_search_limit_text')},
      {id: 'list_value', type: 'String', default_value: 'value', ui: 'select', options: {options: SHOW_SELECT_OPTIONS}},
      {id: 'placeholder_text', type: 'String', default_value: '', ui: 'textinput', char_length: 255, required: false, comment: __t('select_placeholder_text')},
      {id: 'input_type', type: 'String', ui: 'select', default_value: 'dropdown', options: {options: {dropdown: 'Dropdown', radio: 'Radio Buttons / Checkboxes'}}},
      {id: 'delimiter', type: 'String', default_value: ',', ui: 'textinput', char_length: 1, required: true}
    ],
    Input: Input,
    validate: function (value, options) {
      if (options.schema.isRequired() && Utils.isEmpty(value)) {
        return __t('this_field_is_required');
      }
    },
    list: function (options) {
      var value = _.isString(options.value) ? options.value.replace(/<(?:.|\n)*?>/gm, '').substr(0, 100) : options.value;

      if (options.settings.get('list_value') === 'text') {
        options = parseOptions(options.settings.get('options'));

        value = options[value];
      }

      return value;
    }
  });
});
