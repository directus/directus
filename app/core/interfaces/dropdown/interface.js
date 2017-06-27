/* global _ */
define(['core/UIView', 'select2'], function (UIView) {
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
    template: 'dropdown/input',
    events: {
      'change select': 'updateValue'
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
        readonly: !this.options.canWrite,
        placeholder: this.options.schema.get('placeholder'),
        readOnly: this.options.settings.get('read_only') || !this.options.canWrite,
        native: Boolean(Number(this.options.settings.get('use_native_input'))),
        value: value
      };
    },

    afterRender: function () {
      var native = Boolean(Number(this.options.settings.get('use_native_input'))) || false;

      if (!native) {
        this.$el.find('select').select2({
          minimumResultsForSearch: 10
        });
      }
    }
  });
});
