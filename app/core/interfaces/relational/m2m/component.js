//  Relational core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
/*jshint multistr: true */

define([
  'core/UIComponent',
  'core/interfaces/relational/m2m/interface',
  'core/t'
], function (UIComponent, Input, __t) {

  'use strict';

  return UIComponent.extend({
    id: 'many_to_many',
    dataTypes: ['MANYTOMANY'],
    variables: [
      {id: 'visible_columns', type: 'String', default_value: '', ui: 'text_input', char_length: 255, required: true},
      {id: 'add_button', type: 'Boolean', default_value: true, ui: 'toggle'},
      {id: 'choose_button', type: 'Boolean', default_value: true, ui: 'toggle'},
      {id: 'remove_button', type: 'Boolean', default_value: true, ui: 'toggle'},
      {id: 'filter_type', type: 'String', default_value: 'dropdown', ui: 'dropdown', options: {options: {'dropdown':__t('dropdown'),'textinput':__t('text_input')} }},
      {id: 'filter_column', type: 'String', default_value: '', ui: 'text_input', char_length: 255, comment: __t('m2m_filter_column_comment'), required: true},
      {id: 'visible_column_template', type: 'String', default_value:'', ui: 'text_input', char_length: 255, comment: __t('m2m_visible_column_template_comment'), required: true},
      {id: 'min_entries', type: 'Number', default_value: 0, ui: 'numeric', char_length: 11, comment: __t('m2m_min_entries_comment')},
      {id: 'no_duplicates', type: 'Boolean', default_value: false, ui: 'toggle', comment: __t('m2m_no_duplicates_comment')}
    ],
    Input: Input,
    validate: function (value, options) {
      var minEntries = parseInt(options.settings.get('min_entries'));

      if(value.length < minEntries) {
        return __t('this_field_requires_at_least_x_entries', {
          count: minEntries
        });
      }

      // @TODO: Does not currently consider newly deleted items
      if (options.schema.isRequired() && value.length === 0) {
        return __t('this_field_is_required');
      }
    },
    list: function (options) {
      return 'x';
    }
  });
});
