define(['core/UIView'], function (UIView) {
  return UIView.extend({
    template: '_system/primary_key/input',
    serialize: function () {
      var value = this.options.value;
      return {
        value: value || '--'
      };
    }
  });
});
