define(['core/UIView'], function (UIView) {
  return UIView.extend({
    template: '_system/primary_key/input',

    events: {
      'input input': 'onInputChange'
    },

    onInputChange: function (event) {
      this.model.set(this.name, $(event.currentTarget).val());
    },

    visible: function () {
      if (!this.columnSchema.hasAutoIncrement()) {
        return true;
      }
    },

    serialize: function () {
      var value = this.options.value;
      var hasAutoIncrement = this.columnSchema.hasAutoIncrement();

      if (!value && hasAutoIncrement) {
        value = '--';
      }

      return {
        isDisabled: hasAutoIncrement,
        value: value
      };
    }
  });
});
