define(['underscore', 'core/widgets/ButtonWidget', 'core/t'], function (_, ButtonWidget, __t) {
  return ButtonWidget.extend({
    widgetId: 'info-widget',

    constructor: function (options) {
      ButtonWidget.prototype.constructor.apply(this, arguments);

      options = _.extend((options || {}), {
        widgetOptions: {
          iconClass: 'info',
          buttonClass: 'blank',
          buttonText: __t('options'),
          help: __t('right_pane_help')
        }
      });

      this._configure(options);
    }
  });
});
