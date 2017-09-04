/* global _ */
define([
  'core/UIView',
  'underscore',
  'utils',
  'core/t',
  'select2'
], function (UIView, _, Utils, __t) {
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
    unsavedChange: function () {
      // NOTE: Only set the new value (mark changed) if the value has changed
      var hasValue = Utils.isSomething(this.value);
      var nullable = this.columnSchema.isNullable();

      if ((hasValue || this.value === null && nullable)  && (this.model.isNew() || this.model.hasChanges(this.name))) {
        return this.value;
      }
    },
    updateValue: function (event) {
      this.value = event.currentTarget.value;
      this.model.set(this.name, this.value);
    },
    serialize: function () {
      var value = this.options.value || this.columnSchema.get('default_value') || '';
      var options = parseOptions(this.options.settings.get('options'));
      var hasPlaceHolder = this.options.schema.has('placeholder');
      var placeholder = this.options.schema.get('placeholder') || __t('select_from_below');
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
        showSelectOption: hasPlaceHolder || this.columnSchema.isNullable(),
        placeholder: placeholder,
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
    },

    initialize: function (options) {
      this.value = options.value !== undefined ? options.value : options.default_value;
    }
  });
});
