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
    template: 'dropdown_enum/input',
    events: {
      'change select': 'updateValue'
    },
    updateValue: function (event) {
      this.model.set(this.name, event.currentTarget.value);
    },
    serialize: function () {
      var value = this.options.value || this.columnSchema.get('default_value') || '';

      var enumText = this.options.schema.attributes.column_type;
      enumText = enumText.substr(5, enumText.length - 6); // Remove enum() from string
      enumText = enumText.replace(/'/g, '');
      var enumArray = enumText.split(',');

      enumArray = _.map(enumArray, function (value) {
        var item = {};
        item.value = value;
        item.selected = (item.value === value);
        return item;
      });

      return {
        options: enumArray,
        name: this.options.name,
        comment: this.options.schema.get('comment'),
        readonly: !this.options.canWrite,
        placeholder: this.options.schema.get('placeholder'),
        readOnly: Boolean(Number(this.options.settings.get('read_only'))),
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
