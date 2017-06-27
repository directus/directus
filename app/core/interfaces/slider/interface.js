define(['core/UIView'], function (UIView) {
  'use strict';

  return UIView.extend({
    template: 'slider/input',

    events: {
      'input input[type=range]': 'onInputChange'
    },

    onInputChange: function (event) {
      var value = event.target.value;

      this.$('span.slider-value').html(value + ' ' + this.options.settings.get('unit'));
      this.model.set(this.name, value);
    },

    serialize: function () {
      if (this.options.model.isNew() && this.options.schema.has('default_value')) {
        this.options.value = this.options.schema.get('default_value');
      }

      return {
        value: this.options.value || 0,
        name: this.options.name,
        readOnly: this.options.settings.get('read_only') || !this.options.canWrite,
        min: this.options.settings.get('minimum'),
        max: this.options.settings.get('maximum'),
        step: this.options.settings.get('step'),
        comment: this.options.schema.get('comment'),
        unit: this.options.settings.get('unit')
      };
    }
  });
});
