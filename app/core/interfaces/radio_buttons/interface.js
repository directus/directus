define(['core/UIView'], function (UIView) {
  function parseOptions(options) {
    if (_.isString(options)) {
      try {
        options = JSON.parse(options);
      } catch (err) {
        options = {};
      }
    }

    return options;
  }

  return UIView.extend({
    template: 'select_list/input',
    events: {
      'change input[type=radio]': 'updateValue'
    },
    updateValue: function (event) {
      this.model.set(this.name, event.currentTarget.value);
    },
    serialize: function () {
      var value = this.options.value || this.columnSchema.get('default_value') || '';
      var options = parseOptions(this.options.settings.get('options'));
      var optionsArray = Object.keys(options).map(function (key) {
        return {
          key,
          value: options[key],
          selected: value === key
        };
      });

      return {
        options: optionsArray,
        name: this.options.name,
        comment: this.options.schema.get('comment'),
        readonly: !this.options.canWrite,
        value: value
      };
    }
  });
});
