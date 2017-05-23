define(['core/UIView', 'tinyMCE'], function (UIView, tinyMCE) {
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
        selector: '#wysiwyg_' + this.options.name
      });
    }
  });
});
