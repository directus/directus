//  Numeric core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define([
  'core/UIView',
  'core/t'
], function(UIView) {
  return UIView.extend({

    template: 'numeric/input',

    events: {
      'input input': 'onChangeInput'
    },

    onChangeInput: function (event) {
      this.updateValue(event.currentTarget.value);
    },

    updateValue: function (value) {
      this.model.set(this.name, value);
    },

    serialize: function () {
      var value = '';

      if (!isNaN(this.options.value)) {
        value = this.options.value;
      }

      // Fill in default value
      if (
        this.options.value === undefined &&
        this.options.schema.has('default_value')) {
          value = this.options.schema.get('default_value');
      }

      var step = 1;

      if (
        this.options.schema.get('type') === 'FLOAT' ||
        this.options.schema.get('type') === 'VARCHAR' ||
        this.options.schema.get('type') === 'CHAR'
      ) {
        step = 'any';
      }

      if (this.model.isNew()) {
        this.updateValue(value);
      }

      return {
        value: value,
        name: this.options.name,
        size: this.options.settings.get('size'),
        placeholder: (this.options.settings) ? this.options.settings.get('placeholder') : '',
        comment: this.options.schema.get('comment'),
        readonly: !this.options.canWrite,
        step: step
      };
    }
  });
});
