define(function(require, exports, module) {

  "use strict";

  var $ = require('jquery');

  var Idle = module.exports;
  var timerId = null;
  var interruptionEvents = 'mousemove click keydown';

  var resetTimer = function(id, fn, ms) {
    clearTimeout(id);
    return setTimeout(fn, ms);
  };

  Idle.interrupt = function() {
    clearTimeout(timerId);

    if (typeof this.options.interrupt === 'function') {
      this.options.interrupt();
    }

    if (this.options.repeat) {
      timerId = setTimeout(this.fn, this.ms);
    } else {
      this.unbindEvents();
    }
  };

  Idle.bindEvents = function() {
    $(document).on(interruptionEvents, this.interrupt.bind(this));
  };

  Idle.unbindEvents = function() {
    $(document).off(interruptionEvents, this.interrupt);
  };

  Idle.start = function(options) {
    var self = this;

    this.ms = options.delay;
    this.options = options;

    this.fn = function() {
      // stop listening to events after the callback
      self.unbindEvents();
      options.timeout();
    };

    this.bindEvents();

    timerId = resetTimer(timerId, this.fn, this.ms);
  };

});