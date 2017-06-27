define(['underscore', 'utils', 'core/UIView'], function (_, Utils, UIView) {
  return UIView.extend({
    template: 'toggle/input',

    events: {
      'change input[type=checkbox]': function () {
        var value = (this.$el.find('input[type=checkbox]:checked').val() === undefined) ? 0 : 1;
        this.$('input[type=hidden]').val(value);
        this.model.set(this.name, value);
      }
    },

    serialize: function () {
      var value = this.options.value;

      if (value === undefined && this.options.schema.has('default_value')) {
        value = this.options.schema.get('default_value');
      }

      if (!_.isBoolean(value)) {
        value = Utils.convertToBoolean(value);
      }

      return {
        name: this.options.name,
        selected: (value === true),
        label: this.options.settings.get('label'),
        showAsCheckbox: Number(this.options.settings.get('show_as_checkbox')) === 1,
        readOnly: this.options.settings.get('read_only') || !this.options.canWrite
      };
    }
  });
});
