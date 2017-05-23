define(['core/UIView', 'tinymce'], function (UIView, tinymce) {
  return UIView.extend({
    template: 'wysiwyg-full/input',
    serialize: function () {
      var value = this.options.value || '';
      return {
        value: value,
        name: this.options.name
      };
    },
    afterRender: function () {
      this.editor = tinymce.init({
        selector: '#wysiwyg_' + this.options.name
      });
    }
  });
});
