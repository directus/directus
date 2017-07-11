/* global _ */
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
    template: 'checkboxes/input',
    events: {
      'change input[type=checkbox]': 'updateValue'
    },
    updateValue: function () {
      var values = this.$('input[type=checkbox]:checked');
      var delimiter = this.options.settings.get('delimiter');
      var out = [];

      if (values.length > 0) {
        for (var i = 0; i < values.length; i++) {
          out.push(values[i].value);
        }

        // Wrap the values with a pair of delimiters to allow strict searching for a single value
        if (this.options.settings.get('wrap_with_delimiter')) {
          out = delimiter + out.join(delimiter) + delimiter;
        } else {
          out = out.join(delimiter);
        }
      } else {
        out = '';
      }

      this.$('input#js-checkbox-values').val(out);
      this.model.set(this.name, out);
    },
    serialize: function () {
      var value = typeof this.options.value === 'string' ? this.options.value : this.columnSchema.get('default_value') || '';
      var values = value.split(this.options.settings.get('delimiter'));
      var options = parseOptions(this.options.settings.get('options'));

      var optionsArray = Object.keys(options).map(function (key) {
        return {
          key: key,
          value: options[key],
          selected: values.indexOf(key) > 0
        };
      });

      return {
        options: optionsArray,
        name: this.options.name,
        comment: this.options.schema.get('comment'),
        readOnly: this.options.settings.get('read_only') || !this.options.canWrite,
        value: value
      };
    }
  });
});
