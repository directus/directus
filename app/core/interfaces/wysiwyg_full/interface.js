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
      this.editor = tinyMCE.init({
        selector: '#wysiwyg_' + this.options.name,
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
    }
  });
});
