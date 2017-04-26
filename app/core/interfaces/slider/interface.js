define(['core/UIView'], function (UIView) {
  'use strict';

  return UIView.extend({
    template: 'slider/input',

    events: {
      'input .slider': function (e) {
        var value = e.target.value;
        this.$el.find('span.slider-value').html(value);
      }
    },
    serialize: function () {
      if (this.options.model.isNew() && this.options.schema.has('default_value')) {
        this.options.value = this.options.schema.get('default_value');
      }

      return {
        value: this.options.value || '0',
        name: this.options.name,
        min: this.options.settings.get('minimum'),
        max: this.options.settings.get('maximum'),
        step: this.options.settings.get('step'),
        comment: this.options.schema.get('comment')
      };
    }
  });
});
