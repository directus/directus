define(['moment'], function (moment) {

  var secondsInMs = 1000;
  var minutesInMs = secondsInMs * 60;
  var hoursInMs = minutesInMs * 60;
  var daysInMs = hoursInMs * 24;
  var weeksInMs = daysInMs * 7;
  var monthsInMs = daysInMs * 30;
  var yearsInMs = monthsInMs * 12;

  var thresholds = {
    s: secondsInMs,
    m: minutesInMs,
    h: hoursInMs,
    d: daysInMs,
    w: weeksInMs,
    // M: monthsInMs,
    y: yearsInMs
  };

  var round = Math.round;

  moment.fn.timeAgo = function (type) {
    var ms = Math.abs(moment().diff(this));
    var duration = moment.duration(ms).abs();
    var isNow = ms <= 3000;
    var value, letter, output;

    if (isNow) {
      value = 'just ';
      letter = 'now';
    } else {
      for (var key in thresholds) {
        if (thresholds[key] < ms) {
          value = round(duration.as(key));
          letter = key;
        }
      }
    }

    switch (type) {
      case 'small':
        // 3m 1w 2y
        output = isNow ? letter : (value + letter);
        break;
      case 'medium':
        // 3m ago, 1w ago, 2y ago
        if (isNow) {
          output = value + letter;
        } else {
          output = moment.localeData().relativeTime(null, false, 'past').replace(/%s/i, value + letter);
        }
        break;
      case 'large':
      default:
        // 3 minutes ago, 1 week ago, 2 years ago
        output = this.fromNow();
        break;
    }

    return output;
  };

  return moment;
});
