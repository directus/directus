define([
  'core/interfaces/tags/interface',
  'underscore',
  'core/UIComponent',
  'core/t'
], function (Input, _, UIComponent, __t) {
  'use strict';

  return UIComponent.extend({
    id: 'tags',
    dataTypes: ['VARCHAR', 'CHAR', 'TINYTEXT', 'TEXT', 'MEDIUMTEXT', 'LONGTEXT'],
    options: [
      {
        id: 'read_only',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Force this interface to be read only',
        default_value: false
      },
      {
        id: 'force_lowercase',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Convert all tags to lowercase',
        default_value: true
      },
      {
    	  id: 'placeholder',
    	  ui: 'text_input',
    	  type: 'String',
    	  comment: 'Enter Placeholder Text',
    	  default_value: ''
      }, {
    	  id: 'max_items',
        ui: 'numeric',
        type: 'Number',
        comment: 'Max Items (0 = no limitation)',
        default_value: '0'
      }
      // TODO: Include spaces in CSV value
    ],
    Input: Input,
    validate: function (value, interfaceOptions) {
      if (interfaceOptions.schema.isRequired() && _.isEmpty(value)) {
        return __t('this_field_is_required');
      }
    },
    list: function (interfaceOptions) {
      var tags = (interfaceOptions.value || '').split(',');

      if (tags.length > 0) {
        for (var i = 0; i < tags.length; i++) {
          tags[i] = '<span class="tag">' + tags[i] + '</span>';
        }

        return '<span class="tag-container"><div class="fade-out"></div>' + tags.join(' ') + '</span>';
      }

      return value;
    }
  });
});
