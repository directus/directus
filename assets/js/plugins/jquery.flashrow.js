(function($) {
  $.fn.flashRow = function() {
    var transitionEvents = [
      'webkitTransitionEnd',
      'otransitionend',
      'oTransitionEnd',
      'msTransitionEnd',
      'transitionend'
    ];
    var self = this;
    var classRemoved = false;
    var t = setTimeout(function() {
      clearTimeout(t);
      if(!classRemoved) {
        self.removeClass('highlight');
      }
    }, 1000);

    this.one(transitionEvents.join(','), function(e) {
      self.removeClass('highlight');
      classRemoved = true;
    });

    this.addClass('highlight');
  };
})(window.jQuery);