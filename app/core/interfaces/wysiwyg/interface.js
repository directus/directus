define(['core/UIView', 'core/interfaces/wysiwyg/vendor/medium-editor.min'], function (UIView, MediumEditor) {
  'use strict';

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
      var buttonsLength = this.options.settings.get('buttons').split(',').length;

      return {
        value: value,
        name: this.name,
        widthClass: getWidthClass(buttonsLength),
        readOnly: this.options.settings.get('read_only') || !this.options.canWrite,
        simple_editor: (this.options.settings && this.options.settings.get('simple_editor') === true)
      };

      function getWidthClass(amount) {
        if (amount < 6) {
          return '';
        }

        var mod4 = amount % 4;
        var mod5 = amount % 5;
        var mod6 = amount % 6;

        if (mod4 === 0) {
          return 'width-4';
        }

        if (mod5 === 0) {
          return 'width-5';
        }

        if (mod6 === 0) {
          return 'width-6';
        }

        var highestIndex;
        var highestNumber = 0;

        [mod4, mod5, mod6].forEach(function (val, i) {
          if (val > highestNumber) {
            highestNumber = val;
            highestIndex = i;
          }
        });

        return 'width-' + (highestIndex + 4);
      }
    },

    getButtons: function () {
      var buttons = [];

      if (this.options.settings.get('buttons')) {
        buttons = this.options.settings.get('buttons').split(',').map(function (buttonName) {
          return buttonTypes[buttonName];
        });
      }

      return buttons;
    },

    afterRender: function () {
      var self = this;

      this.editor = new MediumEditor('#wysiwyg-interface_' + this.name, {
        toolbar: {
          buttons: this.getButtons()
        },
        anchorPreview: false,
        elementsContainer: document.getElementById('medium-editor-' + this.name)
      });

      this.editor.subscribe('editableInput', function (event, editable) {
        self.model.set(self.name, editable.innerHTML);
      });
    },

    cleanup: function () {
      if (this.editor) {
        this.editor.destroy();
      }
    }
  });
});
