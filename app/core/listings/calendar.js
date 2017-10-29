define([
  'app',
  'underscore',
  'core/listings/baseView',
  'core/listings/calendarAbstract',
  'moment',
  'core/t',
  'helpers/date'
], function(app, _, BaseView, CalendarAbstract, moment, __t, DateHelper) {

  return {
    id: 'calendar',

    icon: CalendarAbstract.icon,

    dataTypes: CalendarAbstract.dataTypes,

    View: BaseView.extend(_.extend(CalendarAbstract.View, {
      // override keys here
    })
  )}
});
