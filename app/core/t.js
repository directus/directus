define(['underscore', 'helpers/string', 'polyglot'], function(_, StringHelper, Polyglot) {
  var options = window.directusData;
  var locale = options.locale || 'en';
  var phrases = options.phrases;
  var polyglot = new Polyglot({locale: locale, phrases: phrases});

  var __t = function(key, data) {
    return polyglot.has(key) ? polyglot.t(key, data) : key;
  };

  __t.polyglot = polyglot;

  return __t;
});
