define(['core/interfaces/section_break/interface', 'core/UIComponent'], function (Input, UIComponent) {
  'use strict';

  return UIComponent.extend({
    id: 'section_break',
    dataTypes: ['VARCHAR', 'CHAR', 'TINYTEXT', 'TEXT', 'MEDIUMTEXT', 'LONGTEXT'],
    options: [
      {
        id: 'show_inline',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Style break like a regular input instead of a break',
        default_value: false
      },
      {
        id: 'title',
        ui: 'text_input',
        type: 'String',
        comment: 'Title of this break',
        default_value: ''
      },
      {
        id: 'instructions',
        ui: 'wysiwyg',
        type: 'String',
        comment: 'Information or instructions on the following interfaces',
        default_value: '',
        options: {
          ul: true,
          ol: true
        }
      }
    ],
    Input: Input,
    list: function (interfaceOptions) {
      var instructions = interfaceOptions.settings.get('instructions') || '...';
      var regex = /(<([^>]+)>)/ig;

      return instructions.replace(regex, '');
    }
  });
});
