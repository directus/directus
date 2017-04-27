define(['core/UIView'], function (UIView) {
  return UIView.extend({
    template: 'wysiwyg/input',
    serialize: function () {
      var value = this.options.value || '';
      return {
        value: value,
        name: this.options.name
      };
    }
  });
});

