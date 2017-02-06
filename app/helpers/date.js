define(function() {
  var moment = require('moment');

  var helper = {};

  // source: http://stackoverflow.com/a/26131085
  helper.monthDateRange = function(year, month, value) {
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
      startDate = startDate.format('YYYY-MM-DD');
      endDate = endDate.format('YYYY-MM-DD');
    }

    // make sure to call toDate() for plain JavaScript date type
    return { start: startDate, end: endDate };
  };

  return helper;
});
