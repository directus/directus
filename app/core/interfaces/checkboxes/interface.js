define([
  'core/UIView',
  'underscore',
  'utils'
], function (UIView, _, Utils) {
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
      'change input[type=checkbox]': 'update',
      'change #customText': 'update'
    },
    delimiterize: function (out) {
      var delimiter = this.options.settings.get('delimiter');

      out = out.join(delimiter);

      if (this.options.settings.get('wrap_with_delimiter')) {
        out = delimiter + out + delimiter;
      }

      return out;
    },
    value: function () {
      var checkedValues = this.$('input[type=checkbox]:checked');
      var out = [];

      for (var i = 0; i < checkedValues.length; i++) {
        out.push(checkedValues[i].value);
      }

      return out;
    },
    customValue: function () {
      return this.$('#customText').val();
    },

    update: function () {
      var out = this.value();

      if (Utils.isSomething(this.customValue())) {
        out.push(this.customValue());
      }

      out = _.uniq(out);

      out = this.delimiterize(out);

      this.model.set(this.name, out);
    },
    serialize: function () {
      var value = typeof this.options.value === 'string' ?
        this.options.value :
        this.columnSchema.get('default_value') || '';

      var values = value.split(this.options.settings.get('delimiter'));

      var options = parseOptions(this.options.settings.get('options'));

      var optionsArray = Object.keys(options).map(function (key) {
        return {
          key: key,
          value: options[key],
          selected: values.indexOf(key) >= 0
        };
      });

      function getCustomValue(values, isWrappedInDelimiter) {
        if (isWrappedInDelimiter) {
          values.shift();
          values.pop();
        }

        // reduces the options array to an array of selected keys
        var selectedOptions = optionsArray
          .filter(function (option) {
            return option.selected;
          })
          .map(function (option) {
            return option.key;
          });

        var potentialCustomValue = values[values.length - 1];
        var hasCustomValue = selectedOptions.indexOf(potentialCustomValue) === -1;

        if (hasCustomValue) {
          return {
            key: 'custom',
            value: potentialCustomValue
          };
        }

        // if existing value, supplement value
        return {
          key: 'custom',
          value: ''
        };
      }

      var customArray = getCustomValue(
        values,
        this.options.settings.get('wrap_with_delimiter')
      );

      return {
        options: optionsArray,
        custom: customArray,
        name: this.options.name,
        comment: this.options.schema.get('comment'),
        readOnly: this.options.settings.get('read_only') || !this.options.canWrite,
        value: value,
        allowCustomCheckboxes: this.options.settings.get(
          'allow_custom_checkboxes'
        )
      };
    }
  });
});
