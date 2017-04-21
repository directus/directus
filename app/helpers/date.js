define(['moment'], function (moment) {

  var helper = {};

  // source: http://stackoverflow.com/a/26131085
  helper.monthDateRange = function (year, month, value) {
    if (moment.isMoment(year)) {
      var m = year;

      value = month;
      year = m.format('YYYY');
      month = m.format('M');
    }

    // month in moment is 0 based
    var startDate = moment([year, month - 1]);

    // Clone the value before .endOf()
    var endDate = moment(startDate).endOf('month');

    if (value === true) {
      // NOTE: Add time so dates are inclusive
      startDate = startDate.format('YYYY-MM-DD') + ' 00:00:00';
      endDate = endDate.format('YYYY-MM-DD') + ' 23:59:59';
    }

    // make sure to call toDate() for plain JavaScript date type
    return { start: startDate, end: endDate };
  };

  helper.range = function (from, to) {
    var range = [];
    from = moment(from);
    to = moment(to);

    var current = from.toDate();
    while (current <= to.toDate()) {
      range.push(moment(current));
      current = new Date(current.setDate(current.getDate() + 1));
    }

    return range;
  };

  helper.rangeUntil = function (to, days) {
    var from;

    // remove one day to include `to` date
    days = parseInt(days, 10) - 1;
    to = moment(to);
    from = moment().subtract(days, 'days');

    return this.range(from, to);
  };

  helper.isToday = function (date) {
    date = moment(date);

    return moment().diff(date, 'days') == 0;
  };

  return helper;
});
