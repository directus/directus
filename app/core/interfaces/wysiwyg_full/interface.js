define([
  'underscore',
  'core/UIView',
  'tinyMCE'
], function (_, UIView, tinyMCE) {

  'use strict';

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
      var self = this;
      var settings = this.options.settings;
      var elementpath = Boolean(Number(settings.get('show_element_path')));
      var styleFormats = []; // Format menu (styleselect) options
      var headings = settings.get('headings').split(',');
      var inline = settings.get('inline').split(',');
      var blocks = settings.get('blocks').split(',');
      var alignment = settings.get('alignment').split(',');
      var toolbarOptions = settings.get('toolbar_options').split(',');
      var toolbar;

      function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
      }

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

      toolbar = (styleFormats.length > 0 ? 'styleselect | ' : '');

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

      // Parse custom_wrapper and add to toolbar
      var customWrapperSettings;
      if (settings.get('custom_wrapper').length > 0) {
        try {
          customWrapperSettings = JSON.parse(settings.get('custom_wrapper'));
        } catch (err) {
          console.error(err);
        }

        toolbar += ' | ' + Object.keys(customWrapperSettings).join(' ');
      }

      this.editor = tinyMCE.init({
        plugins: 'table hr lists link image print pagebreak code insertdatetime media',
        selector: '#wysiwyg_' + this.options.name,
        branding: false,
        skin: 'directus',
        elementpath: elementpath,
        menubar: false,
        toolbar: toolbar,
        style_formats: styleFormats,
        setup: function (editor) {
          var saveEditorContents = _.debounce(function () {
            self.model.set(self.name, editor.getContent());
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

          if (customWrapperSettings) {
            var previewStyles = '';

            Object.keys(customWrapperSettings).map(function(identifier) {
              // Add preview styling if set
              if (customWrapperSettings[identifier].selector && customWrapperSettings[identifier].preview_style) {
                previewStyles += customWrapperSettings[identifier].selector + ' {' + customWrapperSettings[identifier].preview_style + '}\n';
              }

              // Add button to editor
              editor.addButton(identifier, {
                title: customWrapperSettings[identifier].name,
                text: customWrapperSettings[identifier].name.match(/\b(\w)/g).join('').toUpperCase(),
                onclick: function () {
                  var text = editor.selection.getContent({format: 'text'});
                  if (text && text.length > 0) {
                    editor.execCommand('mceInsertContent', false, customWrapperSettings[identifier].template.replace(/{{text}}/g, text));
                  }
                }
              });
            });

            previewStyles += '';

            // This = tinyMCE instance
            this.contentStyles.push(previewStyles);
          }
        }
      });
    },

    cleanup: function () {
      // Remove tinyMCE
      tinyMCE.remove();

      this.editor = null;
    }
  });
});
