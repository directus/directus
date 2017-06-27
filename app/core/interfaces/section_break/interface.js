define(['core/UIView'], function (UIView) {
  'use strict';

  return UIView.extend({
    template: 'section_break/input',
    fieldClass: function () {
      return this.options.settings.get('show_inline') ? false : 'break-header';
    },
    hideLabel: true,

    serialize: function () {
      var value = this.options.value || '';

      return {
        value: value,
        inline: this.options.settings.get('show_inline'),
        title: this.options.settings.get('title') || '',
        instructions: this.options.settings.get('instructions') || ''
      };
    }
  });
});
