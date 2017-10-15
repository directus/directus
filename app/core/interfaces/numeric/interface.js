//  Numeric core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define([
  'core/UIView',
  'utils',
  'core/t'
], function (UIView, Utils, __t) {
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
      if (this.columnSchema.isDecimal()) {
        var scale = this.columnSchema.getScale();
        step = 'any';

        if (scale > 0) {
          step = '0.' + Utils.repeatString('0', scale - 1) + '1';
        }
      }

      // NOTE: we shouldn't update the model with the default value
      // the database will take care of this
      // unless we have to do it for some reason
      // if that's needed we should implement a set before save event
      // if (this.model.isNew()) {
      //   this.updateValue(value);
      // }

      return {
        value: value,
        name: this.options.name,
        size: this.options.settings.get('size'),
        placeholder: (this.options.settings) ? this.options.settings.get('placeholder') : '',
        comment: this.options.schema.get('comment'),
        readOnly: this.options.settings.get('read_only') || !this.options.canWrite,
        step: step
      };
    }
  });
});
