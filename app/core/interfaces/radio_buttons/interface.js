define([
  'underscore',
  'core/UIView'
], function (_, UIView) {
  'use strict';

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
    template: 'radio_buttons/input',
    events: {
      'change input[type=radio]': 'updateValue',
      'input input[type=text]': 'setCustomValue'
    },
    updateValue: function (event) {
      this.model.set(this.name, event.currentTarget.value);
    },
    setCustomValue: function (event) {
      this.model.set(this.name, event.currentTarget.value);
    },
    serialize: function () {
      var value = this.options.value || this.columnSchema.get('default_value') || '';
      var options = parseOptions(this.options.settings.get('options'));
      var optionsArray = Object.keys(options).map(function (key) {
        return {
          key: key,
          value: options[key],
          selected: value === key
        };
      });

      var valueIsCustom = false;

      if (
        this.options.settings.get('allow_custom_value') &&
        optionsArray.filter(function (option) {
          return option.selected;
        }).length === 0 &&
        value.length > 0
      ) {
        valueIsCustom = true;
      }

      return {
        options: optionsArray,
        name: this.options.name,
        comment: this.options.schema.get('comment'),
        readOnly: this.options.settings.get('read_only') || !this.options.canWrite,
        value: value,
        allow_custom: this.options.settings.get('allow_custom_value'),
        valueIsCustom: valueIsCustom
      };
    }
  });
});
