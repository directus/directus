define(['./interface', 'core/UIComponent', 'core/t'], function (Input, UIComponent, __t) {
  return UIComponent.extend({
    id: 'wysiwyg_full',
    dataTypes: ['VARCHAR', 'TEXT', 'MEDIUMTEXT', 'LONGTEXT'],
    Input: Input,
    variables: [
      {id: 'show_element_path', ui: 'checkbox', default: true},
      {
        id: 'headings',
        ui: 'select',
        default_value: 'h2,h3,h4',
        options: {
          select_multiple: true,
          input_type: 'radio',
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
        ui: 'select',
        default_value: 'bold,italic,underline',
        options: {
          select_multiple: true,
          input_type: 'radio',
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
        ui: 'select',
        default_value: 'p,blockquote',
        options: {
          select_multiple: true,
          input_type: 'radio',
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
        ui: 'select',
        default_value: '',
        options: {
          select_multiple: true,
          input_type: 'radio',
          options: {
            alignleft: 'Left',
            aligncenter: 'Center',
            alignright: 'Right',
            alignjustify: 'Justify'
          }
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
