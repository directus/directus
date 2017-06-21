define(['core/UIView'], function (UIView) {
  return UIView.extend({
    template: '_system/status/input',

    events: {
      'change input[type=radio]': function (event) {
        var statusValue = $(event.currentTarget).val();

        this.$('input[type=hidden]').val(statusValue);
        this.model.set(this.name, statusValue);
      }
    },

    serialize: function () {
      var currentStatus = this.options.value;
      var model = this.model;

      var statuses = model.getStatusVisible().map(function (status) {
        var item = status.toJSON();

				// NOTE: do not strictly compare as status can (will) be string
        item.selected = status.get('id') == currentStatus; // eslint-disable-line eqeqeq
        item.model = status;
        item.color = item.background_color || item.color;

        return item;
      });

      statuses.sort(function (a, b) {
        return a.sort < b.sort;
      });

      return {
        name: this.options.name,
        value: this.options.value,
        readonly: !this.options.canWrite,
        statuses: statuses
      };
    }
  });
});
