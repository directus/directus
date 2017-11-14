/* global _ */
define([
  'underscore',
  'core/UIView',
  'utils',
  'select2'
], function (_, UIView, Utils) {

  return UIView.extend({
    template: 'dropdown_enum/input',
    events: {
      'change select': 'updateValue'
    },
    updateValue: function (event) {
      this.value = event.currentTarget.value
      this.model.set(this.name, this.value);
    },
    unsavedChange: function () {
      // NOTE: Only set the new value (mark changed) if the value has changed
      var hasValue = Utils.isSomething(this.value);
      var nullable = this.columnSchema.isNullable();

      if ((hasValue || this.value === null && nullable)  && (this.model.isNew() || this.model.hasChanges(this.name))) {
        return this.value;
      }
    },
    serialize: function () {
      var value = this.options.value || this.columnSchema.get('default_value') || '';

      var enumText = this.options.schema.attributes.column_type;
      enumText = enumText.substr(5, enumText.length - 6); // Remove enum() from string
      enumText = enumText.replace(/'/g, '');
      var enumArray = enumText.split(',');

      enumArray = _.map(enumArray, function (enumValue) {
        return {
          value: enumValue,
          selected: enumValue === value
        };
      });

      return {
        options: enumArray,
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
    },

    initialize: function (options) {
      this.value = options.value !== undefined ? options.value : options.default_value;
    }
  });
});
