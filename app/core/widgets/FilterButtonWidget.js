define(['underscore', 'core/widgets/ButtonWidget', 'core/t'], function (_, ButtonWidget, __t) {
  return ButtonWidget.extend({
    widgetId: 'filter-toggle',

    constructor: function (options) {
      ButtonWidget.prototype.constructor.apply(this, arguments);

      options = _.extend((options || {}), {
        widgetOptions: {
          iconClass: 'filter_list',
          buttonClass: 'center',
          buttonText: __t('filter')
        }
      });

      this._configure(options);
    }
  });
});
