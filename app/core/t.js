define(['underscore', 'polyglot'], function(_, Polyglot) {
  var options = window.directusData;
  var locale = options.locale || 'en';
  var phrases = options.phrases;
  var polyglot = new Polyglot({locale: locale, phrases: phrases});

  return function(key, data) {
    return polyglot.has(key) ? polyglot.t(key, data) : key;
  };
});
