define(['underscore', 'core/widgets/ButtonWidget', 'core/t'], function (_, ButtonWidget, __t) {
  return ButtonWidget.extend({
    widgetId: 'filter-toggle',

    constructor: function (options) {
      options = options || {};
      options.onClick = function (event) {
        $('.filter').toggleClass('responsive-active filter-dropdown-open');
      };

      ButtonWidget.prototype.constructor.apply(this, [options]);

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
