define(['./interface', 'core/UIComponent', 'core/t'], function (Input, UIComponent, __t) {

  'use strict';

  return UIComponent.extend({
    id: 'wysiwyg_full',
    dataTypes: ['VARCHAR', 'TEXT', 'MEDIUMTEXT', 'LONGTEXT'],
    Input: Input,
    variables: [
      {id: 'show_element_path', ui: 'toggle', default: true},
      {
        id: 'headings',
        ui: 'radio_buttons',
        default_value: 'h2,h3,h4',
        options: {
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
        ui: 'radio_buttons',
        default_value: 'bold,italic,underline',
        options: {
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
        ui: 'radio_buttons',
        default_value: 'p,blockquote',
        options: {
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
        ui: 'radio_buttons',
        default_value: '',
        options: {
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
        ui: 'radio_buttons',
        default_value: 'inline,table,undo,redo,subscript,superscript,bullist,numlist,link,unlink,image,media',
        options: {
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
            media: 'Insert Media'
          }
        }
      },
      {
        id: 'custom_toolbar_options',
        ui: 'text_input',
        default_value: '',
        options: {
          placeholder: 'undo redo | table'
        },
        comment: 'Space separated list of <a href="https://www.tinymce.com/docs/configure/editor-appearance/#toolbar" target="_blank" rel="noopener">TinyMCE toolbar controls</a>'
      },
      {
        id: 'custom_wrapper',
        ui: 'json',
        default_value: '',
        options: {
          rows: 25,
          placeholder_text: '{\n    "highlight": {\n        "name": "Add Highlight",\n        "template": "<div class=\'highlight\'>{{text}}</div>",\n        "selector": "div.highlight",\n        "preview_style": "border: 2px dashed grey;"\n   }\n}'
        }
      }
    ],
    validate: function (value, options) {
      if (options.view.isRequired() && !value) {
        return __t('this_field_is_required');
      }
    },
    list: function (options) {
      return options.value ? options.value.toString().replace(/(<([^>]+)>)/ig, '').substr(0, 100) : '';
    }
  });
});
