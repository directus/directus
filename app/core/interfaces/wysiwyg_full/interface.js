define(['core/UIView', 'tinyMCE', 'Utils'], function (UIView, tinyMCE, Utils) {
  return UIView.extend({
    template: 'wysiwyg_full/input',
    serialize: function () {
      var value = this.options.value || '';
      return {
        value: value,
        name: this.options.name
      };
    },
    afterRender: function () {
      function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
      }

      var settings = this.options.settings;

      var elementpath = Boolean(Number(settings.get('show_element_path')));

      var toolbar = '';

      // Format menu (styleselect) options
      var styleFormats = [];

      var headings = settings.get('headings').split(',');

      if (headings.length > 0) {
        styleFormats.push({
          title: 'Headings',
          items: headings.map(function (heading) {
            return {
              title: 'Heading ' + heading.slice(-1), // Heading + last char of h1 thru h6 = 1...6
              format: heading
            };
          })
        });
      }

      var inline = settings.get('inline').split(',');

      if (inline.length > 0) {
        styleFormats.push({
          title: 'Inline',
          items: inline.map(function (option) {
            return {
              title: capitalizeFirstLetter(option),
              icon: option,
              format: option
            };
          })
        });
      }

      var blocks = settings.get('blocks').split(',');

      if (blocks.length > 0) {
        styleFormats.push({
          title: 'Blocks',
          items: blocks.map(function (option) {
            return {
              title: option === 'p' ? 'Paragraph' : capitalizeFirstLetter(option),
              format: option
            };
          })
        });
      }

      var alignment = settings.get('alignment').split(',');

      if (alignment.length > 0) {
        styleFormats.push({
          title: 'Alignment',
          items: alignment.map(function (option) {
            return {
              title: capitalizeFirstLetter(option.substring(5)),
              icon: option,
              format: option
            };
          })
        });
      }

      var toolbarOptions = settings.get('toolbar_options').split(',');

      if (toolbarOptions.length > 0) {
        toolbar += toolbarOptions.reduce(function (str, option) {
          if (str === 'inline') {
            return str = inline.reduce(function (inlineStr, option) {
              return inlineStr += ' ' + option;
            });
          } else if (option === 'alignment') {
            return str += alignment.reduce(function (alignmentStr, option) {
              return alignmentStr += ' ' + option;
            });
          } else {
            return str += ' ' + option;
          }
        });
      }

      toolbar += settings.get('custom_toolbar_options');

      console.log(toolbar);

      this.editor = tinyMCE.init({
        plugins: 'table hr lists link image print pagebreak code fullscreen insertdatetime media',
        selector: '#wysiwyg_' + this.options.name,
        branding: false,
        elementpath: elementpath,
        menubar: false,
        toolbar: (styleFormats.length > 0 ? 'styleselect | ' : '') + toolbar,
        style_formats: styleFormats,
        setup: function (editor) {
          var saveEditorContents = Utils.debounce(function () {
            editor.save();
          }, 500);

          // All events on which the contents of the editor should be saved
          editor.on('input', saveEditorContents);
          editor.on('ExecCommand', saveEditorContents);
          editor.on('blur', saveEditorContents);
          editor.on('paste', saveEditorContents);
          editor.on('undo', saveEditorContents);
          editor.on('redo', saveEditorContents);
          editor.on('NodeChange', saveEditorContents);
        }
      });
    },
    cleanup: function () {
      // Remove tinyMCE
      tinyMCE.remove();

      delete this.editor;
    }
  });
});
