/* global _ */
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

      if (this.options.settings.get('wrap_with_delimiter')) {
        out = delimiter + out.join(delimiter) + delimiter;
      } else {
        out = out.join(delimiter);
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
      var out = [];

      out.push(this.value());

      if (Utils.isSomething(this.customValue())) {
        out.push(this.customValue());
      }

      out = _.uniq(out);

      out = this.delimiterize(out);

      this.model.set(this.name, out);
    },
    serialize: function () {
      var value = typeof this.options.value === 'string'
          ? this.options.value
          : this.columnSchema.get('default_value') || '';

      var values = value.split(this.options.settings.get('delimiter'));

      var options = parseOptions(this.options.settings.get('options'));

      var optionsArray = Object.keys(options).map(function (key) {
        return {
          key: key,
          value: options[key],
          selected: values.indexOf(key) >= 0
        };
      });

      function isLastValueCustom() {

        //this function looks for keys of selected options,
        // then compares these keys against the values list
        // if anything matches, there is no custom value.

        //reduces the options array to an array of selectex keys with either "undefined" or the key
        let selectedOptions = optionsArray.map(function (option){ if (option.selected == true) { return option.key } })

        //do any of the selected values in list match the second last value in values array?
        let hasCustomValue = selectedOptions.map(function(val){ if (values[values.length - 2] == val){ return false } else{ return true}})

        if(hasCustomValue.includes(false)){

          //if no matches, supplement ''
          return {
            key: 'custom',
            value: ''
          };
        }else{

          //if existing value, supplement value
          return {
            key: 'custom',
            value: values[values.length - 2]
          };

        }
      }

      var customArray = isLastValueCustom();

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
