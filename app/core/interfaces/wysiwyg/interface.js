define(['core/UIView', 'core/interfaces/wysiwyg/vendor/medium-editor.min'], function (UIView, MediumEditor) {
  var buttonTypes = {
    bold: {
      name: 'bold',
      action: 'bold',
      aria: 'bold',
      tagNames: ['b', 'strong'],
      contentDefault: '<i class="material-icons">format_bold</i>'
    },
    italic: {
      name: 'italic',
      action: 'italic',
      aria: 'italic',
      tagNames: ['i', 'em'],
      contentDefault: '<i class="material-icons">format_italic</i>'
    },
    underline: {
      name: 'underline',
      action: 'underline',
      aria: 'underline',
      tagNames: ['u'],
      contentDefault: '<i class="material-icons">format_underline</i>'
    },
    strikethrough: {
      name: 'strikethrough',
      action: 'strikethrough',
      aria: 'strikethrough',
      tagNames: ['s', 'strike'],
      contentDefault: '<i class="material-icons">strikethrough_s</i>'
    },
    subscript: 'subscript', // Use default
    superscript: 'superscript', // Use default
    anchor: 'anchor', // Use default
    quote: {
      name: 'quote',
      action: 'append-blockquote',
      aria: 'quote',
      tagNames: ['blockquote', 'q'],
      contentDefault: '<i class="material-icons">format_quote</i>'
    },
    pre: 'pre', // Use default
    orderedlist: {
      name: 'orderedlist',
      action: 'insertorderedlist',
      aria: 'orderedlist',
      tagNames: ['ol'],
      contentDefault: '<i class="material-icons">format_list_numbered</i>'
    },
    unorderedlist: {
      name: 'unorderedlist',
      action: 'insertunorderedlist',
      aria: 'unorderedlist',
      tagNames: ['ul'],
      contentDefault: '<i class="material-icons">format_list_bulleted</i>'
    },
    h1: 'h1', // Use default
    h2: 'h2', // Use default
    h3: 'h3', // Use default
    h4: 'h4', // Use default
    h5: 'h5', // Use default
    h6: 'h6', // Use default
    removeFormat: {
      name: 'removeFormat',
      aria: 'remove formatting',
      action: 'removeFormat',
      contentDefault: '<i class="material-icons">format_clear</i>'
    }
  };

  return UIView.extend({
    template: 'wysiwyg/input',
    serialize: function () {
      var value = this.options.value || '';
      return {
        value: value,
        name: this.options.name
      };
    },
    afterRender: function () {
      new MediumEditor('#wysiwyg-interface_' + this.options.name, {
        toolbar: {
          buttons: this.options.settings.get('buttons').split(',').map(function (buttonName) {
            return buttonTypes[buttonName];
          })
        },
        anchorPreview: false
      });
    }
  });
});
