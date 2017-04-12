define([
  'core/interfaces/tags/interface',
  'underscore',
  'core/UIComponent',
  'core/t'
], function(Input, _, UIComponent, __t) {
  'use strict';

  return UIComponent.extend({
    id: 'tags',
    dataTypes: ['TEXT','VARCHAR','CHAR'],
    variables: [
      {id: 'force_lowercase', type: 'Boolean', default_value: true, ui: 'checkbox'} // When on, all entered tags are converted to lowercase
      // TODO: Include spaces in CSV value
    ],
    Input: Input,
    validate: function(value, options) {
      if (options.schema.isRequired() && _.isEmpty(value)) {
        return __t('this_field_is_required');
      }
    },
    list: function(options) {
      var tags = options.model.attributes.tags ? options.model.attributes.tags.split(',') : [];

      if(tags.length){
        for (var i = 0; i < tags.length; i++) {
          tags[i] = '<span class="tag">' + tags[i] + '</span>';
        }

        return '<span class="tag-container"><div class="fade-out"></div>' + tags.join(' ') + '</span>';
      } else {
        return options.model.attributes.tags;
      }
    }
  });
});
