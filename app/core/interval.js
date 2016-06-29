define(function() {
  var interval = function(callback, wait) {
    setTimeout(function() {
      callback();
      interval(callback, wait);
    }, wait);
  };

  return interval;
});
