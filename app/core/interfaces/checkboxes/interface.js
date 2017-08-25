/* global _ */
define(['core/UIView', 'underscore'], function(UIView, _) {

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
    allowCustomCheckboxes() {
      if (this.options.settings.get('allow_custom_checkboxes')) {
        return true
      }
    },
    delimiterize: function(out) {

      var delimiter = this.options.settings.get('delimiter');

      if (this.options.settings.get('wrap_with_delimiter')) {
        out = delimiter + out.join(delimiter) + delimiter;
      } else {
        out = out.join(delimiter);
      }

      return out;
    },
    value: function() {
      var checkedValues = this.$('input[type=checkbox]:checked');

      var out = [];

      if (checkedValues.length > 0) {

        for (var i = 0; i < checkedValues.length; i++) {
          out.push(checkedValues[i].value);
        }

        return out

      } else {

        out = '';

        return out
      }


    },
    customValue: function() {

      var customValues = this.$('#customText')[0].value;

      return customValues;
    },

    update: function() {
      var out = []

      out.push(this.value())

      out.push(this.customValue())

      out = this.delimiterize(out);

      this.model.set(this.name, out);
    },
    serialize: function() {
      var value = typeof this.options.value === 'string' ? this.options.value :
        this.columnSchema.get('default_value') || '';
        
      var values = value.split(this.options.settings.get('delimiter'));

      var options = parseOptions(this.options.settings.get('options'));

      var optionsArray = Object.keys(options).map(function(key) {
        return {
          key: key,
          value: options[key],
          selected: values.indexOf(key) >= 0
        };
      });

      var customArray = {
        key: 'custom',
        value: values[values.length - 2]
        }

      return {
        options: optionsArray,
        custom: customArray,
        name: this.options.name,
        comment: this.options.schema.get('comment'),
        readOnly: this.options.settings.get('read_only') || !this.options.canWrite,
        value: value,
        allowCustomCheckboxes: this.options.settings.get(
          'allow_custom_checkboxes')
      };
    }
  });
});
