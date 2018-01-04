define(['./interface', 'core/UIComponent', 'core/t'], function (Input, UIComponent, __t) {
  'use strict';

  return UIComponent.extend({
    id: 'wysiwyg_full',
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
        id: 'show_element_path',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Show the element path (e.g. "div > p > b")',
        default_value: true
      },
      {
        id: 'headings',
        ui: 'checkboxes',
        type: 'String',
        comment: 'What heading levels to support',
        default_value: 'h2,h3,h4',
        options: {
          wrap_with_delimiter: false,
          options: {
            h1: 'Heading 1',
            h2: 'Heading 2',
            h3: 'Heading 3',
            h4: 'Heading 4',
            h5: 'Heading 5',
            h6: 'Heading 6'
          }
        }
      },
      {
        id: 'inline',
        ui: 'checkboxes',
        type: 'String',
        comment: 'What text-style options to support',
        default_value: 'bold,italic,underline',
        options: {
          wrap_with_delimiter: false,
          options: {
            bold: 'Bold',
            italic: 'Italic',
            underline: 'Underline',
            strikethrough: 'Strikethrough',
            superscript: 'Superscript',
            subscript: 'Subscript',
            code: 'Code'
          }
        }
      },
      {
        id: 'blocks',
        ui: 'checkboxes',
        type: 'String',
        comment: 'What block-style options to support',
        default_value: 'p,blockquote',
        options: {
          wrap_with_delimiter: false,
          options: {
            p: 'Paragraph',
            blockquote: 'Blockquote',
            div: 'Div',
            pre: 'Pre'
          }
        }
      },
      {
        id: 'alignment',
        ui: 'checkboxes',
        type: 'String',
        comment: 'What alignment options to support',
        default_value: '',
        options: {
          wrap_with_delimiter: false,
          options: {
            alignleft: 'Left',
            aligncenter: 'Center',
            alignright: 'Right',
            alignjustify: 'Justify'
          }
        }
      },
      {
        id: 'toolbar_options',
        ui: 'checkboxes',
        type: 'String',
        comment: 'What options to show in the toolbar',
        default_value: 'inline,table,undo,redo,subscript,superscript,bullist,numlist,link,unlink,image,media,paste',
        options: {
          wrap_with_delimiter: false,
          options: {
            inline: 'Inline Options',
            alignment: 'Alignment Options',
            table: 'Tables',
            undo: 'Undo',
            redo: 'Redo',
            removeformat: 'Remove Format',
            subscript: 'Subscript',
            superscript: 'Superscript',
            hr: 'Horizontal Rule (<hr>)',
            bullist: 'Unordered List',
            numlist: 'Ordered List',
            link: 'Link',
            unlink: 'Unlink',
            openlink: 'Open Link',
            image: 'Image',
            pagebreak: 'Page Break',
            code: 'View Source',
            insertdatetime: 'Time and Date',
            media: 'Insert Media',
            paste: 'Formatted paste',
            preview: 'Preview editor output'
          }
        }
      },
      {
        id: 'custom_toolbar_options',
        ui: 'text_input',
        type: 'String',
        comment: 'Space separated list of <a href="https://www.tinymce.com/docs/configure/editor-appearance/#toolbar" target="_blank" rel="noopener">TinyMCE toolbar controls</a>',
        default_value: '',
        options: {
          placeholder: 'undo redo | table'
        }
      },
      {
        id: 'custom_wrapper',
        ui: 'json',
        type: 'Object',
        comment: 'Add custom html-element wrapper(s)',
        default_value: '',
        options: {
          rows: 25,
          placeholder: JSON.stringify({
            highlight: {
              name: 'Add Highlight',
              template: '"<div class=\'highlight\'>{{text}}</div>"',
              selector: 'div.highlight',
              preview_style: 'border: 2px dashed grey;',
              label: 'HL'
            }
          }, null, '  ')
        }
      },
      {
        id: 'max_height',
        ui: 'numeric',
        type: 'Number',
        comment: 'Set the max height the editor will resize to',
        default_value: 500
      },
      {
        id: 'remove_unsafe_tags',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Have the editor remove potentially unsafe tags like iframe and script',
        default_value: true
      },
      {
        id: 'basic_image_list',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'use basic image listing in ui (potentially slow with high number of images)',
        default_value: true
      },
      {
        id: 'show_format_menu',
        ui: 'toggle',
        type: 'Boolean',
        comment: 'Show the format menu',
        default_value: true
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
