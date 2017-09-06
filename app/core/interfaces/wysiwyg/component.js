define(['core/interfaces/wysiwyg/interface', 'core/UIComponent', 'core/t'], function (Input, UIComponent, __t) {
  'use strict';

  return UIComponent.extend({
    id: 'wysiwyg',
    dataTypes: ['TEXT', 'VARCHAR', 'CHAR', 'TINYTEXT', 'MEDIUMTEXT', 'LONGTEXT'],
    Input: Input,
    options: [
      {
        id: 'read_only',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Force this interface to be read only',
        default_value: false
      },
      {
        id: 'buttons',
        ui: 'checkboxes',
        type: 'String',
        comment: 'Buttons that will be shown when selecting text',
        default_value: 'bold,italic,underline,anchor,h2,h3,quote',
        nullable: true,
        options: {
          options: {
            bold: 'Bold',
            italic: 'Italic',
            underline: 'Underline',
            strikethrough: 'Strikethrough',
            subscript: 'Subscript',
            superscript: 'Superscript',
            anchor: 'Link',
            quote: 'Quote',
            pre: 'Pre',
            orderedlist: 'Ordered List',
            unorderedlist: 'Unordered List',
            h1: 'H1',
            h2: 'H2',
            h3: 'H3',
            h4: 'H4',
            h5: 'H5',
            h6: 'H6',
            removeFormat: 'Remove all formatting'
          }
        }
      },
      {
        id: 'simple_editor',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Simplify styling of the interface input',
        default_value: false
      }
    ],
    validate: function (value, interfaceOptions) {
      if (interfaceOptions.view.isRequired() && !value) {
        return __t('this_field_is_required');
      }
    },
    list: function (interfaceOptions) {
      return interfaceOptions.value
        ? interfaceOptions.value.toString().replace(/(<([^>]+)>)/ig, '').substr(0, 100)
        : '';
    }
  });
});
