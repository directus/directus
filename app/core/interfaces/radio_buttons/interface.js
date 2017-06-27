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
          key: key,
          value: options[key],
          selected: value === key
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
