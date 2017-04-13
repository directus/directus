define([
  'core/interfaces/section_break/interface',
  'core/UIComponent',
  'core/t'
], function(Input, UIComponent, __t) {
  'use strict';

  return UIComponent.extend({
    id: 'section_break',
    dataTypes: ['VARCHAR', 'TEXT'],
    variables: [
      {
        id: 'show_inline',
        type: 'Boolean',
        default_value: false,
        ui: 'checkbox'
      },
      {
        id: 'title',
        type: 'String',
        default_value: '',
        ui: 'textinput'
      },
      {
        id: 'instructions',
        type: 'String',
        default_value: '',
        ui: 'wysiwyg',
        options: {
          'ul': true,
          'ol': true
        }
      }
    ],
    Input: Input,
    list: function(options) {
      var instructions = options.settings.get('instructions') || '...';
      var regex = /(<([^>]+)>)/ig;

      return instructions.replace(regex, "");
    }
  });
});
